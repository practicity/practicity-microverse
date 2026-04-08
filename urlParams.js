// urlParams.js

import { GRID_SIZE, CELL_SIZE } from './config.js';

/**
 * @param {number} defaultCellX
 * @param {number} defaultCellZ
 * @param {number} defaultHeight  - CAMERA_HEIGHT
 * @param {number} defaultYaw     - radians, default 0 = looking +Z (north)
 */


export const interactMode = new URLSearchParams(window.location.search).get('interact') === 'true';

export function getStartPosition(defaultCellX, defaultCellZ, defaultHeight, defaultYaw = 0, defaultPitch = 0) {
    const params = new URLSearchParams(window.location.search);
    const loc    = params.get("loc");   // x,z  or x,y,z
    const yaw    = params.get("yaw");   // radians
    const pitch  = params.get("pitch"); // radians, positive = look down
    const bound  = GRID_SIZE * CELL_SIZE;

    const defaultPos = new BABYLON.Vector3(
        defaultCellX + 0.5,
        defaultHeight,
        defaultCellZ
    );

    const parseAngle = (val, def) =>
        val !== null && !isNaN(parseFloat(val)) ? parseFloat(val) : def;

    if (!loc) {
        return {
            position: defaultPos,
            yaw:      defaultYaw,
            pitch:    defaultPitch,
            fromURL:  false
        };
    }

    const parts = loc.split(",").map(parseFloat);

    if (parts.some(isNaN)) {
        console.warn("[URL] Invalid loc param — using config default");
        return { position: defaultPos, yaw: defaultYaw, pitch: defaultPitch, fromURL: false };
    }

    // Support both  ?loc=x,z  and  ?loc=x,y,z
    let x, y, z;
    if (parts.length === 3) {
        [x, y, z] = parts;
    } else {
        [x, z] = parts;
        y      = defaultHeight;
    }

    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

    return {
        position: new BABYLON.Vector3(
            clamp(x, 0, bound),
            clamp(y, 0.5, 50),
            clamp(z, 0, bound)
        ),
        yaw:     parseAngle(yaw,   defaultYaw),
        pitch:   parseAngle(pitch, defaultPitch),
        fromURL: true
    };
}



// ── Sync URL as player moves ──────────────────────────────────────────────────

let _syncTimer = null;

export function syncURLWithPosition(camera) {
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => {
        const p   = camera.position;
        const yaw = camera.rotation.y;

        const existing = new URLSearchParams(window.location.search);
        const params = new URLSearchParams({
            loc: `${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}`,
            yaw: yaw.toFixed(3)
        });
        if (existing.has('interact')) params.set('interact', existing.get('interact'));
        window.history.replaceState({}, "", `?${params.toString()}`);
    }, 600);
}
