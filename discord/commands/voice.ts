import { VoiceReceiver, VoiceConnection, EndBehaviorType, entersState, VoiceConnectionStatus, AudioReceiveStream } from '@discordjs/voice';
import { VoiceBuffer } from '../utils/buffer';
import { voiceParser } from '../dependencies';
import { TextAnalyzer } from '../utils/textAnalyzer';
// import OpusScript from 'opusscript';
import { OpusEncoder } from '@discordjs/opus';

let activateUserID: string | null = null;
const listeners = new Map<string, AudioReceiveStream>();


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
        if (activateUserID === userId || activateUserID === null) {
            console.log(`El usuario ${userId} ha empezado a hablar.`);
            const buffer = new VoiceBuffer(userId, voiceParser);
            createListener(receiver, userId, buffer).then((stream) => {
                listeners.set(userId, stream);
            });

            if (activateUserID === userId) {
                destroyListeners(userId);
            }
        }
    });

    receiver.speaking.on('end', (userId) => {
        if (activateUserID === userId || activateUserID === null) {
            console.log(`El usuario ${userId} ha dejado de hablar.`);
        }

    });
}


/**
 * Función para crear un oyente de audio.
 * @param receiver - El receptor de voz de tipo `VoiceReceiver`.
 * @param userId - El ID del usuario de tipo `string`.
 * @param buffer - La instancia de `VoiceBuffer` para almacenar los datos de voz.
 */
async function createListener(receiver: VoiceReceiver, userId: string, buffer: VoiceBuffer): Promise<AudioReceiveStream> {
    // Crear una instancia del codificador OpusEncoder
    const encoder = new OpusEncoder(48000, 2);
    const textAnalyzer = new TextAnalyzer();

    const opusStream = receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 3000,
        },
    });

    opusStream.on('data', (chunk) => {
        try {

            // Codificar el chunk de audio
            const decoded = encoder.decode(chunk); // Asumiendo que chunk es un Buffer
            if (!decoded || decoded.length === 0) {
                console.log('No se pudieron codificar muestras.');
                return;
            }
            
            // Añadir el chunk de audio codificado al buffer
            buffer.addChunk(Buffer.from(decoded));
        } catch (error) {
            console.error('Error al decodificar el paquete Opus:', error);
        }
    });

    opusStream.on('end', async () => {
        // Añadir el buffer acumulado al buffer de voz
        console.log('El flujo de audio ha terminado.');
        const text = await buffer.convertToText();
        console.log(`Texto resultante: ${text}`);
        
        if (!activateUserID){
            const result = textAnalyzer.processText(text);

            if (result) {
                activateUserID = userId;
            }
            return;
        }

        voiceParser.textResponse(text).then((response) => {
            console.log(`Respuesta del servidor: ${response}`);
        });



    });

    opusStream.on('error', (err) => {
        console.error('Error en la transmisión de audio:', err);
    });


    return opusStream;
}


function destroyListeners(exceptUserId: string) {
    listeners.forEach((stream, id) => {
        if (id !== exceptUserId) {
            if (stream) {
                stream.destroy();
            }
            listeners.delete(id); 
        }
    });
    console.log(`Todos los listeners han sido destruidos, excepto el de ${exceptUserId}.`);
}



export default execute;