import pyttsx3
from speak.speaker import Speaker
import uuid
import os

class SimpleSpeaker(Speaker):
    def __init__(self):
        self.engine = pyttsx3.init()

    def text2speech(self, text: str) -> str:
        audio_filename = f"{uuid.uuid4()}.wav"
        audio_path = os.path.join(os.getcwd(), audio_filename)
        self.engine.save_to_file(text, audio_path)
        self.engine.runAndWait()
        return audio_path