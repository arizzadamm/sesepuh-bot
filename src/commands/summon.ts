import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
  VoiceChannel,
  ChannelType,
  Role,
} from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import { penaltyQueries } from '../utils/database';
import {
  isSesepuh,
  errorEmbed,
  sesepuhEmbed,
  logAction,
  randomPick,
  resolveMiskinRole,
  setTemporaryNickname,
} from '../utils/helpers';

const MISKIN_DURATION_MS = 60 * 60 * 1000;

const SUMMON_MESSAGES = [
  '📯 Ayo ngumpul, masuk VC sekarang.',
  '🔔 Kumpul dulu, ada yang mau dibahas di VC.',
  '⚡ Gas ke VC, jangan ngilang.',
  '👴 Yuk merapat, lagi ada panggilan circle.',
  '🏮 VC dulu bentar, ramein lobby.',
  '🌩️ Masuk VC ya, jangan disuruh dua kali.',
];

const PRESSURE_MESSAGES = [
  '⏰ Udah ditungguin nih...',
  '😤 Ayo gerak, jangan lama-lama.',
  '👀 Masih keliatan siapa yang belum masuk.',
  '💀 Yang belum join bakal kena sorot.',
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
    )
    .addBooleanOption((opt) =>
      opt
        .setName('punish')
        .setDescription('Kalau tetap nggak masuk, auto kasih role miskin')
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName('audience')
        .setDescription('Mau summon semua target atau yang online aja?')
        .addChoices(
          { name: 'Semua termasuk offline', value: 'all' },
          { name: 'Online aja', value: 'online_only' }
        )
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName('filter')
        .setDescription('Filter target summon')
        .addChoices(
          { name: 'Semua member relevan', value: 'all' },
          { name: 'Hanya yang online', value: 'online' },
          { name: 'Hanya yang idle/away', value: 'idle' },
          { name: 'Berdasarkan game', value: 'game' }
        )
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName('game_keyword')
        .setDescription('Dipakai jika filter = game, contoh: valorant')
        .setRequired(false)
    )
    .addRoleOption((opt) =>
      opt
        .setName('role')
        .setDescription('Targetkan hanya member dengan role ini')
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
            'Yang bisa narik satu circle ke VC cuma Sesepuh. 👴'
          ),
        ],
      });
      return;
    }

    const vcChannel = interaction.options.getChannel('vc') as VoiceChannel;
    const pesanTambahan = interaction.options.getString('pesan');
    const pressureMode = interaction.options.getBoolean('pressure') ?? false;
    const punishMode = interaction.options.getBoolean('punish') ?? false;
    const audience = interaction.options.getString('audience') ?? 'all';
    const filter = interaction.options.getString('filter') ?? 'all';
    const gameKeyword = interaction.options.getString('game_keyword')?.toLowerCase();
    const targetRole = interaction.options.getRole('role') as Role | null;
    const loserGifUrl =
      process.env.LOSER_GIF_URL ??
      'https://media.tenor.com/ltj4jJkZ8dAAAAAC/you-lose-loser.gif';
    const miskinMuteMinutes = Math.floor(Math.random() * 2) + 1;

    if (!vcChannel) {
      await interaction.editReply({
        embeds: [errorEmbed('Channel tidak valid', 'Pilih voice channel yang valid.')],
      });
      return;
    }

    if (filter === 'game' && !gameKeyword) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Keyword game dibutuhkan',
            'Kalau memakai filter game, isi juga `game_keyword` seperti `valorant` atau `dota`.'
          ),
        ],
      });
      return;
    }

    const guild = interaction.guild!;
    const miskinRole = punishMode ? await resolveMiskinRole(guild) : null;
    const miskinRoleId = miskinRole?.id ?? null;

    const shouldTargetMember = (member: GuildMember, onlineOnlyForPunish = false): boolean => {
      if (member.user.bot || member.voice.channelId === vcChannel.id) return false;
      if (targetRole && !member.roles.cache.has(targetRole.id)) return false;

      const isOnline = Boolean(member.presence) && member.presence?.status !== 'offline';

      if (audience === 'online_only' && !isOnline) {
        return false;
      }

      if (onlineOnlyForPunish && !isOnline) {
        return false;
      }

      if (filter === 'online') {
        return isOnline;
      }

      if (filter === 'idle') {
        return member.presence?.status === 'idle' || member.presence?.status === 'dnd';
      }

      if (filter === 'game') {
        if (!gameKeyword) return false;
        const activityNames =
          member.presence?.activities.map((activity) => activity.name.toLowerCase()) ?? [];
        return activityNames.some((name) => name.includes(gameKeyword));
      }

      return true;
    };

    // Get all non-bot members who are NOT in the target VC
    const allMembers = await guild.members.fetch();
    const membersNotInVC = allMembers.filter((m) => shouldTargetMember(m));

    const summonMsg = randomPick(SUMMON_MESSAGES);
    const vcLink = `https://discord.com/channels/${guild.id}/${vcChannel.id}`;

    let description =
      `${summonMsg}\n\n` +
      `**Voice Channel:** [${vcChannel.name}](${vcLink})\n` +
      `**Dipanggil oleh:** ${executor}\n` +
      `**Total yang dipanggil:** ${membersNotInVC.size} member\n` +
      `**Audience:** ${
        audience === 'online_only' ? 'Online aja' : 'Semua termasuk offline'
      }\n` +
      `**Role:** ${targetRole ? `<@&${targetRole.id}>` : 'Semua role'}\n` +
      `**Filter:** ${
        filter === 'all'
          ? 'Semua target relevan'
          : filter === 'online'
            ? 'Hanya yang online'
            : filter === 'idle'
              ? 'Hanya yang idle/dnd'
              : `Berdasarkan game: ${gameKeyword ?? '-'}`
      }`;

    if (pesanTambahan) {
      description += `\n\n💬 **Pesan Sesepuh:** ${pesanTambahan}`;
    }

    if (pressureMode) {
      description += `\n\n⚠️ *Pressure mode aktif, bakal diingetin lagi 2 menit lagi.*`;
    }

    if (punishMode) {
      description += `\n\n💸 *Punish mode aktif, yang masih ngilang bakal dikasih role miskin + mute singkat.*`;
    }

    const embed = sesepuhEmbed('📯 Panggilan VC', description, '#FF6600');

    await interaction.editReply({ embeds: [embed] });

    // DM semua member yang belum di VC
    let dmSuccess = 0;
    let dmFail = 0;

    const dmPromises = membersNotInVC.map(async (member) => {
      try {
        await member.send({
          embeds: [
            sesepuhEmbed(
              '📯 Ayo Masuk VC',
              `${executor.displayName} lagi manggil kamu buat masuk Voice Channel.\n\n` +
                `**VC:** [${vcChannel.name}](${vcLink})\n` +
                (pesanTambahan ? `**Pesan:** ${pesanTambahan}\n` : '') +
                `\n*Cus masuk kalau sempat, lagi pada ngumpul.*`,
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
      '📯 Panggilan VC Terkirim',
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
          const stillNotHere = updatedMembers.filter((m) => shouldTargetMember(m));

          if (stillNotHere.size === 0) {
            await interaction.followUp({
              embeds: [
                sesepuhEmbed(
                  '✅ Semua Sudah Hadir!',
                  'Semua target udah masuk VC. Aman, lengkap.',
                  '#2ecc71'
                ),
              ],
            });
            return;
          }

          const pressureMsg = randomPick(PRESSURE_MESSAGES);
          const mentions = stillNotHere.map((m) => `${m}`).join(', ');
          const punished: string[] = [];

          if (punishMode && miskinRoleId) {
            const punishCandidates = stillNotHere
              .filter((member) => shouldTargetMember(member, true))
              .map((member) => member);
            const chosen = punishCandidates.length > 0
              ? punishCandidates[Math.floor(Math.random() * punishCandidates.length)]
              : null;

            if (chosen) {
              try {
                await chosen.roles.add(miskinRoleId);
                await setTemporaryNickname(chosen, 'Cupu ');
                if (!chosen.communicationDisabledUntilTimestamp || chosen.communicationDisabledUntilTimestamp < Date.now()) {
                  await chosen.timeout(miskinMuteMinutes * 60 * 1000, 'Kena punish summon: miskin');
                }
                penaltyQueries.deleteActiveForRole.run(interaction.guildId!, chosen.id, miskinRoleId);
                penaltyQueries.insert.run({
                  guild_id: interaction.guildId!,
                  user_id: chosen.id,
                  role_id: miskinRoleId,
                  expires_at: Date.now() + MISKIN_DURATION_MS,
                  created_by: executor.id,
                  reason: `Telat join hasil summon, mute ${miskinMuteMinutes} menit`,
                });
                punished.push(`${chosen}`);
              } catch (error) {
                console.error(`[Summon] Failed to assign miskin role to ${chosen.id}:`, error);
              }
            }
          }

          await interaction.followUp({
            embeds: [
              sesepuhEmbed(
                punishMode ? '💸 Telat Masuk VC' : '⏰ Reminder Kedua',
                `${pressureMsg}\n\n` +
                  `**Yang belum hadir (${stillNotHere.size}):** ${mentions}\n\n` +
                  (punished.length > 0
                    ? `**Yang kena role miskin random 1 jam + mute ${miskinMuteMinutes} menit:** ${punished.join(', ')}\n\n`
                    : '') +
                  `*Masih ditunggu di VC.*`,
                '#FF0000'
              ).setImage(punishMode ? loserGifUrl : null),
            ],
          });
        } catch {
          // Interaction expired, skip
        }
      }, 2 * 60 * 1000); // 2 menit
    }
  },
};
