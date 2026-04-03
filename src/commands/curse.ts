import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
} from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import { curseQueries, penaltyQueries, statsQueries } from '../utils/database';
import {
  isSesepuh,
  parseDuration,
  formatDuration,
  errorEmbed,
  sesepuhEmbed,
  logAction,
  randomPick,
  isBlessed,
  getCommandCooldownRemaining,
  setCommandCooldown,
  resolveMiskinRole,
  setTemporaryNickname,
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

const CURSE_COOLDOWN_MS = 30 * 60 * 1000;
const MISKIN_DURATION_MS = 60 * 60 * 1000;

export const curseCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('curse')
    .setDescription('👴 Kutuk target langsung atau pilih satu korban miskin random [SESEPUH ONLY]')
    .addStringOption((opt) =>
      opt
        .setName('mode')
        .setDescription('Mode kutukan')
        .addChoices(
          { name: 'Kutuk target biasa', value: 'normal' },
          { name: 'Random miskin', value: 'random_miskin' }
        )
        .setRequired(false)
    )
    .addUserOption((opt) =>
      opt
        .setName('target')
        .setDescription('Member yang akan dikutuk untuk mode normal')
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName('duration')
        .setDescription('Durasi timeout mode normal, contoh: 5m, 1h, 1d')
        .setRequired(false)
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

    const cooldownRemaining = getCommandCooldownRemaining(
      interaction.guildId!,
      'curse',
      CURSE_COOLDOWN_MS
    );
    if (cooldownRemaining > 0) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Curse lagi cooldown',
            `Kutukan baru bisa dipakai lagi <t:${Math.floor((Date.now() + cooldownRemaining) / 1000)}:R>.`
          ),
        ],
      });
      return;
    }

    const mode = interaction.options.getString('mode') ?? 'normal';
    const alasan =
      interaction.options.getString('alasan') ?? randomPick(CURSE_REASONS_DEFAULT);

    if (mode === 'random_miskin') {
      const guild = interaction.guild!;
      const miskinRole = await resolveMiskinRole(guild);
      const muteMinutes = Math.floor(Math.random() * 2) + 1;
      const members = await guild.members.fetch();
      const candidates = members
        .filter(
          (member) =>
            !member.user.bot &&
            !isSesepuh(member) &&
            !isBlessed(member) &&
            member.presence?.status &&
            member.presence.status !== 'offline'
        )
        .map((member) => member);

      if (candidates.length === 0) {
        await interaction.editReply({
          embeds: [
            errorEmbed(
              'Nggak ada korban random',
              'Saat ini nggak ada member online yang valid buat kena status miskin.'
            ),
          ],
        });
        return;
      }

      const target = candidates[Math.floor(Math.random() * candidates.length)];

      try {
        await target.roles.add(miskinRole.id);
        await setTemporaryNickname(target, 'Cupu ');
        if (!target.communicationDisabledUntilTimestamp || target.communicationDisabledUntilTimestamp < Date.now()) {
          await target.timeout(muteMinutes * 60 * 1000, 'Random miskin dari /curse');
        }
        penaltyQueries.deleteActiveForRole.run(interaction.guildId!, target.id, miskinRole.id);
        penaltyQueries.insert.run({
          guild_id: interaction.guildId!,
          user_id: target.id,
          role_id: miskinRole.id,
          expires_at: Date.now() + MISKIN_DURATION_MS,
          created_by: executor.id,
          reason: `Random miskin dari curse, mute ${muteMinutes} menit`,
        });
      } catch {
        await interaction.editReply({
          embeds: [
            errorEmbed(
              'Gagal kasih status miskin',
              'Cek permission `Manage Roles`, `Moderate Members`, dan pastikan role bot paling atas.'
            ),
          ],
        });
        return;
      }

      statsQueries.upsert.run({
        guild_id: interaction.guildId!,
        user_id: executor.id,
        bless_given: 0,
        curse_given: 1,
        roast_given: 0,
      });
      setCommandCooldown(interaction.guildId!, 'curse', executor.id);

      await interaction.editReply({
        embeds: [
          sesepuhEmbed(
            `💸 ${target.displayName} Kena Random Miskin`,
            `Korban random hari ini jatuh ke ${target}.\n\n` +
              `**Efek:** role miskin 1 jam\n` +
              `**Mute:** ${muteMinutes} menit\n` +
              `**Alasan:** ${alasan}\n` +
              `**Dijatuhkan oleh:** ${executor}`,
            '#8b0000'
          ),
        ],
      });
      return;
    }

    const target = interaction.options.getMember('target') as GuildMember | null;
    const durationStr = interaction.options.getString('duration') ?? '10m';

    if (!target) {
      await interaction.editReply({
        embeds: [errorEmbed('Target wajib diisi', 'Untuk mode normal, pilih target yang mau dikutuk.')],
      });
      return;
    }

    if (target.user.bot) {
      await interaction.editReply({
        embeds: [errorEmbed('Tidak bisa!', 'Bot kebal kutukan. Coba lagi di kehidupan lain.')],
      });
      return;
    }

    if (isBlessed(target)) {
      await interaction.editReply({
        embeds: [
          sesepuhEmbed(
            '✨ Target Lagi Blessed',
            `${target} lagi dapat aura emas. Selama buff aktif, dia immune dari /curse.`,
            '#f1c40f'
          ),
        ],
      });
      return;
    }

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

    if (
      target.communicationDisabledUntilTimestamp &&
      target.communicationDisabledUntilTimestamp > Date.now()
    ) {
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

    curseQueries.insert.run({
      guild_id: interaction.guildId!,
      user_id: target.id,
      duration_ms: durationMs,
      reason: alasan,
      cursed_by: executor.id,
      expires_at: expiresAt,
    });

    statsQueries.upsert.run({
      guild_id: interaction.guildId!,
      user_id: executor.id,
      bless_given: 0,
      curse_given: 1,
      roast_given: 0,
    });
    setCommandCooldown(interaction.guildId!, 'curse', executor.id);

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

    await logAction(
      client,
      sesepuhEmbed(
        '📋 Log: /curse',
        `${executor} mengutuk ${target} selama ${formattedDuration}\n**Alasan:** ${alasan}`,
        '#e74c3c'
      )
    );

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
