// weather.js


// ── WEATHER SYSTEM (Lyon, France) ─────────────────────────────────────────────

const WEATHER_CONFIG = {
    apiKey:    "ab16871ed2f23f9a204a9b7c1c7dd6c0",
    lat:       45.7640,
    lon:        4.8357,
    refreshMs: 10 * 60 * 1000,
};

export const weatherState = {
    temp: undefined,
    description: '',
    iconUrl: ''
};

export function initWeather(scene, sun, ambient, skyMat) {
    startWeatherSystem(scene, sun, ambient, skyMat);
}

async function fetchWeather() {
    const { apiKey, lat, lon } = WEATHER_CONFIG;
    const url = `https://api.openweathermap.org/data/2.5/weather`
              + `?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    try {
        const res  = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const now = Math.floor(Date.now() / 1000);
        weatherState.sunriseTs   = data.sys.sunrise;
        weatherState.sunsetTs    = data.sys.sunset;
        weatherState.isDay       = now >= data.sys.sunrise && now < data.sys.sunset;
        weatherState.cloudiness  = (data.clouds?.all ?? 0) / 100;
        weatherState.description = data.weather[0].description;
        weatherState.condId      = data.weather[0].id;
        weatherState.temp        = Math.round(data.main.temp);
        weatherState.feelsLike   = Math.round(data.main.feels_like);
        weatherState.humidity    = data.main.humidity;
        weatherState.windKmh     = Math.round((data.wind?.speed ?? 0) * 3.6);

        const id = data.weather[0].id;
        weatherState.storm = id >= 200 && id < 300;
        weatherState.rain  = id >= 300 && id < 600;
        weatherState.snow  = id >= 600 && id < 700;
        weatherState.fog   = id >= 700 && id < 800;

    } catch (err) {
        console.warn('[WeatherSystem] fetch failed:', err);
    }
}

function applyWeatherToScene(scene, sun, ambient, skyMat) {
    const { isDay, cloudiness, rain, snow, fog, storm } = weatherState;
    const now = Math.floor(Date.now() / 1000);
    const { sunriseTs, sunsetTs } = weatherState;
    const dayLen = sunsetTs - sunriseTs;
    const t = dayLen > 0 ? Math.max(0, Math.min(1, (now - sunriseTs) / dayLen)) : 0.5;

    if (isDay) {
        const angle = Math.PI * t;
        sun.direction = new BABYLON.Vector3(-Math.cos(angle), -Math.abs(Math.sin(angle)) - 0.1, -0.5);

        const baseSunIntensity = 1.2 - cloudiness * 0.8 - (storm ? 0.3 : 0);
        sun.intensity = Math.max(0.05, baseSunIntensity);
        sun.diffuse   = new BABYLON.Color3(1, 0.95 - cloudiness * 0.1, 0.85 - cloudiness * 0.2);

        ambient.intensity = 0.6 - cloudiness * 0.3;
        ambient.diffuse   = new BABYLON.Color3(
            0.6 - cloudiness * 0.2,
            0.7 - cloudiness * 0.2,
            0.9
        );

        if (fog || rain || storm) {
            skyMat.emissiveColor = new BABYLON.Color3(0.35, 0.37, 0.4);
        } else if (snow) {
            skyMat.emissiveColor = new BABYLON.Color3(0.7, 0.75, 0.8);
        } else {
            const blue = 1.0 - cloudiness * 0.5;
            skyMat.emissiveColor = new BABYLON.Color3(
                0.3 + cloudiness * 0.3,
                0.55 + cloudiness * 0.15,
                blue
            );
        }

        if (rain || storm) {
            scene.fogMode    = BABYLON.Scene.FOGMODE_EXP;
            scene.fogDensity = 0.008 + (storm ? 0.005 : 0);
            scene.fogColor   = new BABYLON.Color3(0.4, 0.4, 0.45);
        } else if (fog) {
            scene.fogMode    = BABYLON.Scene.FOGMODE_EXP;
            scene.fogDensity = 0.02;
            scene.fogColor   = new BABYLON.Color3(0.7, 0.7, 0.7);
        } else {
            scene.fogMode  = BABYLON.Scene.FOGMODE_LINEAR;
            scene.fogStart = 300;
            scene.fogEnd   = 600;
            scene.fogColor = new BABYLON.Color3(0.7, 0.8, 1.0);
        }

    } else {
        sun.direction = new BABYLON.Vector3(0.3, -1, 0.5);
        sun.intensity = 0.08 - cloudiness * 0.06;
        sun.diffuse   = new BABYLON.Color3(0.7, 0.75, 1.0);

        ambient.intensity = 0.15;
        ambient.diffuse   = new BABYLON.Color3(0.2, 0.2, 0.4);

        skyMat.emissiveColor = cloudiness > 0.6
            ? new BABYLON.Color3(0.03, 0.03, 0.05)
            : new BABYLON.Color3(0.02, 0.02, 0.12);

        scene.fogMode  = BABYLON.Scene.FOGMODE_LINEAR;
        scene.fogStart = 150;
        scene.fogEnd   = 400;
        scene.fogColor = new BABYLON.Color3(0.05, 0.05, 0.1);
    }
}

export function startWeatherSystem(scene, sun, ambient, skyMat) {
    async function refresh() {
        await fetchWeather();
        applyWeatherToScene(scene, sun, ambient, skyMat);
    }

    refresh();
    setInterval(refresh, WEATHER_CONFIG.refreshMs);
    setInterval(() => applyWeatherToScene(scene, sun, ambient, skyMat), 60_000);
}

// ── WEATHER WIDGET ────────────────────────────────────────────────────────────

export class WeatherWidget {

    constructor(canvasId) {
        this.canvas   = document.getElementById(canvasId);
        this.ctx      = this.canvas.getContext('2d');
        this._visible = true;
        this._owmLogo = null;

        this._loadLogo();
        setInterval(() => this._draw(), 1000);

        window.addEventListener('keydown', e => {
            if (e.key === 'w' || e.key === 'W') {
                this._visible = !this._visible;
                this.canvas.style.display = this._visible ? 'block' : 'none';
            }
        });
    }

    _loadLogo() {
        this._owmLogo = new Image();
        this._owmLogo.src = 'https://openweathermap.org/themes/openweathermap/assets/img/logo_white_cropped.png';
    }

    _draw() {
        if (!this._visible) return;
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.roundRect(0, 0, W, H, 10);
        ctx.fill();

        const now = new Date();
        const timeStr = now.toLocaleTimeString('fr-FR', {
            timeZone: 'Europe/Paris',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        const dateStr = now.toLocaleDateString('fr-FR', {
            timeZone: 'Europe/Paris',
            weekday: 'short', day: 'numeric', month: 'short'
        });

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, W / 2, 28);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(dateStr, W / 2, 44);

        const d = weatherState;
        if (d && d.temp !== undefined) {
            if (d.iconUrl) {
                const img = new Image();
                img.src = d.iconUrl;
                img.onload = () => ctx.drawImage(img, W/2 - 20, 48, 40, 40);
                try { ctx.drawImage(img, W/2 - 20, 48, 40, 40); } catch(e) {}
            }

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(d.temp)}°C`, W / 2, 104);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaddff';
            ctx.fillText(d.description || '', W / 2, 118);
        } else {
            ctx.fillStyle = '#888888';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Loading weather…', W / 2, 75);
        }

        if (this._owmLogo && this._owmLogo.complete) {
            ctx.globalAlpha = 0.4;
            ctx.drawImage(this._owmLogo, W - 50, H - 16, 40, 10);
            ctx.globalAlpha = 1.0;
        }
    }
}
