import { Client, Events, Interaction } from 'discord.js';
import { commands } from '../commands';
import { errorEmbed } from '../utils/helpers';

export function registerInteractionEvent(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
      console.warn(`⚠️ Unknown command: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`❌ Error executing /${interaction.commandName}:`, error);

      const errorResponse = {
        embeds: [
          errorEmbed(
            'Internal Error',
            'Terjadi kesalahan. Sesepuh sedang memperbaiki. Coba lagi nanti. 🔧'
          ),
        ],
        ephemeral: true,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorResponse).catch(() => {});
      } else {
        await interaction.reply(errorResponse).catch(() => {});
      }
    }
  });
}
