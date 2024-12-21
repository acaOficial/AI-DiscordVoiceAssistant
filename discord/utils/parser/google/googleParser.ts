import { SpeechClient, protos } from "@google-cloud/speech";
import { VoiceParser } from "../parser";

export class GoogleParser implements VoiceParser {
    async speechToText(audioBuffer: Buffer): Promise<string> {
        const client = new SpeechClient(
            {
                credentials: {
                    client_email: process.env.GOOGLE_CLIENT_EMAIL,
                    private_key: process.env.GOOGLE_PRIVATE_KEY,
                },
            }
        );

        // Configuración del análisis
        const request = {
            audio: {
                content: audioBuffer.toString('base64'), // Convertir el buffer a una cadena base64
            },
            config: {
                encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.OGG_OPUS, // Formato de audio (OGG_OPUS en este caso)
                sampleRateHertz: 48000, // Frecuencia de muestreo
                languageCode: 'es-ES', // Código de idioma
            },
        };

        try {
            const [response] = await client.recognize(request);
            const transcription = response.results
                ? response.results.map((result: any) => result.alternatives[0].transcript).join('\n')
                : '';
            return transcription;
        } catch (error) {
            console.error('Error en la conversión de audio a texto:', error);
            throw error;
        }
    }
}