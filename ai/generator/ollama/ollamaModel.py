from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from generator.generator import Generator
from dotenv import load_dotenv
import os

load_dotenv()

class OllamaGenerator(Generator):
    def __init__(self, model_name: str = "llama3"):
        """
        Constructor que inicializa el modelo LLM y la plantilla de prompt.

        :param model_name: Nombre del modelo para OllamaLLM.
        :param template: Plantilla del prompt para formatear las entradas.
        """
        template = os.getenv('TEMPLATE')
        self.model = OllamaLLM(model=model_name)
        self.prompt_template = ChatPromptTemplate.from_template(template)
    
    def handle_text(self, data: str) -> str:
        """
        Método para procesar los datos de texto.

        :param data: Datos de texto a procesar.
        :return: Respuesta generada por el modelo.
        """

        # Formatear el prompt con los datos de entrada
        prompt = self.prompt_template.format(context=data)

        # Generar respuesta con el modelo
        response = self.model.invoke(prompt)
        return response
