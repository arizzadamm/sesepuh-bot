import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
  VoiceChannel,
  ChannelType,
} from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import { isSesepuh, errorEmbed, sesepuhEmbed, logAction, randomPick } from '../utils/helpers';

const SUMMON_MESSAGES = [
  '📯 **SESEPUH MEMANGGIL!** Semua wajib hadir ke VC sekarang juga!',
  '🔔 **KUMPUL WAJIB!** Sesepuh sudah menunggu di VC. Jangan sampai terlambat!',
  '⚡ **DARURAT ADAT!** Sesepuh perlu bicara. VC sekarang!',
  '👴 **DENGARKAN!** Sesepuh mengumumkan sesuatu yang penting. VC segera!',
  '🏮 **RAPAT CIRCLE!** Kehadiran semua anggota wajib. VC sekarang atau dikutuk!',
  '🌩️ **INI BUKAN PERMINTAAN!** Ini perintah Sesepuh. VC. Sekarang.',
];

const PRESSURE_MESSAGES = [
  '⏰ Waktu terus berjalan...',
  '😤 Sesepuh mulai tidak sabar...',
  '👀 Sesepuh tahu siapa yang belum datang...',
  '💀 Yang tidak hadir akan diingat...',
];

export const summonCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('summon')
    .setDescription('📯 Panggil semua member ke Voice Channel [SESEPUH ONLY]')
    .addChannelOption((opt) =>
      opt
        .setName('vc')
        .setDescription('Voice channel tujuan')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('pesan')
        .setDescription('Pesan tambahan dari Sesepuh')
        .setRequired(false)
    )
    .addBooleanOption((opt) =>
      opt
        .setName('pressure')
        .setDescription('Aktifkan pressure mode? (follow-up message setelah 2 menit)')
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
            'Hanya Sesepuh yang bisa memanggil seluruh circle. 👴'
          ),
        ],
      });
      return;
    }

    const vcChannel = interaction.options.getChannel('vc') as VoiceChannel;
    const pesanTambahan = interaction.options.getString('pesan');
    const pressureMode = interaction.options.getBoolean('pressure') ?? false;

    if (!vcChannel) {
      await interaction.editReply({
        embeds: [errorEmbed('Channel tidak valid', 'Pilih voice channel yang valid.')],
      });
      return;
    }

    const guild = interaction.guild!;

    // Get all non-bot members who are NOT in the target VC
    const allMembers = await guild.members.fetch();
    const membersNotInVC = allMembers.filter(
      (m) => !m.user.bot && m.voice.channelId !== vcChannel.id
    );

    const summonMsg = randomPick(SUMMON_MESSAGES);
    const vcLink = `https://discord.com/channels/${guild.id}/${vcChannel.id}`;

    let description =
      `${summonMsg}\n\n` +
      `**Voice Channel:** [${vcChannel.name}](${vcLink})\n` +
      `**Dipanggil oleh:** ${executor}\n` +
      `**Total yang dipanggil:** ${membersNotInVC.size} member`;

    if (pesanTambahan) {
      description += `\n\n💬 **Pesan Sesepuh:** ${pesanTambahan}`;
    }

    if (pressureMode) {
      description += `\n\n⚠️ *Pressure mode aktif — follow-up dalam 2 menit!*`;
    }

    const embed = sesepuhEmbed('📯 SUMMON SESEPUH', description, '#FF6600');

    await interaction.editReply({ embeds: [embed] });

    // DM semua member yang belum di VC
    let dmSuccess = 0;
    let dmFail = 0;

    const dmPromises = membersNotInVC.map(async (member) => {
      try {
        await member.send({
          embeds: [
            sesepuhEmbed(
              '📯 SESEPUH MEMANGGILMU!',
              `${executor.displayName} (Sesepuh) memanggilmu ke Voice Channel!\n\n` +
                `**VC:** [${vcChannel.name}](${vcLink})\n` +
                (pesanTambahan ? `**Pesan:** ${pesanTambahan}\n` : '') +
                `\n*Jangan biarkan Sesepuh menunggu... 👴*`,
              '#FF6600'
            ),
          ],
        });
        dmSuccess++;
      } catch {
        dmFail++;
      }
    });

    await Promise.allSettled(dmPromises);

    // Update dengan hasil DM
    const resultEmbed = sesepuhEmbed(
      '📯 SUMMON SESEPUH — Terkirim!',
      description +
        `\n\n📬 **DM Terkirim:** ${dmSuccess} member\n` +
        (dmFail > 0 ? `📵 **DM Gagal:** ${dmFail} member (DM disabled)` : ''),
      '#FF6600'
    );

    await interaction.editReply({ embeds: [resultEmbed] });

    // Log
    await logAction(
      client,
      sesepuhEmbed(
        '📋 Log: /summon',
        `${executor} memanggil semua ke ${vcChannel.name}\nDM terkirim: ${dmSuccess}, gagal: ${dmFail}`,
        '#FF6600'
      )
    );

    // Pressure mode — follow up setelah 2 menit
    if (pressureMode) {
      setTimeout(async () => {
        try {
          // Cek siapa yang masih belum datang
          const updatedMembers = await guild.members.fetch();
          const stillNotHere = updatedMembers.filter(
            (m) => !m.user.bot && m.voice.channelId !== vcChannel.id
          );

          if (stillNotHere.size === 0) {
            await interaction.followUp({
              embeds: [
                sesepuhEmbed(
                  '✅ Semua Sudah Hadir!',
                  'Semua member sudah ada di VC. Sesepuh puas. 👴',
                  '#2ecc71'
                ),
              ],
            });
            return;
          }

          const pressureMsg = randomPick(PRESSURE_MESSAGES);
          const mentions = stillNotHere.map((m) => `${m}`).join(', ');

          await interaction.followUp({
            embeds: [
              sesepuhEmbed(
                '⏰ PRESSURE MODE — Sesepuh Menunggu!',
                `${pressureMsg}\n\n` +
                  `**Yang belum hadir (${stillNotHere.size}):** ${mentions}\n\n` +
                  `*Konsekuensi ada di tangan Sesepuh...*`,
                '#FF0000'
              ),
            ],
          });
        } catch {
          // Interaction expired, skip
        }
      }, 2 * 60 * 1000); // 2 menit
    }
  },
};
