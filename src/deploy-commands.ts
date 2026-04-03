import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commandDefinitions } from './commands/definitions';

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;
const guildId = process.env.GUILD_ID!;

if (!token || !clientId || !guildId) {
  console.error('❌ Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in .env');
  process.exit(1);
}

const rest = new REST().setToken(token);

const commandsData = commandDefinitions.map((cmd) => cmd.toJSON());

(async () => {
  try {
    console.log(`\n🔄 Registering ${commandsData.length} slash commands...`);
    console.log('Commands:', commandsData.map((c) => `/${c.name}`).join(', '));

    // Register ke guild spesifik (instant, untuk development)
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commandsData }
    ) as unknown[];

    console.log(`\n✅ Successfully registered ${data.length} commands to Guild: ${guildId}`);
    console.log('\n📋 Registered commands:');
    commandsData.forEach((cmd) => {
      console.log(`  /${cmd.name} — ${cmd.description}`);
    });

    console.log('\n💡 Tip: Untuk global deployment (semua server), gunakan:');
    console.log('   Routes.applicationCommands(clientId)');
    console.log('   ⚠️  Global commands perlu ~1 jam untuk propagate\n');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
    process.exit(1);
  }
})();
