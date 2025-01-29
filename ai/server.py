import asyncio
import json
import wave
import os
from typing import Any, Dict, Union

# Interface
from generator.generator import Generator
from transcript.transcriptor import Transcriptor
from speak.speaker import Speaker

# Implementation
from generator.ollama.ollamaModel import OllamaGenerator
from transcript.wav2vec2.wav2vec2Model import Wav2Vec2SpanishTranscriptor
from speak.TTSpeaker.ttSpeaker import TTSpeaker

async def process_message(message_data: Dict[str, Any], transcriptor: Transcriptor, generator: Generator, speaker: Speaker) -> Union[str, Any]:
    message_type = message_data.get('type')
    content = message_data.get('content')

    if message_type == 'audio':
        return await handle_audio(content, transcriptor)
    elif message_type == 'text':
        return await handle_text(content, generator, speaker)
    else:
        return "Tipo de mensaje no reconocido"

async def handle_audio(audio_path: str, transcriptor: 'Transcriptor') -> str:
    wav_path = None

    try:
        # Convertir PCM a WAV (en hilo separado)
        wav_path = audio_path.replace(".pcm", ".wav")
        await asyncio.to_thread(convert_pcm_to_wav, audio_path, wav_path)

        # Validar archivo WAV (también en hilo separado)
        await asyncio.to_thread(validate_wav, wav_path)

        # Transcribir audio (esto sigue siendo asincrónico)
        transcribed_text = await asyncio.to_thread(transcriptor.handle_audio, wav_path)
        print(transcribed_text)
        return transcribed_text

    except Exception as e:
        print(f"Error en el manejo de audio: {e}")
        return ""
    finally:
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)

async def handle_text(data: str, generator: Generator, speaker: Speaker) -> str:
    response = await asyncio.to_thread(generator.handle_text, data)
    audio_path = await asyncio.to_thread(speaker.text2speech, response)
    return audio_path

async def handle_client_connection(reader: asyncio.StreamReader, writer: asyncio.StreamWriter, transcriptor: Transcriptor, generator: Generator, speaker: Speaker) -> None:
    try:
        data = await reader.read(4096)
        message = data.decode()
        print(f"Mensaje recibido: {message[:100]}...")

        message_data = json.loads(message)
        response = await process_message(message_data, transcriptor, generator, speaker)

        writer.write(response.encode() if isinstance(response, str) else str(response).encode())
        await writer.drain()
    except Exception as e:
        print(f"Error durante la comunicación: {e}")
    finally:
        writer.close()
        await writer.wait_closed()

async def start_server(host: str, port: int, transcriptor: Transcriptor, generator: Generator, speaker: Speaker) -> None:
    server = await asyncio.start_server(
        lambda r, w: handle_client_connection(r, w, transcriptor, generator, speaker),
        host, port
    )
    print(f"Servidor escuchando en {host}:{port}...")

    async with server:
        await server.serve_forever()

def convert_pcm_to_wav(pcm_path: str, wav_path: str) -> None:
    try:
        # Conversión de PCM a WAV
        with wave.open(wav_path, 'wb') as wav_file:
            nchannels, sampwidth, framerate = 2, 2, 48000
            wav_file.setnchannels(nchannels)
            wav_file.setsampwidth(sampwidth)
            wav_file.setframerate(framerate)
            with open(pcm_path, 'rb') as pcm_file:
                wav_file.writeframes(pcm_file.read())
    except Exception as e:
        print(f"Error al convertir PCM a WAV: {e}")
        raise

def validate_wav(wav_path: str) -> None:
    try:
        # Validación del archivo WAV
        with wave.open(wav_path, 'rb') as audio_check:
            if audio_check.getnchannels() != 2:
                raise ValueError("El archivo WAV no tiene 2 canales.")
    except Exception as e:
        print(f"Error al validar archivo WAV: {e}")
        raise

if __name__ == "__main__":
    host = '127.0.0.1'
    port = 5067
    transcriptor = Wav2Vec2SpanishTranscriptor()
    generator = OllamaGenerator(model_name="llama3.2")

    speaker_wav = os.path.abspath("./ai/sounds/speaker.wav")
    speaker = TTSpeaker(speaker_wav)
    asyncio.run(start_server(host, port, transcriptor, generator, speaker))
