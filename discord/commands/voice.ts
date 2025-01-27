import {
    VoiceReceiver,
    VoiceConnection,
    EndBehaviorType,
    entersState,
    VoiceConnectionStatus,
    AudioReceiveStream,
} from '@discordjs/voice';
import { VoiceBuffer } from '../utils/buffer';
import { voiceParser } from '../dependencies';
import { TextAnalyzer } from '../utils/textAnalyzer';
import { OpusEncoder } from '@discordjs/opus';
import {
    AudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
} from '@discordjs/voice';
import fs from 'fs';
import path from 'path';

let activateUserID: string | null = null;
let soundOn = false;
const listeners = new Map<string, AudioReceiveStream>();
const player = new AudioPlayer();

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
        // Si ya hay un usuario activo, no procesar nuevas llamadas
        if (activateUserID && activateUserID !== userId) {
            console.log(`Ignorando al usuario ${userId} porque ${activateUserID} ya está activo.`);
            return;
        }

        console.log(`El usuario ${userId} ha empezado a hablar.`);
        const buffer = new VoiceBuffer(userId, voiceParser);

        // Que no cree un nuevo oyente si ya existe uno para el usuario
        if (!listeners.has(userId)) {
            createListener(receiver, userId, buffer, connection).then((stream) => {
                listeners.set(userId, stream);
            });
        }

        if (activateUserID === userId) {
            destroyListeners(userId);
        }
    });

    receiver.speaking.on('end', (userId) => {
        if (activateUserID === userId) {
            console.log(`El usuario activo ${userId} ha dejado de hablar.`);
        }
    });
}

/**
 * Función para crear un oyente de audio.
 * @param receiver - El receptor de voz de tipo `VoiceReceiver`.
 * @param userId - El ID del usuario de tipo `string`.
 * @param buffer - La instancia de `VoiceBuffer` para almacenar los datos de voz.
 */
async function createListener(receiver: VoiceReceiver, userId: string, buffer: VoiceBuffer, connection: VoiceConnection): Promise<AudioReceiveStream> {
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
            const decoded = encoder.decode(chunk);
            if (decoded && decoded.length > 0) {
                buffer.addChunk(Buffer.from(decoded));
            }
        } catch (error) {
            console.error('Error al decodificar el paquete Opus:', error);
        }
    });

    opusStream.on('end', async () => {
        console.log('El flujo de audio ha terminado.');
        const text = await buffer.convertToText();
        console.log(`Texto resultante: ${text} del usuario ${userId}`);

        // Activar solo si aún no hay un usuario activo
        if (!activateUserID) {
            const result = textAnalyzer.processText(text);

            if (result) {
                activateUserID = userId;
                destroyAllListeners();
                await playNotificationSound(connection, 'notification.mp3');
            } 

            return
        }

        if (!soundOn) {
            await playGeneratedAudio(connection, text);
            activateUserID = null;
        }
    });

    opusStream.on('error', (err) => {
        console.error('Error en la transmisión de audio:', err);
    });

    return opusStream;
}

/**
 * Elimina todos los oyentes excepto el del usuario especificado.
 * @param exceptUserId - El ID del usuario que no se debe eliminar.
 */
function destroyListeners(exceptUserId: string) {
    listeners.forEach((stream, id) => {
        if (id !== exceptUserId) {
            stream?.destroy();
            listeners.delete(id);
        }
    });
}

/**
 * Destruye todos los oyentes de audio.
 * @returns Nada.
 */
function destroyAllListeners() {
    listeners.forEach((stream) => {
        stream?.destroy();
    });
    listeners.clear();
}

/**
 * Reproduce un archivo de audio generado por `voiceParser.textResponse` y espera hasta que termine.
 * @param connection - La conexión al canal de voz.
 * @param text - El texto que se convertirá a audio.
 * @returns Una promesa que se resuelve cuando la reproducción finaliza.
 */
async function playGeneratedAudio(connection: VoiceConnection, text: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            const audioFilePath = await voiceParser.textResponse(text);

            if (!audioFilePath) {
                reject(new Error('No se generó un archivo de audio.'));
                return;
            }

            console.log(`Reproduciendo archivo de audio: ${audioFilePath}`);
            const resource = createAudioResource(audioFilePath);

            connection.subscribe(player);
            player.play(resource);
            soundOn = true;

            player.once(AudioPlayerStatus.Idle, () => {
                console.log('Reproducción finalizada.');
                fs.unlink(audioFilePath, (err) => {
                    if (err) console.error('Error al eliminar el archivo de audio:', err);
                });
                soundOn = false;
                resolve();
            });

            player.on('error',(err) => {
                console.error('Error al reproducir el archivo de audio:', err);
                soundOn = false;
                reject(err);
            });
        } catch (error) {
            soundOn = false;
            reject(error);
        }
    });
}

/**
 * Reproduce un sonido de notificación.
 * @param connection - La conexión al canal de voz.
 * @param fileName - El nombre del archivo de sonido.
 */
async function playNotificationSound(connection: VoiceConnection, fileName: string): Promise<void> {
    const filePath = path.join(__dirname, '../sounds', fileName);
    console.log(`Reproduciendo sonido de notificación: ${filePath}`);
    if (!fs.existsSync(filePath)) {
        console.error(`El archivo de sonido no existe: ${filePath}`);
        return;
    }

    const resource = createAudioResource(filePath);
    connection.subscribe(player);
    player.play(resource);

    await new Promise<void>((resolve) => {
        player.once(AudioPlayerStatus.Idle, resolve);
    });
}

export default execute;
