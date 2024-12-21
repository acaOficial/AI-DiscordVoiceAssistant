import socket
import json
import base64
from generator.generator import Generator
from transcript.transcriptor import Transcriptor
from generator.ollama.ollamaModel import OllamaGenerator
from transcript.whisper.whisperModel import WhisperTranscriptor
import tempfile
from typing import Any, Dict, Union
import asyncio
import os

async def process_message(message_data: Dict[str, Any], transcriptor: Transcriptor, generator: Generator) -> Union[str, Any]:
    """
    Procesa el mensaje recibido según su tipo.
    """
    message_type = message_data.get('type')
    content = message_data.get('content')

    if message_type == 'audio':
        return await handle_audio(content, transcriptor)
    elif message_type == 'text':
        return await handle_text(content, generator)
    else:
        return "Tipo de mensaje no reconocido"

async def handle_audio(data: str, transcriptor: Transcriptor) -> str:
    """
    Procesa los datos de audio (en base64).
    """
    audio_data = base64.b64decode(data)
    transcribed_text = ""

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as audio_file:
        audio_file.write(audio_data)
        audio_path = audio_file.name
        
        print(f"Transcribiendo audio en {audio_path}...")

        transcribed_text = await transcriptor.handle_audio(audio_path)
    
    os.remove(audio_path)

    return transcribed_text

async def handle_text(data: str, generator: Generator) -> str:
    """
    Procesa los datos de texto.
    """
    prediction = await generator.handle_text(data)
    return prediction

async def handle_client_connection(client_socket: socket.socket, transcriptor: Transcriptor, generator: Generator) -> None:
    """
    Maneja la comunicación con el cliente.
    """
    try:
        # Buffer para almacenar los datos recibidos
        data = b""
        
        while True:
            chunk = client_socket.recv(1024)  # Lee en bloques de 1024 bytes
            data += chunk
            if len(chunk) < 1024:  # Si el bloque es más pequeño, es el final de la transmisión
                break
        
        message = data.decode()
        
        message_data = json.loads(message)

        response = await process_message(message_data, transcriptor, generator)

        client_socket.send(response.encode())

    except Exception as e:
        print(f"Error durante la comunicación: {e}")

async def start_server(host: str, port: int, transcriptor: Transcriptor, generator: Generator) -> None:
    """
    Inicia el servidor TCP.
    """
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen(5)
    print(f"Servidor escuchando en {host}:{port}...")

    while True:
        client_socket, client_address = server_socket.accept()
        print(f"Conexión recibida de {client_address}")

        await handle_client_connection(client_socket, transcriptor, generator)

        client_socket.close()

if __name__ == "__main__":
    host = '127.0.0.1'
    port = 5067
    transcriptor = WhisperTranscriptor()
    generator = OllamaGenerator()
    asyncio.run(start_server(host, port, transcriptor, generator))