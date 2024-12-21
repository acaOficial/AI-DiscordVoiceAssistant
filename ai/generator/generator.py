from abc import ABC, abstractmethod

class Generator(ABC):
    """
    Interfaz para clases que manejan texto.
    """
    @abstractmethod
    def handle_text(self, data: str) -> str:
        """
        Método abstracto para procesar los datos de texto.
        """
        pass