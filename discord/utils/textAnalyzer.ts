import FuzzySet from "fuzzyset.js";

export class TextAnalyzer {
    private activationPhrase: string;
    private similarityThreshold: number;
    private fuzzySet: FuzzySet;

    constructor(activationPhrase: string = "hola asistente", similarityThreshold: number = 0.5) {
        this.activationPhrase = activationPhrase.toLowerCase();
        this.similarityThreshold = similarityThreshold;
        this.fuzzySet = FuzzySet();
        this.fuzzySet.add(this.activationPhrase); // Agrega la frase de activación al conjunto
    }

    /**
     * Verifica si el texto contiene una frase similar a la frase de activación.
     * @param text - El texto en el que buscar la frase de activación.
     * @returns {boolean} - True si el texto contiene una frase similar a la frase de activación.
     */
    public containsActivationPhrase(text: string): boolean {
        const result = this.fuzzySet.get(text.toLowerCase());
        return result !== null && result !== undefined && result[0][0] >= this.similarityThreshold; // Verifica si la similitud es mayor o igual al umbral
    }

    /**
     * Procesa el texto y ejecuta una acción si se detecta la frase de activación.
     * @param text - El texto a analizar.
     */
    public processText(text: string): boolean {
        if (this.containsActivationPhrase(text)) {
            this.activateAssistant();
            return true;
        }
        return false;
    }

    /**
     * Define la acción a realizar cuando se detecta la frase de activación.
     */
    private activateAssistant(): void {
        console.log('Activación detectada. ¿En qué puedo ayudarte?');
    }
}
