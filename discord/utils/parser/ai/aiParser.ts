import { InputParser } from "../parser";

import { SocketClient } from "../../client";

export class AiParser implements InputParser {
    private client: SocketClient;
    
    constructor(host: string, port: number) {
        this.client = new SocketClient(host, port);
    }

    async speechToText(audioBuffer: Buffer): Promise<string> {
        try {
            const result = await this.client.sendAudioBuffer(audioBuffer) as string;
            return result;
        } catch (error) {
            console.error('Error en la conversión de audio a texto:', error);
            return Promise.resolve('');
        }
    }

    async textResponse(text: string): Promise<string> {
        try {
            const audioPath = await this.client.sendText(text) as string;
            return audioPath;
        } catch (error) {
            console.error('Error en la solicitud de respuesta de texto:', error);
            return Promise.resolve('');
        }
    }
}
