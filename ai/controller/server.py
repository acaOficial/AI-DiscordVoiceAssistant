import socket
import json
import base64

def process_message(message_data):
    """
    Procesa el mensaje recibido según su tipo.
    """
    message_type = message_data.get('type')
    content = message_data.get('content')

    if message_type == 'audio':
        return handle_audio(content)
    elif message_type == 'text':
        return handle_text(content)
    else:
        return "Tipo de mensaje no reconocido"

def handle_audio(data):
    """
    Procesa los datos de audio (en base64).
    """
    audio_data = base64.b64decode(data)

    # Crea un archivo de audio temporal
    with open("temp_audio.wav", "wb") as f:
        f.write(audio_data)
        
    # Aquí se puede llamar a la función de procesamiento de audio
    
    

    return "Audio procesado correctamente"

def handle_text(data):
    """
    Procesa los datos de texto.
    """
    print("Recibido texto:", data)
    return "Texto procesado correctamente"

def handle_client_connection(client_socket):
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
        
        message = data.decode()  # Decodifica el mensaje completo
        
        message_data = json.loads(message)  # Parsear el JSON

        response = process_message(message_data)

        client_socket.send(response.encode())  # Responder al cliente

    except Exception as e:
        print(f"Error durante la comunicación: {e}")

def start_server(host, port):
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

        handle_client_connection(client_socket)

        client_socket.close()

if __name__ == "__main__":
    host = '127.0.0.1'
    port = 5067
    start_server(host, port)
