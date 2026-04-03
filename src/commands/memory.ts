import { ChatInputCommandInteraction, Client, GuildMember, SlashCommandBuilder } from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import { loreQueries } from '../utils/database';
import { errorEmbed, isSesepuh, sesepuhEmbed, successEmbed } from '../utils/helpers';

export const rememberCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('remember')
    .setDescription('🧠 Simpan lore/member memory biar circle punya sejarah')
    .addUserOption((opt) =>
      opt.setName('target').setDescription('Member yang mau diingat').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('catatan').setDescription('Contoh: suka telat, raja AFK').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction, _client: Client) {
    const executor = interaction.member as GuildMember;
    if (!isSesepuh(executor)) {
      await interaction.reply({
        embeds: [errorEmbed('Akses ditolak', 'Yang boleh nambah lore cuma Sesepuh.')],
        ephemeral: true,
      });
      return;
    }

    const target = interaction.options.getUser('target', true);
    const memoryText = interaction.options.getString('catatan', true).trim();

    loreQueries.insert.run({
      guild_id: interaction.guildId!,
      user_id: target.id,
      memory_text: memoryText,
      remembered_by: interaction.user.id,
    });

    await interaction.reply({
      embeds: [
        successEmbed(
          'Lore tersimpan',
          `${target} sekarang tercatat sebagai: **${memoryText}**`
        ),
      ],
    });
  },
};

export const loreCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('lore')
    .setDescription('📜 Lihat lore dan reputasi member di circle')
    .addUserOption((opt) =>
      opt.setName('target').setDescription('Member yang mau dicek').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction, _client: Client) {
    const target = interaction.options.getUser('target', true);
    const loreRows = loreQueries.getForUser.all(interaction.guildId!, target.id, 10) as Array<{
      memory_text: string;
      created_at: number;
    }>;

    if (loreRows.length === 0) {
      await interaction.reply({
        embeds: [
          sesepuhEmbed(
            `📜 Lore ${target.username}`,
            `${target} belum punya lore yang tercatat. Masih bersih, atau belum ketahuan.`,
            '#95a5a6'
          ),
        ],
      });
      return;
    }

    const latest = loreRows[0];
    await interaction.reply({
      embeds: [
        sesepuhEmbed(
          `📜 Lore ${target.username}`,
          `${target} dikenal sebagai: **${latest.memory_text}**\n` +
            `Tercatat sejak <t:${latest.created_at}:D>\n\n` +
            `**Riwayat lore:**\n` +
            loreRows
              .map((row) => `• ${row.memory_text} — <t:${row.created_at}:D>`)
              .join('\n'),
          '#8e44ad'
        ),
      ],
    });
  },
};
