import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
    try {
        const {
            description,
            imageUrl,
            cameraMovement = 'static',
            shotType = 'medium',
            angle = 'eye_level',
            model = 'minimax' // minimax | kling | svd
        } = await request.json();

        // Mapeo de UI a comandos MiniMax/Kling
        const cameraCommands = {
            static: '',
            dolly_in: '[Push in]',
            dolly_out: '[Pull out]',
            pan_left: '[Pan left]',
            pan_right: '[Pan right]',
            orbit: '[Orbit]',
            tilt_up: '[Tilt up]',
            tilt_down: '[Tilt down]',
        };

        const shotTypes = {
            long: 'wide establishing shot',
            medium: 'medium shot at waist level',
            close: 'close-up shot',
            first_plane: 'extreme close-up, intimate framing',
            very_close: 'macro detail shot',
        };

        const angles = {
            eye_level: 'camera at eye level, neutral perspective',
            high: 'high angle shot looking down',
            low: 'low angle shot looking up, dramatic',
            bird: 'bird\'s eye view from directly above',
        };

        // Construir prompt base con contexto cinematográfico
        const systemPrompt = `Eres un director de fotografía experto. 
Creas prompts para motores de generación de video (${model}).

REGLAS:
- Si es MiniMax: Usa comandos [entre corchetes] para movimientos
- Si es Kling: Describe movimientos en lenguaje natural técnico
- Si es SVD: Enfócate en transformaciones sutiles
- SIEMPRE incluye: iluminación, textura, calidad (4K/8K)
- Estilo: Cinematográfico profesional, no ilustración

FORMATO DE SALIDA (JSON):
{
  "visual_prompt": "Prompt técnico optimizado para ${model}",
  "narration_script": "Guion para voz en off (30-40 palabras)",
  "technical_params": {
    "duration": 6-10,
    "fps": 25,
    "motion_intensity": "low|medium|high"
  }
}`;

        const userPrompt = `
PRODUCTO/ESCENA: ${description}
IMAGEN REFERENCIA: ${imageUrl}

CONFIGURACIÓN SELECCIONADA:
- Movimiento cámara: ${cameraMovement}
- Tipo de plano: ${shotType}
- Ángulo: ${angle}
- Motor: ${model}

Genera un prompt cinematográfico profesional que:
1. Incorpore el movimiento: ${cameraCommands[cameraMovement] || 'estático'}
2. Use el encuadre: ${shotTypes[shotType]}
3. Aplique el ángulo: ${angles[angle]}
4. Optimice para el motor ${model}
5. Agregue iluminación dramática y detalles técnicos

${model === 'minimax' ? 'USA COMANDOS [entre corchetes] para movimientos de cámara.' : ''}
${model === 'kling' ? 'Describe movimientos de forma natural pero técnica.' : ''}
`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const result = JSON.parse(completion.choices[0].message.content);

        return NextResponse.json({
            success: true,
            ...result,
            metadata: {
                camera_movement: cameraMovement,
                shot_type: shotType,
                angle: angle,
                model: model,
            }
        });

    } catch (error) {
        console.error('Brain API error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
