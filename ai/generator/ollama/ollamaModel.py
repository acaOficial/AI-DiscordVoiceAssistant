from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from generator.generator import Generator

class OllamaGenerator(Generator):
    def __init__(self, model_name="llama3"):
        """
        Inicializa el generador con el modelo Ollama.
        """
        # Definir el template para la generación de texto
        self.template = """
        Answer the question in the following text:

        Here is the conversation history: {context}

        Question: {question}

        Answer:
        """
        # Configurar el modelo de Ollama
        self.model = OllamaLLM(model=model_name)
        self.prompt = ChatPromptTemplate.from_template(self.template)
        self.chain = self.prompt | self.model
    
    def handle_text(self, data: str) -> str:
        """
        Procesa los datos de texto y genera una respuesta utilizando el modelo Ollama.
        """
        # Separa el contexto y la pregunta del input de datos
        context, question = data.split("\n", 1) if "\n" in data else ("", data)
        
        # Ejecuta la cadena para generar la respuesta
        result = self.chain.invoke({
            "context": context,
            "question": question,
        })
        
        return result