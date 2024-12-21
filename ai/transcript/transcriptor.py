from abc import ABC, abstractmethod

class Transcriptor(ABC):
    """
    Interfaz para clases que manejan audio.
    """
    @abstractmethod
    def handle_audio(self, data: str) -> str:
        """
        Método abstracto para procesar los datos de audio.
        """
        pass