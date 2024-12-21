import { VoiceParser } from "../parser";

import { SocketClient } from "../../client";

export class AiParser implements VoiceParser {
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
}
