import {
  ChatInputCommandInteraction,
  Client,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import { sesepuhEmbed } from '../utils/helpers';

function checkRoleStatus(
  roleName: string,
  configuredRoleId: string | undefined,
  guild: ChatInputCommandInteraction['guild'],
  botHighestPosition: number
): string {
  if (!guild) return 'Guild tidak tersedia';

  const configuredRole = configuredRoleId ? guild.roles.cache.get(configuredRoleId) : null;
  const namedRole = guild.roles.cache.find((role) => role.name.toLowerCase() === roleName.toLowerCase());
  const role = configuredRole ?? namedRole;

  if (!role) {
    return `Belum ada. Bot akan coba bikin otomatis saat dibutuhkan.`;
  }

  const hierarchyOk = botHighestPosition > role.position;
  return (
    `Ada: <@&${role.id}>\n` +
    `ID source: ${configuredRole ? 'env' : 'auto-detect'}\n` +
    `Hierarchy: ${hierarchyOk ? 'aman' : 'bot masih di bawah role ini'}`
  );
}

export const statusroleCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('statusrole')
    .setDescription('🛠️ Audit role Blessed dan miskin untuk kebutuhan bot'),

  async execute(interaction: ChatInputCommandInteraction, _client: Client) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        embeds: [sesepuhEmbed('🛠️ Status Role', 'Command ini cuma bisa dipakai di server.', '#e74c3c')],
        ephemeral: true,
      });
      return;
    }

    const me = await guild.members.fetchMe();
    const manageRoles = me.permissions.has(PermissionFlagsBits.ManageRoles);
    const highestPosition = me.roles.highest.position;

    const blessedStatus = checkRoleStatus(
      'Blessed',
      process.env.BLESS_ROLE_ID,
      guild,
      highestPosition
    );
    const miskinStatus = checkRoleStatus(
      'miskin',
      process.env.MISKIN_ROLE_ID,
      guild,
      highestPosition
    );

    await interaction.reply({
      embeds: [
        sesepuhEmbed(
          '🛠️ Audit Role Bot',
          `**Manage Roles:** ${manageRoles ? 'aman' : 'belum ada, wajib diaktifkan'}\n` +
            `**Role bot tertinggi:** ${me.roles.highest}\n\n` +
            `**Blessed**\n${blessedStatus}\n\n` +
            `**miskin**\n${miskinStatus}\n\n` +
            `Kalau role belum ada, bot bisa coba bikin otomatis saat command dipakai.`,
          manageRoles ? '#2ecc71' : '#f39c12'
        ),
      ],
      ephemeral: true,
    });
  },
};
