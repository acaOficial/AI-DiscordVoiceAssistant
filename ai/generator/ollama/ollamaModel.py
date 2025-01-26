from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from generator.generator import Generator

class OllamaGenerator(Generator):
    def __init__(self, model_name: str = "llama3"):
        """
        Constructor que inicializa el modelo LLM y la plantilla de prompt.

        :param model_name: Nombre del modelo para OllamaLLM.
        :param template: Plantilla del prompt para formatear las entradas.
        """
        template = """
        Supon que eres un chatbot orientado a responder preguntas sencillas a través de un medio de audio, así que trata de ser conciso y claro en tus respuestas. No
        es necesario que te extiendas demasiado en tus respuestas, pero trata de ser informativo y útil. Recuerda que tu objetivo es ayudar a los usuarios a obtener
        información relevante y precisa. Si no estás seguro de cómo responder a una pregunta, puedes decir que no tienes suficiente información o que no puedes
        responder en ese momento. Si necesitas más contexto para responder a una pregunta, puedes pedirle al usuario que proporcione más información.

        Es probable que en ocasiones la información que te llegue del usuario no sea del todo legible, ya que puede haber errores de transcripción o problemas con la calidad
        del audio. En esos casos, haz lo mejor que puedas para interpretar la información y proporcionar una respuesta útil. Si no estás seguro de lo que el usuario está
        preguntando, puedes pedirle que repita la pregunta o que la reformule de una manera más clara.

        Lo que el usuario te envía es lo siguiente:
        {context}
        """
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
