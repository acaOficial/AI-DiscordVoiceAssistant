import { VoiceReceiver, VoiceConnection, EndBehaviorType, entersState, VoiceConnectionStatus } from '@discordjs/voice';
import { VoiceBuffer } from '../utils/buffer';
import { voiceParser } from '../dependencies';
import { OpusDecoder } from 'opus-decoder';
import OpusScript from 'opusscript';

//import { OpusDecoder } from '@discordjs/opus';

/**
 * Función para escuchar los usuarios en un canal de voz.
 * @param connection - La conexión al canal de voz de tipo `VoiceConnection`.
 */
async function execute(connection: VoiceConnection): Promise<void> {
    if (!connection) {
        throw new Error('La conexión al canal de voz es inválida.');
    }

    await entersState(connection, VoiceConnectionStatus.Ready, 20000);

    const receiver = connection.receiver;

    receiver.speaking.on('start', (userId) => {
        console.log(`El usuario ${userId} ha empezado a hablar.`);
        const buffer = new VoiceBuffer(userId, voiceParser);
        createListener(receiver, userId, buffer);
    });

    receiver.speaking.on('end', (userId) => {
        console.log(`El usuario ${userId} ha dejado de hablar.`);
    });
}

/**
 * Función para crear un oyente de audio.
 * @param receiver - El receptor de voz de tipo `VoiceReceiver`.
 * @param userId - El ID del usuario de tipo `string`.
 * @param buffer - La instancia de `VoiceBuffer` para almacenar los datos de voz.
 */
async function createListener(receiver: VoiceReceiver, userId: string, buffer: VoiceBuffer): Promise<void> {
    //const decoder = new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });
    //const decoder = new OpusDecoder({sampleRate: 48000, channels: 2});

    const SAMPLE_RATE = 48000; // Tasa de muestreo en Hz
    const CHANNELS = 2; // Número de canales: 1 para mono, 2 para estéreo
    const APPLICATION = OpusScript.Application.AUDIO; // Uso genérico de audio

    // Crear una instancia del decodificador OpusScript
    

    const opusStream = receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 3000,
        },
    });

    opusStream.on('data', (chunk) => {
        try {
            const decoder = new OpusScript(SAMPLE_RATE, CHANNELS, APPLICATION);
            // Decodificar el chunk de audio
            const decoded = decoder.decode(chunk); // Asumiendo que chunk es un Buffer
            if (!decoded || decoded.length === 0) {
                console.log('No se pudieron decodificar muestras.');
                return;
            }

            // Añadir el chunk de audio decodificado al buffer
            buffer.addChunk(Buffer.from(decoded));
            decoder.delete();
        } catch (error) {
            console.error('Error al decodificar el paquete Opus:', error);
        }
    });

    opusStream.on('end', async () => {
        console.log('El flujo de audio ha terminado.');
        const text = await buffer.convertToText();
        console.log(`Texto resultante: ${text}`);
    });

    opusStream.on('error', (err) => {
        console.error('Error en la transmisión de audio:', err);
    });
}

export default execute;