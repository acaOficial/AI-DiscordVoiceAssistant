import torch
import torchaudio
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC

class Wav2Vec2SpanishTranscriptor:
    """
    Clase para realizar transcripción de audio en español usando Wav2Vec2.
    """
    def __init__(self, model_name: str = "facebook/wav2vec2-large-xlsr-53-spanish"):
        # Obtener el dispositivo actual (CPU o GPU)
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Cargar el procesador de audio y el modelo de Wav2Vec2
        self.processor = Wav2Vec2Processor.from_pretrained(model_name)  # Cargar el procesador
        self.model = Wav2Vec2ForCTC.from_pretrained(model_name).to(device)

    def handle_audio(self, file_path: str) -> str:
        # Cargar el archivo de audio
        waveform, sample_rate = torchaudio.load(file_path)
        
        # Asegurar que el audio esté a 16 kHz (frecuencia de muestreo estándar para Wav2Vec2)
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)
            waveform = resampler(waveform)

        # Si el audio tiene más de un canal (estéreo), convertirlo a mono (promediando los canales)
        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)

        # Mover la onda a la GPU si está disponible
        waveform = waveform.to(self.model.device)

        # Preprocesar el audio para pasarlo al modelo
        input_values = self.processor(waveform.squeeze().cpu().numpy(), return_tensors="pt", sampling_rate=16000).input_values

        # Mover input_values a la GPU si es necesario
        input_values = input_values.to(self.model.device)

        # Realizar la inferencia sin calcular gradientes (modo de evaluación)
        with torch.no_grad():
            logits = self.model(input_values).logits

        # Obtener la predicción (ID de los tokens)
        predicted_ids = torch.argmax(logits, dim=-1)

        # Decodificar los IDs a texto
        transcription = self.processor.batch_decode(predicted_ids)[0]

        return transcription
