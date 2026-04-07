// ── MINIMAP ───────────────────────────────────────────────────────────────────
// Renders a top-down satellite-style overview in a corner canvas.

import { CELL_SIZE, GRID_SIZE } from './config.js';

export class Minimap {
    constructor(canvasId, scene, camera) {
        this.canvas  = document.getElementById(canvasId);
        this.ctx     = this.canvas.getContext('2d');
        this.scene   = scene;
        this._camera = camera;
        this._size   = this.canvas.width;
        this._scale  = this._size / GRID_SIZE;
        this._visible = true;
        this._labelHitboxes = [];

        window.addEventListener('keydown', e => {
            if (e.key === 'm' || e.key === 'M') {
                this._visible = !this._visible;
                this.canvas.style.display = this._visible ? 'block' : 'none';
            }
        });

        this.canvas.addEventListener('click', (e) => {
            if (!this._visible) return;
            const rect   = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width  / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const clickX = (e.clientX - rect.left) * scaleX;
            const clickY = (e.clientY - rect.top)  * scaleY;

            for (const item of this._labelHitboxes) {
                if (clickX >= item.x1 && clickX <= item.x2 &&
                    clickY >= item.y1 && clickY <= item.y2) {
                    this._teleportTo(item.building);
                    return;
                }
            }
        });
    }

    _teleportTo(building) {
        if (!this._camera) return;
        const worldX = (building.mapX + building.sizeX / 2) * CELL_SIZE;
        const worldZ = (building.mapY + building.sizeY / 2) * CELL_SIZE;
        this._camera.position.x = worldX;
        this._camera.position.y = 1.75;
        this._camera.position.z = worldZ;
    }

    update(cameraWorldPos) {
        if (!this._visible) return;
        this._draw(cameraWorldPos);
    }

    _draw(camPos) {
        const ctx = this.ctx;
        const S   = this._scale;
        const W   = this._size;

        this._labelHitboxes = [];

        // ── background (grass) ───────────────────────────────────────────────
        ctx.fillStyle = '#4a7c3f';
        ctx.fillRect(0, 0, W, W);

        // ── grid (subtle) ────────────────────────────────────────────────────
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth   = 0.5;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath(); ctx.moveTo(i * S, 0);  ctx.lineTo(i * S, W);  ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * S);  ctx.lineTo(W, i * S);  ctx.stroke();
        }

        // ── player dot ───────────────────────────────────────────────────────
        if (camPos) {
            const gx = camPos.x / CELL_SIZE;
            const gz = camPos.z / CELL_SIZE;
            const px = gx * S;
            const pz = gz * S;

            const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
            ctx.beginPath();
            ctx.arc(px, pz, 5 + pulse * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 180, 255, ${0.3 + 0.2 * pulse})`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(px, pz, 4, 0, Math.PI * 2);
            ctx.fillStyle   = '#00cfff';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth   = 1.5;
            ctx.fill();
            ctx.stroke();

            if (this.scene.activeCamera) {
                const angle = this.scene.activeCamera.rotation
                            ? this.scene.activeCamera.rotation.y
                            : 0;
                ctx.save();
                ctx.translate(px, pz);
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(0, -8);
                ctx.lineTo(3.5, 0);
                ctx.lineTo(-3.5, 0);
                ctx.closePath();
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.restore();
            }
        }

        // ── border ───────────────────────────────────────────────────────────
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth   = 1.5;
        ctx.strokeRect(0, 0, W, W);

        // ── legend ───────────────────────────────────────────────────────────
        ctx.font         = 'bold 9px sans-serif';
        ctx.fillStyle    = 'rgba(255,255,255,0.7)';
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('M  toggle  |  click building to teleport', 4, W - 3);
    }
}
