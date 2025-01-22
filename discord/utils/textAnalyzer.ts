export class TextAnalyzer {
    private activationPhrase: string;

    constructor(activationPhrase: string = "oye asistente") {
        this.activationPhrase = activationPhrase.toLowerCase();
    }

    /**
     * Busca la frase de activación dentro de un texto dado.
     * @param text - El texto en el que buscar la frase de activación.
     * @returns {boolean} - True si se encuentra la frase de activación, false en caso contrario.
     */
    public containsActivationPhrase(text: string): boolean {
        return text.toLowerCase().includes(this.activationPhrase);
    }

    /**
     * Procesa el texto y ejecuta una acción si se detecta la frase de activación.
     * @param text - El texto a analizar.
     */
    public processText(text: string): void {
        if (this.containsActivationPhrase(text)) {
            this.activateAssistant();
        }
    }

    /**
     * Define la acción a realizar cuando se detecta la frase de activación.
     */
    private activateAssistant(): void {
        console.log('Activación detectada. ¿En qué puedo ayudarte?');
    }
}