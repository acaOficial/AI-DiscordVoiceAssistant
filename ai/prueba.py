from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate

template = """
Answer the question in the following text:

Here is the conversation history: {context}

Question: {question}

Answer:
"""

model = OllamaLLM(model="llama3")
prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

result = chain.invoke({
    "context": "",
    "question": "Antonio es mi amigo y le gustan los chicos. ¿Qué debería hacer?",
})

print(result)