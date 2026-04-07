//in main


// ── HIGHTLIGHT LAYER ───────────────────────────────────────────────────────
// Make sure this is created once when the scene loads
const hl = new BABYLON.HighlightLayer("hl", scene, {
    isStroke: true,
    mainTextureFixedSize: 512
});
hl.innerGlow = false;
hl.outerGlow = true;
hl.blurHorizontalSize = HIGHLIGHT_STROKEWIDTH;
hl.blurVerticalSize = HIGHLIGHT_STROKEWIDTH;


hl.onBeforeRenderMeshToEffect.add(() => {
    scene.meshes.forEach(m => {
        if (m.material) {
            m.metadata = m.metadata || {};
            // Save original states
            m.metadata.savedAlpha = m.material.transparencyMode;
            m.metadata.savedBFC = m.material.backFaceCulling;
            m.metadata.savedDepthWrite = m.material.forceDepthWrite;

            // Force solid shape for the stencil mask
            m.material.transparencyMode = 0; // Opaque
            m.material.backFaceCulling = true; // Hides inside faces
            m.material.forceDepthWrite = true; // Forces proper 3D occlusion
        }
    });
});

hl.onAfterRenderMeshToEffect.add(() => {
    scene.meshes.forEach(m => {
        if (m.material && m.metadata?.savedAlpha !== undefined) {
            // Restore original states
            m.material.transparencyMode = m.metadata.savedAlpha;
            m.material.backFaceCulling = m.metadata.savedBFC;
            m.material.forceDepthWrite = m.metadata.savedDepthWrite;
        }
    });
});

let highlightedMeshes = [];

function clearHighlights() {
    highlightedMeshes.forEach(m => {
        try { hl.removeMesh(m); } catch(e) {}
    });
    highlightedMeshes = [];
}

function getModelRoot(mesh) {
    let current = mesh;
    while (current.parent && current.parent.name !== "__root__") {
        current = current.parent;
    }
    return current;
}

scene.onBeforeRenderObservable.add(() => {
    const ray = camera.getForwardRay(INTERACT_DISTANCE);
    const hit = scene.pickWithRay(ray, mesh => mesh.isPickable && mesh.isEnabled());

    clearHighlights();

    if (hit?.pickedMesh && hl) {  // Add hl check
    try {
        // Clear previous highlights
        clearHighlights();

        // Get root node
        const rootNode = getModelRoot(hit.pickedMesh);
        if (!rootNode) return;

        // Add root if it's a mesh
        if (rootNode instanceof BABYLON.AbstractMesh) {
            hl.addMesh(rootNode, HIGHLIGHT_COLOR);
            highlightedMeshes.push(rootNode);
        }

        // Process child meshes
        const allMeshes = rootNode.getChildMeshes(false);
        allMeshes.forEach(m => {
            if (!m || !m.isVisible || highlightedMeshes.includes(m)) return;
            if (m.getTotalVertices() < 100) return;
            if (m.metadata?.highlightable === false) return;

            hl.addMesh(m, HIGHLIGHT_COLOR);
            highlightedMeshes.push(m);
        });
    } catch (e) {
        console.error("Highlight error:", e);
    }
}





});




