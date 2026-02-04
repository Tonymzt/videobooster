/**
 * Generador de efectos Ken Burns aleatorios
 * Cada escena tendrá un movimiento diferente
 */

const EFFECTS = {
    ZOOM_IN: 'zoom_in',
    ZOOM_OUT: 'zoom_out',
    PAN_RIGHT: 'pan_right',
    PAN_LEFT: 'pan_left',
    ZOOM_PAN_RIGHT: 'zoom_pan_right',
    ZOOM_PAN_LEFT: 'zoom_pan_left',
};

/**
 * Generar filtro FFmpeg para efecto Ken Burns aleatorio
 */
function generateRandomKenBurns(duration, width = 1080, height = 1920) {
    const effects = Object.values(EFFECTS);
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];

    return generateKenBurnsEffect(randomEffect, duration, width, height);
}

/**
 * Generar filtro específico de Ken Burns
 */
function generateKenBurnsEffect(effectType, duration, width, height) {
    const fps = 30;
    const totalFrames = Math.ceil(duration * fps); // Asegurar entero

    switch (effectType) {
        case EFFECTS.ZOOM_IN:
            // Zoom gradual de 1.0 a 1.2
            return `zoompan=z='min(zoom+0.0015,1.2)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;

        case EFFECTS.ZOOM_OUT:
            // Zoom reverso de 1.2 a 1.0
            return `zoompan=z='if(lte(zoom,1.0),1.0,max(1.0,zoom-0.002))':d=${totalFrames}:s=${width}x${height}:fps=${fps}:z=1.2`;

        case EFFECTS.PAN_RIGHT:
            // Pan horizontal derecha
            return `zoompan=z=1.1:x='iw/2-(iw/zoom/2)-min(0,max(-100,${totalFrames}-on)*5)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;

        case EFFECTS.PAN_LEFT:
            // Pan horizontal izquierda
            return `zoompan=z=1.1:x='iw/2-(iw/zoom/2)+min(0,max(-100,${totalFrames}-on)*5)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;

        case EFFECTS.ZOOM_PAN_RIGHT:
            // Combinación: zoom + pan derecha
            return `zoompan=z='min(zoom+0.002,1.25)':x='iw/2-(iw/zoom/2)-min(0,max(-50,${totalFrames}-on)*3)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;

        case EFFECTS.ZOOM_PAN_LEFT:
            // Combinación: zoom + pan izquierda
            return `zoompan=z='min(zoom+0.002,1.25)':x='iw/2-(iw/zoom/2)+min(0,max(-50,${totalFrames}-on)*3)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;

        default:
            // Fallback: zoom simple
            return `zoompan=z='min(zoom+0.0015,1.15)':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
    }
}

/**
 * Obtener efecto específico por nombre
 */
function getKenBurnsEffect(effectName, duration, width, height) {
    return generateKenBurnsEffect(effectName, duration, width, height);
}

/**
 * Generar secuencia variada de efectos (no repetir el mismo consecutivamente)
 */
function generateEffectSequence(sceneCount) {
    const sequence = [];
    let lastEffect = null;

    for (let i = 0; i < sceneCount; i++) {
        const availableEffects = Object.values(EFFECTS).filter(e => e !== lastEffect);
        const randomEffect = availableEffects[Math.floor(Math.random() * availableEffects.length)];
        sequence.push(randomEffect);
        lastEffect = randomEffect;
    }

    return sequence;
}

module.exports = {
    EFFECTS,
    generateRandomKenBurns,
    getKenBurnsEffect,
    generateEffectSequence,
};
