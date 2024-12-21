import whisper
model = whisper.load_model('small')

def get_transcribe(audio: str, language: str = 'es'):
    return model.transcribe(audio=audio, language=language, verbose=True)

if __name__ == "__main__":
    result = get_transcribe(audio=r"C:\Users\eduor\Documents\Grabaciones de sonido\Grabación.m4a")
    print('-'*50)
    print(result.get('text', ''))