from abc import ABC, abstractmethod

class Speaker(ABC):
    """
    Interfaz para clases que manejan audio.
    """
    @abstractmethod
    def text2speech(self, text: str) -> str:
        """
        Método abstracto para tomar texto y convertirlo a audio.
        """
        pass