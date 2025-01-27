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
import { Mutex } from 'async-mutex'; // Importar Mutex

let activateUserID: string | null = null;
const listeners = new Map<string, AudioReceiveStream>();
const player = new AudioPlayer();
const lock = new Mutex(); // Crear un cerrojo (lock)

async function execute(connection: VoiceConnection): Promise<void> {
    if (!connection) {
        throw new Error('La conexión al canal de voz es inválida.');
    }

    await entersState(connection, VoiceConnectionStatus.Ready, 20000);

    const receiver = connection.receiver;

    receiver.speaking.on('start', (userId) => {
        // Intentar adquirir el cerrojo (lock)
        lock.acquire().then(async (release) => {
            try {
                // Si ya hay un usuario activo, no procesar nuevas llamadas
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
                release(); // Liberar el cerrojo después de procesar
            }
        });
    });

    receiver.speaking.on('end', (userId) => {
        console.log(`El usuario ${userId} ha dejado de hablar.`);
    });
}

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

function destroyListeners(exceptUserId: string) {
    listeners.forEach((stream, id) => {
        if (id !== exceptUserId) {
            stream?.destroy();
            listeners.delete(id);
        }
    });
}

function destroyAllListeners() {
    listeners.forEach((stream) => {
        stream?.destroy();
    });
    listeners.clear();
}

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

            player.once(AudioPlayerStatus.Idle, () => {
                console.log('Reproducción finalizada.');
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
