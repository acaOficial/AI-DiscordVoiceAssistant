import torch
from TTS.api import TTS
from abc import ABC, abstractmethod
from speak.speaker import Speaker
import uuid
import os

class TTSpeaker(Speaker):
    def __init__(self, speaker_wav: str = None, device=None):

        if speaker_wav is None:
            raise ValueError("speaker_wav no puede ser None")

        self.speaker_wav = speaker_wav 
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2").to(self.device)

    def text2speech(self, text: str) -> str:
        """
        Implementación del método para convertir texto a voz usando TTS.
        El lenguaje está hardcodeado a español.
        """
        language = "es" 

        audio_filename = f"{uuid.uuid4()}.wav"
        audio_path = os.path.join(os.getcwd(), audio_filename)

        self.tts.tts_to_file(text=text, speaker_wav=self.speaker_wav, language=language, file_path=audio_path)
        return audio_path
