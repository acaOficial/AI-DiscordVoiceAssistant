import pyttsx3
from speak.speaker import Speaker
import uuid

class SimpleSpeaker(Speaker):
    def __init__(self):
        # Inicializa el motor de síntesis de voz
        self.engine = pyttsx3.init()

    def text2speech(self, text: str) -> str:
        audio_path = f"{uuid.uuid4()}.wav"
        self.engine.save_to_file(text, audio_path)
        self.engine.runAndWait()
        return audio_path