export interface VoiceParser {
    speechToText(audioBuffer: Buffer): Promise<string>;
}