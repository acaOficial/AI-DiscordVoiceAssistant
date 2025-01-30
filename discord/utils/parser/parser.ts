export interface InputParser {
    speechToText(audioBuffer: Buffer): Promise<string>;
    textResponse(text: string): Promise<string>;
}
