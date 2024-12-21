import { VoiceReceiver, VoiceConnection, EndBehaviorType, entersState, VoiceConnectionStatus } from '@discordjs/voice';
import { VoiceBuffer } from '../utils/buffer';
import { voiceParser } from '../dependencies';

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
function createListener(receiver: VoiceReceiver, userId: string, buffer: VoiceBuffer): void {
    const opusStream = receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 3000,
        },
    });

    opusStream.on('data', (chunk) => {
        if (opusStream.readableEnded) {
            console.log('El flujo ha terminado de emitir datos.');
            return;
        }

        // Añadir el chunk de audio al buffer
        buffer.addChunk(chunk);
        console.log('Recibido chunk de audio:', chunk);
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