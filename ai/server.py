import io
import socket
import json
import base64
import tempfile
import os
import wave
import binascii
import subprocess
from generator.generator import Generator
from transcript.transcriptor import Transcriptor
from generator.ollama.ollamaModel import OllamaGenerator
from transcript.whisper.whisperModel import WhisperTranscriptor
import asyncio
from typing import Any, Dict, Union


async def process_message(message_data: Dict[str, Any], transcriptor: Transcriptor, generator: Generator) -> Union[str, Any]:
    message_type = message_data.get('type')
    content = message_data.get('content')

    if message_type == 'audio':
        return await handle_audio(content, transcriptor)
    elif message_type == 'text':
        return await handle_text(content, generator)
    else:
        return "Tipo de mensaje no reconocido"


async def handle_audio(data: str, transcriptor: 'Transcriptor') -> str:
    audio_path = None
    wav_path = None
    try:
        # Decodificar los datos base64
        try:
            audio_data = base64.b64decode(data, validate=True)
        except binascii.Error:
            raise ValueError("Los datos proporcionados no están en formato base64 válido")

        # Crear un archivo temporal para el audio PCM
        with tempfile.NamedTemporaryFile(suffix=".pcm", delete=False) as pcm_file:
            pcm_file.write(audio_data)
            audio_path = pcm_file.name

        # Convertir PCM a WAV
        wav_path = audio_path.replace(".pcm", ".wav")
        with wave.open(wav_path, 'wb') as wav_file:
            # Definir las propiedades del archivo WAV:
            nchannels = 2  # Número de canales (2 para estéreo)
            sampwidth = 2  # Tamaño de la muestra (2 bytes para 16 bits)
            framerate = 48000  # Frecuencia de muestreo de 48 kHz
            nframes = len(audio_data) // (nchannels * sampwidth)
            
            wav_file.setnchannels(nchannels)
            wav_file.setsampwidth(sampwidth)
            wav_file.setframerate(framerate)
            wav_file.writeframes(audio_data)

        # Validar el archivo WAV
        try:
            with wave.open(wav_path, 'rb') as audio_check:
                if audio_check.getnchannels() != nchannels:
                    raise ValueError(f"El archivo WAV tiene {audio_check.getnchannels()} canales, pero se esperaban {nchannels}.")
        except wave.Error as e:
            raise ValueError(f"El archivo no es un archivo WAV válido: {e}")

        # Procesar el archivo con el transcriptor en un hilo separado si no es asíncrono
        transcribed_text = await asyncio.to_thread(transcriptor.handle_audio, wav_path)
        return transcribed_text

    except Exception as e:
        print(f"Error en el manejo de audio: {e}")
        raise
    finally:
        # Limpiar los archivos temporales
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)


async def handle_text(data: str, generator: Generator) -> str:
    prediction = await generator.handle_text(data)
    return prediction


async def handle_client_connection(client_socket: socket.socket, transcriptor: Transcriptor, generator: Generator) -> None:
    try:
        data = b""
        while True:
            chunk = client_socket.recv(1024)
            data += chunk
            if len(chunk) < 1024:
                break

        message = data.decode()
        print(f"Mensaje recibido: {message[:100]}...")  # Muestra solo los primeros 100 caracteres para evitar desbordes

        message_data = json.loads(message)
        response = await process_message(message_data, transcriptor, generator)

        # Asegúrate de que 'response' sea una cadena antes de hacer .encode()
        if isinstance(response, str):
            client_socket.send(response.encode())
        else:
            client_socket.send(str(response).encode())  # Convertir a string si es necesario
    except Exception as e:
        print(f"Error durante la comunicación: {e}")



async def start_server(host: str, port: int, transcriptor: Transcriptor, generator: Generator) -> None:
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
