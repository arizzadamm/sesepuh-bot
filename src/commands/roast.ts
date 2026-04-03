import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
} from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import { statsQueries } from '../utils/database';
import { sesepuhEmbed, errorEmbed, randomPick, blessedSpeech, isBlessed } from '../utils/helpers';
import { generateAiText } from '../utils/ai';

// ── Roast Pool ───────────────────────────────────────────
const ROAST_POOL = [
  (name: string) => `${name} itu kayak WiFi gratisan — kelihatan tapi nggak bisa diandalkan. 📶`,
  (name: string) => `${name} kerja kerasnya seperti error 404 — nggak ketemu-ketemu. 💻`,
  (name: string) => `Sesepuh heran, ${name} lebih sering ghosting daripada hadir. 👻`,
  (name: string) => `${name} itu selalu ada di list anggota, tapi kontribusinya kayak dark mode — gelap total. 🌑`,
  (name: string) => `Kalau circle ini game, ${name} adalah NPC yang loading terus. ⏳`,
  (name: string) => `${name} bilang dia sibuk, padahal Sesepuh lihat dia online terus. 👁️`,
  (name: string) => `${name} tu seperti update yang pending — dijanjikan tapi nggak pernah datang. 🔄`,
  (name: string) => `Semangat ${name} seperti baterai 1% — mau mati kapan saja. 🔋`,
  (name: string) => `${name} rajinnya cuma satu: rajin absen dari VC. 🎙️`,
  (name: string) => `${name} aktif pas ada giveaway aja. Sesepuh sudah tahu polamu, nak. 🎁`,
];

// ── Praise Pool ──────────────────────────────────────────
const PRAISE_POOL = [
  (name: string) => `${name} adalah permata di circle ini. Jaga terus semangatnya! 💎`,
  (name: string) => `Sesepuh bangga dengan ${name}. Kontribusinya nyata dan tulus. 🌟`,
  (name: string) => `${name} adalah contoh anggota ideal. Yang lain, belajarlah! 📚`,
  (name: string) => `Kehadiran ${name} selalu bikin suasana lebih hidup. Terus begitu! ✨`,
  (name: string) => `${name} — Sesepuh doakan rezekimu berlimpah dan uangmu banyak. 💰`,
  (name: string) => `${name} adalah MVP circle ini. Undisputed. No debate. 🏆`,
  (name: string) => `Kalau circle ini keluarga, ${name} adalah anak kesayangan Sesepuh. 🫂`,
  (name: string) => `${name} buktinya manusia bisa baik hati di internet. Langka! 🦋`,
  (name: string) => `Setiap circle butuh satu ${name}. Sayangnya, yang lain bukan dia. 😤`,
  (name: string) => `${name} aktif, produktif, dan tidak drama. Sesepuh terima kasih. 🙏`,
];

// ── /roast ───────────────────────────────────────────────
export const roastCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('roast')
    .setDescription('🔥 Roast seseorang dengan gaya Sesepuh')
    .addUserOption((opt) =>
      opt.setName('target').setDescription('Siapa yang mau diroast?').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction, _client: Client) {
    await interaction.deferReply();

    const executor = interaction.member as GuildMember;
    const target = interaction.options.getMember('target') as GuildMember;

    if (!target) {
      await interaction.editReply({
        embeds: [errorEmbed('Target tidak ditemukan', 'Member tidak ada di server.')],
      });
      return;
    }

    // Roast diri sendiri = special response
    if (target.id === executor.id) {
      await interaction.editReply({
        embeds: [
          sesepuhEmbed(
            '🔥 Auto-Roast?!',
            `${executor} mencoba me-roast dirinya sendiri...\n\n*Sesepuh menghargai kejujuranmu, nak.*\n\n` +
              `Tapi baiklah: **${executor.displayName} adalah orang yang me-roast dirinya sendiri.** Sudah cukup roast untuk hari ini.`,
            '#FF4500'
          ),
        ],
      });
      return;
    }

    const roastFn = randomPick(ROAST_POOL);
    const roastText =
      (await generateAiText(
        `Buat satu roast singkat bahasa Indonesia gaul untuk member bernama ${target.displayName}. Nada santai, lucu, tidak terlalu kejam, maksimal 2 kalimat.`,
        'Kamu adalah penulis roast lucu untuk komunitas Discord gaming Indonesia.'
      )) ?? roastFn(target.displayName);
    const opener = isBlessed(executor) ? `${blessedSpeech(executor)}\n\n` : '';

    // Update stats
    statsQueries.upsert.run({
      guild_id: interaction.guildId!,
      user_id: executor.id,
      bless_given: 0,
      curse_given: 0,
      roast_given: 1,
    });

    await interaction.editReply({
      embeds: [
        sesepuhEmbed(
          `🔥 Roast untuk ${target.displayName}`,
          `${opener}${roastText}\n\n— *Sesepuh telah berbicara.* 👴`,
          '#FF4500'
        ).setThumbnail(target.user.displayAvatarURL()),
      ],
    });
  },
};

// ── /praise ──────────────────────────────────────────────
export const praiseCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('praise')
    .setDescription('🌟 Puji seseorang dengan restu Sesepuh')
    .addUserOption((opt) =>
      opt.setName('target').setDescription('Siapa yang mau dipuji?').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction, _client: Client) {
    await interaction.deferReply();

    const target = interaction.options.getMember('target') as GuildMember;
    const executor = interaction.member as GuildMember;

    if (!target) {
      await interaction.editReply({
        embeds: [errorEmbed('Target tidak ditemukan', 'Member tidak ada di server.')],
      });
      return;
    }

    const praiseFn = randomPick(PRAISE_POOL);
    const praiseText =
      (await generateAiText(
        `Buat satu pujian singkat bahasa Indonesia gaul untuk member bernama ${target.displayName}. Nada hangat, cocok untuk komunitas Discord gaming, maksimal 2 kalimat.`,
        'Kamu adalah penulis pujian singkat yang hangat dan natural untuk komunitas Discord Indonesia.'
      )) ?? praiseFn(target.displayName);
    const opener = isBlessed(executor) ? `${blessedSpeech(executor)}\n\n` : '';

    await interaction.editReply({
      embeds: [
        sesepuhEmbed(
          `🌟 Pujian untuk ${target.displayName}`,
          `${opener}${praiseText}\n\n— *Sesepuh memberikan restunya.* 👴`,
          '#FFD700'
        )
          .setThumbnail(target.user.displayAvatarURL())
          .addFields({
            name: '👤 Dipuji oleh',
            value: `${executor}`,
            inline: true,
          }),
      ],
    });
  },
};
