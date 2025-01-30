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
import { Mutex } from 'async-mutex';

let activateUserID: string | null = null;
const listeners = new Map<string, AudioReceiveStream>();
const player = new AudioPlayer();
const lock = new Mutex();


/**
 * Función principal que maneja la conexión de voz y sus eventos.
 * @param {VoiceConnection} connection - La conexión de voz activa para el canal de Discord.
 * @throws {Error} - Lanza un error si la conexión de voz es inválida.
 */
async function execute(connection: VoiceConnection): Promise<void> {
    if (!connection) {
        throw new Error('La conexión al canal de voz es inválida.');
    }

    await entersState(connection, VoiceConnectionStatus.Ready, 20000);

    const receiver = connection.receiver;

    receiver.speaking.on('start', (userId) => {
        lock.acquire().then(async (release) => {
            try {
                if (activateUserID && activateUserID !== userId) {
                    console.log(`Ignorando al usuario ${userId} porque ${activateUserID} ya está activo.`);
                    return;
                }

                const buffer = new VoiceBuffer(userId, voiceParser);

                if (!listeners.has(userId)){
                    console.log('Creando un nuevo oyente de audio.');
                    createListener(receiver, userId, buffer, connection).then((stream) => {
                        listeners.set(userId, stream);
                    });
                }


            } finally {
                release();
            }
        });
    });

    receiver.speaking.on('end', (userId) => {
        console.log(`El usuario ${userId} ha dejado de hablar.`);
    });
}


/**
 * Crea un oyente para capturar y procesar el audio del usuario especificado.
 * @param {VoiceReceiver} receiver - El receptor de voz de la conexión.
 * @param {string} userId - El ID del usuario cuyo audio será capturado.
 * @param {VoiceBuffer} buffer - El buffer utilizado para almacenar los datos de audio.
 * @param {VoiceConnection} connection - La conexión de voz activa.
 * @returns {Promise<AudioReceiveStream>} - Promesa que resuelve con el stream de audio recibido.
 */
async function createListener(receiver: VoiceReceiver, userId: string, buffer: VoiceBuffer, connection: VoiceConnection): Promise<AudioReceiveStream> {
    const encoder = new OpusEncoder(48000, 2);
    const textAnalyzer = new TextAnalyzer();

    const opusStream = receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 2000,
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
        const text = await buffer.convertToText();

        lock.acquire().then(async (release) => {
            try {
                if (!activateUserID && text && text.length > 0) {
                    const result = textAnalyzer.processText(text);

                    if (result) {
                        activateUserID = userId;
                        destroyAllListeners();
                        await playNotificationSound(connection, 'notification.mp3');
                    }

                    return;
                }

                if (text && text.length > 0) {
                    await playGeneratedAudio(connection, text);
                    activateUserID = null;
                }
            } finally {
                listeners.delete(userId);
                release();
            }
        });
    });

    opusStream.on('error', (err) => {
        console.error('Error en la transmisión de audio:', err);
    });

    return opusStream;
}


/**
 * Destruye todos los oyentes de audio activos y limpia el mapa de oyentes.
 * Esta función es útil para gestionar los recursos y asegurar que todos los
 * flujos de audio se cierren adecuadamente cuando ya no son necesarios.
 */
function destroyAllListeners() {
    listeners.forEach((stream) => {
        stream?.destroy();
    });
    listeners.clear();
}


/**
 * Reproduce audio generado a partir del texto procesado.
 * @param {VoiceConnection} connection - La conexión de voz a la que se envía el audio.
 * @param {string} text - El texto que ha sido convertido a audio.
 * @returns {Promise<void>} - Una promesa que se resuelve cuando el audio ha terminado de reproducirse o si ocurre un error.
 */
async function playGeneratedAudio(connection: VoiceConnection, text: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            const audioFilePath = await voiceParser.textResponse(text);

            if (!audioFilePath) {
                return;
            }

            const resource = createAudioResource(audioFilePath);

            connection.subscribe(player);
            player.play(resource);

            player.once(AudioPlayerStatus.Idle, () => {
                fs.unlink(audioFilePath, (err) => {
                    if (err) console.error('Error al eliminar el archivo de audio:', err);
                });
                resolve();
            });

            player.on('error', (err) => {
                console.error('Error al reproducir el archivo de audio:', err);
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}


/**
 * Reproduce un sonido de notificación almacenado en un archivo.
 * @param {VoiceConnection} connection - La conexión de voz donde se reproducirá el sonido.
 * @param {string} fileName - El nombre del archivo de sonido a reproducir.
 * @returns {Promise<void>} - Una promesa que se resuelve cuando el sonido ha terminado de reproducirse.
 */
async function playNotificationSound(connection: VoiceConnection, fileName: string): Promise<void> {
    const filePath = path.join(__dirname, '../sounds', fileName);
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
