# AI-DiscordVoiceAssistant

Este proyecto consiste en un bot de Discord que actúa como un asistente de audio manejado por inteligencia artificial, capaz de escuchar, entender y responder a los usuarios en tiempo real. El sistema está dividido en dos módulos principales: un módulo de Discord desarrollado en TypeScript y un módulo de servidor en Python que maneja el procesamiento de audio y texto.

## Características

- **Manejo de Audio**: Escucha en tiempo real a través de buffers de audio cuando un usuario habla.
- **Sincronización de Procesos**: Uso de hilos y cerrojos para garantizar respuestas precisas y coordinadas.
- **Análisis de Comandos**: Detección de menciones al bot y análisis de comandos mediante análisis de texto.
- **Comunicación por Sockets**: Comunicación eficiente entre el cliente de Discord y el servidor de Python para el envío de datos de texto y audio.
- **Procesamiento en Tiempo Real**: Uso de modelos avanzados de inteligencia artificial ejecutados en servidores de alta capacidad para garantizar respuestas inmediatas.

## Tecnologías Utilizadas

### Módulo de Discord (TypeScript)
- **Node.js**: Entorno de ejecución para JavaScript.
- **Discord.js**: Librería para interactuar con la API de Discord.
- **net**: Cliente de TCP para la comunicación con el servidor de Python.

### Módulo de Python
- **asyncio**: Biblioteca para escribir código concurrente utilizando la sintaxis async/await.
- **SocketIO**: Para manejar la comunicación bidireccional entre el cliente y el servidor.
- **Modelos AI**:
  - **LLM (Llama3.2)**: Modelo de lenguaje para la generación de texto.
  - **TTS (XTTS_V2)**: Text-to-Speech para la generación de respuestas audibles.
  - **STT (Wav2Vec2)**: Speech-to-Text para la transcripción de audio a texto.

## Arquitectura

### Discord Bot
El módulo de Discord se encarga de capturar el audio y detectar los comandos de voz, utilizando un sistema de listeners y gestión de hilos para procesar los datos en tiempo real y enviarlos al servidor.

### Servidor de Python
El servidor recibe los datos de texto y audio, procesándolos con los modelos de AI para generar respuestas que luego son enviadas de vuelta al cliente de Discord para ser reproducidas.

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/acaOficial/AI-DiscordVoiceAssistant.git

# Instalar dependencias para el módulo de Discord
cd discord
npm install

# Instalar dependencias para el servidor Python
cd ../ai
pip install -r requirements.txt
```

## Ejecución

Para iniciar el bot, el usuario debe decir "Hola asistente". Después de escuchar el sonido de notificación, puede lanzar su pregunta.

```bash
# Iniciar el módulo de Discord
cd discord
npm start

# En otra terminal, iniciar el servidor de Python
cd ../ai
python server.py
```
