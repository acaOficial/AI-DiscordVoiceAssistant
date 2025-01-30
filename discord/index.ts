import { Client, GatewayIntentBits, Collection, Events, IntentsBitField } from 'discord.js';
import * as dotenv from 'dotenv';
import join from './commands/join';

dotenv.config();

class ExtendedClient extends Client {
    commands: Collection<string, any>;

    constructor(options: any) {
        super(options);
        this.commands = new Collection();
    }
}

const client = new ExtendedClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates
    ]
});

// Colección para comandos 
client.commands = new Collection();


// Evento: cuando el bot está listo
client.once('ready', () => {
    if (client.user) {
        console.log(`✅ Bot conectado como ${client.user.tag}`);
    } else {
        console.error('❌ Error: client.user is null');
    }
});

// Evento: cuando el bot recibe un mensaje
client.on('messageCreate', async message => {
    if (!message.content.startsWith('!') || message.author.bot) {
        return;
    }

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (commandName) {
        const command = client.commands.get(commandName);
        console.log(`Command: ${commandName}`);
        if (command) {
            try {
                await command(message, client);
            } catch (error) {
                console.error(`Error executing command: ${commandName}`, error);
            }
        }
    }
});

client.commands.set("join", join);

client.login(process.env.TOKEN);

