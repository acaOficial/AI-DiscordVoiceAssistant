import whisper
from transcript.transcriptor import Transcriptor

class WhisperTranscriptor(Transcriptor):
    def __init__(self, model_name='small'):
        """
        Inicializa el transcriptor con el modelo Whisper.
        """
        # Cargar el modelo de Whisper
        self.model = whisper.load_model(model_name)

    async def handle_audio(self, audio_path: str, language: str = 'es') -> str:
        """
        Procesa los datos de audio y devuelve la transcripción utilizando Whisper.
        """
        # Transcribir el audio
        result = await self.model.transcribe(audio_path, language=language, verbose=True)
        
        # Extraer el texto transcrito
        transcribed_text = result.get('text', '')
        
        return transcribed_text
