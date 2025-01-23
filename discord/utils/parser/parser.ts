export interface VoiceParser {
    speechToText(audioBuffer: Buffer): Promise<string>;
    textResponse(text: string): Promise<string>;
}
