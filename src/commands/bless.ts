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
  formatDuration,
  successEmbed,
  errorEmbed,
  sesepuhEmbed,
  logAction,
  resolveBlessedRole,
  setTemporaryNickname,
  getCommandCooldownRemaining,
  setCommandCooldown,
} from '../utils/helpers';

const BLESS_COOLDOWN_MS = 30 * 60 * 1000;

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
    .setDescription('👴 Berikan buff random ke salah satu Sesepuh yang sedang online [SESEPUH ONLY]')
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

    const cooldownRemaining = getCommandCooldownRemaining(
      interaction.guildId!,
      'bless',
      BLESS_COOLDOWN_MS
    );
    if (cooldownRemaining > 0) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Bless lagi cooldown',
            `Aura bless baru bisa dipakai lagi <t:${Math.floor((Date.now() + cooldownRemaining) / 1000)}:R>.`
          ),
        ],
      });
      return;
    }

    const alasan = interaction.options.getString('alasan') ?? 'Karena Sesepuh berkenan';
    const allMembers = await interaction.guild!.members.fetch();
    const candidates = allMembers
      .filter(
        (member) =>
          !member.user.bot &&
          isSesepuh(member) &&
          member.presence?.status &&
          member.presence.status !== 'offline'
      )
      .map((member) => member)
      .filter((member) => buffQueries.getByUser.all(interaction.guildId!, member.id).length === 0);

    if (candidates.length === 0) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Nggak ada kandidat blessed',
            'Saat ini nggak ada Sesepuh online yang bisa kena bless random.'
          ),
        ],
      });
      return;
    }

    const target = candidates[Math.floor(Math.random() * candidates.length)];

    const durationMs = 10 * 60 * 1000;
    const blessRole = await resolveBlessedRole(interaction.guild!);
    const blessRoleId = blessRole.id;

    // Give role
    try {
      await target.roles.add(blessRoleId);
      await setTemporaryNickname(target, '✨ Blessed ');
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
    setCommandCooldown(interaction.guildId!, 'bless', executor.id);

    const embed = successEmbed(
      `Berkah untuk ${target.displayName}!`,
      `${blessMsg}\n\n` +
        `**Target:** ${target}\n` +
        `**Buff Role:** <@&${blessRoleId}>\n` +
        `**Benefit:** immune /curse, priority voice, flair Blessed\n` +
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
              `**Status:** immune dari /curse selama buff aktif\n` +
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
