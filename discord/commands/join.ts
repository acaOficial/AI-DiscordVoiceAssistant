import { joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
import listen from './voice';
import { Client, Message, OmitPartialGroupDMChannel } from 'discord.js';

/**
 * Función para unir al bot a un canal de voz.
 * @param message - El mensaje del usuario. Debe ser de tipo `Message`.
 * @param client - El objeto cliente de Discord. Debe ser de tipo `Client`.
 */
async function execute(message: OmitPartialGroupDMChannel<Message<boolean>>, client: Client): Promise<void> {
    if (!message.member) {
        console.error('El mensaje no tiene un miembro asociado.');
        return
    }

    const channel = message.member.voice.channel;
    const guild = message.guild;

    if (!channel) {
        console.error('El usuario no está en un canal de voz.');
        return;
    }

    if (!guild) {
        console.error('El mensaje no tiene un servidor asociado.');
        return;
    }

    const connection: VoiceConnection = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
    });

    await listen(connection);

    connection.on('error', (error) => {
        console.error('Error al unirse al canal de voz:', error);
    });
}

export default execute;
