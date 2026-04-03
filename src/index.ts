import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { registerReadyEvent } from './events/ready';
import { registerInteractionEvent } from './events/interactionCreate';

// ── Validate Environment ─────────────────────────────────
const requiredEnv = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// ── Create Client ────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

// ── Register Events ──────────────────────────────────────
registerReadyEvent(client);
registerInteractionEvent(client);

// ── Error Handling ───────────────────────────────────────
client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});

process.on('SIGINT', () => {
  console.log('\n👋 Sesepuh Bot shutting down...');
  client.destroy();
  process.exit(0);
});

// ── Login ────────────────────────────────────────────────
console.log('🔄 Sesepuh Bot starting...');
client.login(process.env.DISCORD_TOKEN);
