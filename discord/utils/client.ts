import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';
import * as os from 'os';

export class SocketClient {
    private host: string;
    private port: number;

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
    }

    // Método para guardar el buffer de audio en un archivo temporal
    private saveAudioBufferToFile(audioBuffer: Buffer): string {
        const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.pcm`); // Crear ruta de archivo temporal
        fs.writeFileSync(tempFilePath, audioBuffer);  // Guardar el buffer en el archivo temporal
        return tempFilePath;
    }

    async sendAudioBuffer(audioBuffer: Buffer) {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();

            console.log('Enviando audio al servidor:', audioBuffer.length, 'bytes');

            // Guardar el buffer de audio en un archivo
            const audioFilePath = this.saveAudioBufferToFile(audioBuffer);
            console.log('Enviando archivo de audio:', audioFilePath);

            socket.connect(this.port, this.host, () => {
                // Crear un objeto con el tipo 'audio' y la ruta del archivo en lugar del contenido base64
                const message = JSON.stringify({
                    type: 'audio',
                    content: audioFilePath, // Usar la ruta del archivo de audio
                });
                socket.write(message);
            });

            let response = '';
            socket.on('data', (data: Buffer) => {
                response += data.toString();
            });

            socket.on('end', () => {
                resolve(response);
                fs.unlinkSync(audioFilePath);
            });

            socket.on('error', (err: Error) => {
                reject(`Error al conectar con el servidor: ${err.message}`);
                fs.unlinkSync(audioFilePath);
            });
        });
    }

    async sendText(text: string) {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();

            socket.connect(this.port, this.host, () => {
                // Crear un objeto con el tipo 'text' y el contenido
                console.log('Enviando mensaje al servidor:', text);
                const message = JSON.stringify({
                    type: 'text',
                    content: text,
                });
                socket.write(message);
            });

            let response = '';
            socket.on('data', (data: Buffer) => {
                response += data.toString();
            });

            socket.on('end', () => {
                resolve(response);
            });

            socket.on('error', (err: Error) => {
                reject(`Error al conectar con el servidor: ${err.message}`);
            });
        });
    }
}
