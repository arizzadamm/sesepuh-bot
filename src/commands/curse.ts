import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
} from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import { curseQueries, statsQueries } from '../utils/database';
import {
  isSesepuh,
  parseDuration,
  formatDuration,
  errorEmbed,
  sesepuhEmbed,
  logAction,
  randomPick,
} from '../utils/helpers';

const CURSE_MESSAGES = [
  '🌑 Kegelapan menyelimutimu, nak...',
  '💀 Sesepuh tidak suka dengan kelakuanmu.',
  '🪦 Istirahat sejenak dan renungkan hidupmu.',
  '😤 Sesepuh kecewa. SANGAT kecewa.',
  '🔇 Mulutmu tajam, tapi Sesepuh lebih tajam.',
  '⚡ Petir Sesepuh menyambarmu!',
  '🫗 Aura negatifmu menular, kamu dikurung dulu.',
  '👴 Sesepuh bilang: DIAM.',
];

const CURSE_REASONS_DEFAULT = [
  'Kelakuan tidak beradab',
  'Mengganggu ketenangan circle',
  'Sesepuh merasa perlu',
  'Sudah diperingatkan berkali-kali',
];

export const curseCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('curse')
    .setDescription('👴 Timeout/mute member nakal [SESEPUH ONLY]')
    .addUserOption((opt) =>
      opt
        .setName('target')
        .setDescription('Member yang akan dikutuk')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('duration')
        .setDescription('Durasi timeout (contoh: 5m, 1h, 1d) — max 28 hari')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('alasan')
        .setDescription('Alasan memberikan kutukan')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply();

    const executor = interaction.member as GuildMember;

    // Permission check
    if (!isSesepuh(executor)) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Bukan Sesepuh!',
            'Kamu tidak punya kuasa untuk mengutuk. Pergi jauh sana. 👴'
          ),
        ],
      });
      return;
    }

    const target = interaction.options.getMember('target') as GuildMember;
    const durationStr = interaction.options.getString('duration', true);
    const alasan =
      interaction.options.getString('alasan') ?? randomPick(CURSE_REASONS_DEFAULT);

    if (!target) {
      await interaction.editReply({
        embeds: [errorEmbed('Target tidak ditemukan', 'Member tersebut tidak ada di server.')],
      });
      return;
    }

    if (target.user.bot) {
      await interaction.editReply({
        embeds: [errorEmbed('Tidak bisa!', 'Bot kebal kutukan. Coba lagi di kehidupan lain.')],
      });
      return;
    }

    // Jangan curse diri sendiri
    if (target.id === executor.id) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Auto-curse?',
            'Sesepuh tidak mengutuk dirinya sendiri. Itu bukan kebijaksanaan. 👴'
          ),
        ],
      });
      return;
    }

    // Jangan curse sesepuh lain
    if (isSesepuh(target)) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Tidak Bisa!',
            'Sesepuh tidak bisa dikutuk oleh sesama Sesepuh. Selesaikan secara adat. ⚔️'
          ),
        ],
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

    // Check if already timed out
    if (target.communicationDisabledUntilTimestamp && target.communicationDisabledUntilTimestamp > Date.now()) {
      const until = Math.floor(target.communicationDisabledUntilTimestamp / 1000);
      await interaction.editReply({
        embeds: [
          sesepuhEmbed(
            '⚠️ Sudah Dikutuk!',
            `${target} sudah dalam timeout sampai <t:${until}:R>.\nGunakan /curse lagi setelah timeout berakhir.`,
            '#f39c12'
          ),
        ],
      });
      return;
    }

    // Apply timeout
    try {
      await target.timeout(durationMs, alasan);
    } catch {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Gagal timeout!',
            'Pastikan bot punya permission `Moderate Members` dan target bukan admin.'
          ),
        ],
      });
      return;
    }

    const expiresAt = Date.now() + durationMs;
    const formattedDuration = formatDuration(durationMs);
    const expiresTimestamp = Math.floor(expiresAt / 1000);

    // Save to DB
    curseQueries.insert.run({
      guild_id: interaction.guildId!,
      user_id: target.id,
      duration_ms: durationMs,
      reason: alasan,
      cursed_by: executor.id,
      expires_at: expiresAt,
    });

    // Update stats
    statsQueries.upsert.run({
      guild_id: interaction.guildId!,
      user_id: executor.id,
      bless_given: 0,
      curse_given: 1,
      roast_given: 0,
    });

    const curseMsg = randomPick(CURSE_MESSAGES);

    const embed = sesepuhEmbed(
      `🔇 ${target.displayName} Dikutuk!`,
      `${curseMsg}\n\n` +
        `**Target:** ${target}\n` +
        `**Durasi:** ${formattedDuration}\n` +
        `**Bebas:** <t:${expiresTimestamp}:R>\n` +
        `**Alasan:** ${alasan}\n` +
        `**Dikutuk oleh:** ${executor}`,
      '#8b0000'
    );

    await interaction.editReply({ embeds: [embed] });

    // Log
    await logAction(
      client,
      sesepuhEmbed(
        '📋 Log: /curse',
        `${executor} mengutuk ${target} selama ${formattedDuration}\n**Alasan:** ${alasan}`,
        '#e74c3c'
      )
    );

    // DM target (kalau masih bisa terima DM sebelum timeout aktif penuh)
    try {
      await target.send({
        embeds: [
          sesepuhEmbed(
            '💀 Kamu Dikutuk Sesepuh!',
            `${executor.displayName} telah mengutukmu!\n\n` +
              `**Durasi:** ${formattedDuration}\n` +
              `**Bebas:** <t:${expiresTimestamp}:R>\n` +
              `**Alasan:** ${alasan}\n\n` +
              `*Gunakan waktu ini untuk refleksi diri. 👴*`,
            '#8b0000'
          ),
        ],
      });
    } catch {
      // DM disabled, skip
    }
  },
};
