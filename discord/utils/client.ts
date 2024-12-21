import * as net from 'net';

export class SocketClient {

    private host: string;
    private port: number;

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
    }

    async sendAudioBuffer(audioBuffer: Buffer) {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();

            socket.connect(this.port, this.host, () => {
                // Crear un objeto con el tipo 'audio' y el contenido (convertido a base64)
                const message = JSON.stringify({
                    type: 'audio',
                    content: audioBuffer.toString('base64')  // Codificar el audio en base64
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

    async sendText(text: string) {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();

            socket.connect(this.port, this.host, () => {
                // Crear un objeto con el tipo 'text' y el contenido
                const message = JSON.stringify({
                    type: 'text',
                    content: text
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
