import { InputParser } from "./parser/parser";

/**
 * Clase que maneja el buffer de voz de un usuario en un canal de voz.
 */
export class VoiceBuffer {

    private userId: string;
    private buffer: Buffer[];
    private parser: InputParser;

    constructor(userId: string, parser: InputParser) {
        this.userId = userId;
        this.buffer = [];
        this.parser = parser;
    }

    /**
     * Añade un chunk de audio al buffer.
     * @param chunk - El chunk de audio de tipo `Buffer`.
     */
    addChunk(chunk: Buffer) {
        this.buffer.push(chunk);
    }

    /**
     * Devuelve el contenido del buffer.
     */
    getBuffer() {
        return Buffer.concat(this.buffer);
    }

    /**
     * Convierte el contenido del buffer de voz (Opus) a PCM (WAV) y luego lo convierte a texto.
     * @returns {Promise<string>} - El texto resultante de la conversión de audio a texto.
     */
    async convertToText(): Promise<string> {
        const text = await this.parser.speechToText(this.getBuffer());
        return text;
    }
}
