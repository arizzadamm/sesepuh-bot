import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
} from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import { buffQueries, statsQueries } from '../utils/database';
import {
  isSesepuh,
  parseDuration,
  formatDuration,
  successEmbed,
  errorEmbed,
  sesepuhEmbed,
  logAction,
} from '../utils/helpers';

const BLESS_MESSAGES = [
  '🌟 Berkah Sesepuh telah turun!',
  '✨ Cahaya kebijaksanaan menyinarimu!',
  '🙏 Doa Sesepuh telah dikabulkan!',
  '👴 Restu leluhur menyertaimu!',
  '🌸 Aura positif mengelilingimu!',
];

export const blessCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('bless')
    .setDescription('👴 Berikan buff/role sementara kepada member [SESEPUH ONLY]')
    .addUserOption((opt) =>
      opt
        .setName('target')
        .setDescription('Member yang akan dibless')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('duration')
        .setDescription('Durasi buff (contoh: 30m, 2h, 1d)')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('alasan')
        .setDescription('Alasan memberikan buff')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply();

    const executor = interaction.member as GuildMember;

    // Permission check
    if (!isSesepuh(executor)) {
      await interaction.editReply({
        embeds: [errorEmbed('Bukan Sesepuh!', 'Hanya Sesepuh yang bisa memberikan restu. Kenali dirimu dulu, nak. 👴')],
      });
      return;
    }

    const target = interaction.options.getMember('target') as GuildMember;
    const durationStr = interaction.options.getString('duration', true);
    const alasan = interaction.options.getString('alasan') ?? 'Karena Sesepuh berkenan';

    if (!target) {
      await interaction.editReply({
        embeds: [errorEmbed('Target tidak ditemukan', 'Member tersebut tidak ada di server.')],
      });
      return;
    }

    if (target.user.bot) {
      await interaction.editReply({
        embeds: [errorEmbed('Tidak bisa!', 'Bot tidak bisa dibless. Mereka sudah cukup powerful.')],
      });
      return;
    }

    const durationMs = parseDuration(durationStr);
    if (!durationMs) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Format durasi salah!',
            'Gunakan format: `30s`, `10m`, `2h`, `1d`\nMaksimum: 28 hari'
          ),
        ],
      });
      return;
    }

    const blessRoleId = process.env.BLESS_ROLE_ID;
    if (!blessRoleId) {
      await interaction.editReply({
        embeds: [errorEmbed('Konfigurasi Error', '`BLESS_ROLE_ID` belum diset di .env')],
      });
      return;
    }

    // Check if already blessed
    const existing = buffQueries.getByUser.all(interaction.guildId!, target.id);
    if (existing.length > 0) {
      await interaction.editReply({
        embeds: [
          warningEmbed(
            target.displayName,
            `${target} sudah memiliki buff aktif. Tunggu sampai buff sebelumnya habis dulu.`
          ),
        ],
      });
      return;
    }

    // Give role
    try {
      await target.roles.add(blessRoleId);
    } catch {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Gagal memberikan role!',
            'Pastikan bot punya permission `Manage Roles` dan role Bless berada di bawah role bot.'
          ),
        ],
      });
      return;
    }

    const expiresAt = Date.now() + durationMs;
    const formattedDuration = formatDuration(durationMs);
    const expiresTimestamp = Math.floor(expiresAt / 1000);

    // Save to DB
    buffQueries.insert.run({
      guild_id: interaction.guildId!,
      user_id: target.id,
      role_id: blessRoleId,
      expires_at: expiresAt,
      created_by: executor.id,
    });

    // Update stats
    statsQueries.upsert.run({
      guild_id: interaction.guildId!,
      user_id: executor.id,
      bless_given: 1,
      curse_given: 0,
      roast_given: 0,
    });

    const blessMsg = BLESS_MESSAGES[Math.floor(Math.random() * BLESS_MESSAGES.length)];

    const embed = successEmbed(
      `Berkah untuk ${target.displayName}!`,
      `${blessMsg}\n\n` +
        `**Target:** ${target}\n` +
        `**Buff Role:** <@&${blessRoleId}>\n` +
        `**Durasi:** ${formattedDuration}\n` +
        `**Berakhir:** <t:${expiresTimestamp}:R>\n` +
        `**Alasan:** ${alasan}\n` +
        `**Diberikan oleh:** ${executor}`
    );

    await interaction.editReply({ embeds: [embed] });

    // Log
    await logAction(
      client,
      sesepuhEmbed(
        '📋 Log: /bless',
        `${executor} membless ${target} selama ${formattedDuration}\n**Alasan:** ${alasan}`,
        '#2ecc71'
      )
    );

    // DM target
    try {
      await target.send({
        embeds: [
          sesepuhEmbed(
            '🌟 Kamu Dibless Sesepuh!',
            `${executor.displayName} telah memberikan berkahnya kepadamu!\n\n` +
              `**Durasi:** ${formattedDuration}\n` +
              `**Berakhir:** <t:${expiresTimestamp}:R>\n` +
              `**Pesan:** ${alasan}`
          ),
        ],
      });
    } catch {
      // DM disabled, skip
    }
  },
};

function warningEmbed(title: string, description: string) {
  const { EmbedBuilder } = require('discord.js');
  return new EmbedBuilder()
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setColor('#f39c12')
    .setTimestamp()
    .setFooter({ text: '👴 Sesepuh Bot v1 – Circle Edition' });
}
