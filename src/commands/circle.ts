import {
  ChatInputCommandInteraction,
  Client,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import {
  errorEmbed,
  isSesepuh,
  randomPick,
  sesepuhEmbed,
  successEmbed,
} from '../utils/helpers';
import {
  getDailyMissions,
  getMissionDay,
  getPreviousMissionDay,
} from '../utils/featureHelpers';
import {
  matchQueries,
  missionQueries,
  statsQueries,
  streakQueries,
} from '../utils/database';

type StreakRow = {
  good_streak: number;
  bad_streak: number;
  best_good_streak: number;
  best_bad_streak: number;
  reward_points: number;
  mission_streak: number;
};

const NASIHAT_POOL = [
  (topic: string) =>
    `Tentang **${topic}**, Sesepuh bilang: jangan cari timing sempurna, cari timing yang kamu sanggup jaga sampai selesai.`,
  (topic: string) =>
    `Untuk **${topic}**, kebijaksanaan hari ini sederhana: yang penting bukan paling hebat, tapi paling konsisten.`,
  (topic: string) =>
    `Jika urusannya **${topic}**, kurangi gengsi, tambah komunikasi. Banyak masalah circle selesai di sana.`,
  (topic: string) =>
    `Pada topik **${topic}**, Sesepuh menyarankan satu hal: jangan overthink sebelum party bahkan kebentuk.`,
];

const ROASTMODE_POOL = [
  (name: string, context: string) =>
    `${name} di **${context}** itu seperti loading screen panjang: semua nunggu, hasilnya belum tentu bagus.`,
  (name: string, context: string) =>
    `${name} kalau urusannya **${context}** selalu percaya diri. Sayang, realitanya sering AFK dari kemampuan.`,
  (name: string, context: string) =>
    `${name} di ranah **${context}** punya aura carry. Aura doang, performa masih menunggu patch berikutnya.`,
  (name: string, context: string) =>
    `${name} saat bahas **${context}** terdengar meyakinkan. Circle hampir percaya, sampai match dimulai.`,
];

export const circleCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('circle')
    .setDescription('🏆 Lihat MVP, highlight, dan leaderboard circle')
    .addSubcommand((sub) =>
      sub
        .setName('mvp')
        .setDescription('Lihat MVP circle berdasarkan data match dan aktivitas')
        .addIntegerOption((opt) =>
          opt
            .setName('limit')
            .setDescription('Jumlah leaderboard')
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('highlight').setDescription('Ringkasan highlight circle terbaru')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'mvp') {
      const limit = interaction.options.getInteger('limit') ?? 5;
      const leaders = streakQueries.getLeaderboard.all(
        interaction.guildId!,
        limit
      ) as Array<{
        user_id: string;
        reward_points: number;
        good_streak: number;
        mission_streak: number;
      }>;

      if (leaders.length === 0) {
        await interaction.reply({
          embeds: [
            sesepuhEmbed(
              '🏆 MVP Belum Ada',
              'Data circle masih kosong. Main dulu, catat hasilnya, baru mahkota dibagikan.',
              '#95a5a6'
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        embeds: [
          sesepuhEmbed(
            '🏆 MVP Circle',
            leaders
              .map(
                (leader, index) =>
                  `**${index + 1}. <@${leader.user_id}>**\n` +
                  `Points: ${leader.reward_points} | Good streak: ${leader.good_streak} | Misi: ${leader.mission_streak}`
              )
              .join('\n\n'),
            '#f1c40f'
          ),
        ],
      });
      return;
    }

    const sesepuhLeaders = statsQueries.getLeaderboard.all(
      interaction.guildId!,
      3
    ) as Array<{
      user_id: string;
      bless_given: number;
      curse_given: number;
      roast_given: number;
      score: number;
    }>;
    const recentMatches = matchQueries.getRecent.all(interaction.guildId!, 3) as Array<{
      game: string;
      result: string;
      mvp_user_id: string | null;
      created_at: number;
    }>;

    const summary =
      `**Sesepuh Tersibuk**\n` +
      (sesepuhLeaders.length > 0
        ? sesepuhLeaders
            .map(
              (entry) =>
                `• <@${entry.user_id}> — score ${entry.score} (bless ${entry.bless_given}, curse ${entry.curse_given}, roast ${entry.roast_given})`
            )
            .join('\n')
        : '• Belum ada data aktivitas') +
      `\n\n**Match Terbaru**\n` +
      (recentMatches.length > 0
        ? recentMatches
            .map(
              (match) =>
                `• ${match.game} — ${match.result === 'win' ? 'Win' : 'Lose'} | MVP ${match.mvp_user_id ? `<@${match.mvp_user_id}>` : '-'} | <t:${match.created_at}:R>`
            )
            .join('\n')
        : '• Belum ada hasil match');

    await interaction.reply({
      embeds: [sesepuhEmbed('✨ Highlight Circle', summary, '#8e44ad')],
    });
  },
};

export const streakCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('streak')
    .setDescription('📈 Kelola reward/punishment streak anggota circle')
    .addSubcommand((sub) =>
      sub
        .setName('lihat')
        .setDescription('Lihat streak member')
        .addUserOption((opt) =>
          opt.setName('target').setDescription('Member yang dicek').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('apresiasi')
        .setDescription('Tambah reward streak member')
        .addUserOption((opt) =>
          opt.setName('target').setDescription('Member yang diapresiasi').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('alasan').setDescription('Alasan apresiasi').setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('pelanggaran')
        .setDescription('Tambah bad streak member')
        .addUserOption((opt) =>
          opt.setName('target').setDescription('Member yang dicatat').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('alasan').setDescription('Alasan pelanggaran').setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser('target', true);

    if (subcommand !== 'lihat') {
      const executor = interaction.member as GuildMember;
      if (!isSesepuh(executor)) {
        await interaction.reply({
          embeds: [errorEmbed('Akses ditolak', 'Hanya Sesepuh yang boleh mengatur streak.')],
          ephemeral: true,
        });
        return;
      }
    }

    if (subcommand === 'lihat') {
      const streak = streakQueries.get.get(interaction.guildId!, target.id) as
        | StreakRow
        | undefined;

      await interaction.reply({
        embeds: [
          sesepuhEmbed(
            `📈 Streak — ${target.username}`,
            `**Good Streak:** ${streak?.good_streak ?? 0}\n` +
              `**Bad Streak:** ${streak?.bad_streak ?? 0}\n` +
              `**Best Good:** ${streak?.best_good_streak ?? 0}\n` +
              `**Best Bad:** ${streak?.best_bad_streak ?? 0}\n` +
              `**Reward Points:** ${streak?.reward_points ?? 0}\n` +
              `**Mission Streak:** ${streak?.mission_streak ?? 0}\n\n` +
              `${(streak?.good_streak ?? 0) >= 3 ? 'Layak dipertimbangkan untuk `/bless`.' : 'Belum ada aura buff spesial.'}\n` +
              `${(streak?.bad_streak ?? 0) >= 3 ? 'Sudah mendekati area `/curse`.' : 'Masih aman dari amarah Sesepuh.'}`,
            '#16a085'
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const reason = interaction.options.getString('alasan') ?? 'Tanpa catatan tambahan';

    if (subcommand === 'apresiasi') {
      streakQueries.reward.run({
        guild_id: interaction.guildId!,
        user_id: target.id,
        points: 2,
      });

      await interaction.reply({
        embeds: [
          successEmbed(
            'Reward streak bertambah',
            `<@${target.id}> mendapat apresiasi.\n**Alasan:** ${reason}`
          ),
        ],
      });
      return;
    }

    streakQueries.penalty.run({
      guild_id: interaction.guildId!,
      user_id: target.id,
      points: -2,
    });

    await interaction.reply({
      embeds: [
        sesepuhEmbed(
          '📉 Bad streak bertambah',
          `<@${target.id}> tercatat melakukan pelanggaran.\n**Alasan:** ${reason}`,
          '#c0392b'
        ),
      ],
    });
  },
};

export const misiCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('misi')
    .setDescription('🎯 Ambil misi harian circle dan claim progresmu')
    .addSubcommand((sub) =>
      sub.setName('harian').setDescription('Lihat misi harian hari ini')
    )
    .addSubcommand((sub) =>
      sub
        .setName('claim')
        .setDescription('Claim misi harian yang sudah selesai')
        .addIntegerOption((opt) =>
          opt
            .setName('nomor')
            .setDescription('Nomor misi 1-3')
            .setMinValue(1)
            .setMaxValue(3)
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const missionDay = getMissionDay();
    const missions = getDailyMissions(interaction.guildId!);

    if (subcommand === 'harian') {
      const claimed = missionQueries.getClaimsForDay.all(
        interaction.guildId!,
        interaction.user.id,
        missionDay
      ) as Array<{ mission_number: number }>;
      const claimedNumbers = new Set(claimed.map((entry) => entry.mission_number));

      await interaction.reply({
        embeds: [
          sesepuhEmbed(
            '🎯 Misi Harian Circle',
            missions
              .map((mission, index) => {
                const done = claimedNumbers.has(index + 1) ? '✅' : '⬜';
                return `${done} **${index + 1}.** ${mission}`;
              })
              .join('\n'),
            '#27ae60'
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const missionNumber = interaction.options.getInteger('nomor', true);
    const missionText = missions[missionNumber - 1];

    if (!missionText) {
      await interaction.reply({
        embeds: [errorEmbed('Nomor misi salah', 'Pilih nomor misi antara 1 sampai 3.')],
        ephemeral: true,
      });
      return;
    }

    try {
      missionQueries.claim.run({
        guild_id: interaction.guildId!,
        user_id: interaction.user.id,
        mission_day: missionDay,
        mission_number: missionNumber,
        mission_text: missionText,
      });
    } catch {
      await interaction.reply({
        embeds: [
          errorEmbed(
            'Sudah pernah di-claim',
            `Misi **${missionNumber}** untuk hari ini sudah pernah kamu klaim.`
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    streakQueries.claimMission.run({
      guild_id: interaction.guildId!,
      user_id: interaction.user.id,
      points: 2,
      mission_day: missionDay,
      previous_day: getPreviousMissionDay(),
    });

    await interaction.reply({
      embeds: [
        successEmbed(
          'Misi berhasil di-claim',
          `**Misi ${missionNumber}:** ${missionText}\nReward points bertambah.`
        ),
      ],
      ephemeral: true,
    });
  },
};

export const sesepuhCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('sesepuh')
    .setDescription('👴 Nasihat, keputusan, dan wisdom circle edition')
    .addSubcommand((sub) =>
      sub
        .setName('nasihat')
        .setDescription('Minta nasihat Sesepuh')
        .addStringOption((opt) =>
          opt.setName('topik').setDescription('Topik nasihat').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('putuskan')
        .setDescription('Biarkan Sesepuh memilih di antara opsi')
        .addStringOption((opt) =>
          opt
            .setName('opsi')
            .setDescription('Pisahkan opsi dengan koma')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('roastmode')
        .setDescription('Minta roast kontekstual dari Sesepuh')
        .addUserOption((opt) =>
          opt.setName('target').setDescription('Siapa yang diroast').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('konteks').setDescription('Contoh: ranked, scrim, duo').setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, _client: Client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'nasihat') {
      const topic = interaction.options.getString('topik', true);
      await interaction.reply({
        embeds: [
          sesepuhEmbed('👴 Nasihat Sesepuh', randomPick(NASIHAT_POOL)(topic), '#d35400'),
        ],
      });
      return;
    }

    if (subcommand === 'putuskan') {
      const options = interaction.options
        .getString('opsi', true)
        .split(',')
        .map((option) => option.trim())
        .filter(Boolean);

      if (options.length < 2) {
        await interaction.reply({
          embeds: [
            errorEmbed('Opsi kurang', 'Kasih minimal dua opsi yang dipisahkan koma.'),
          ],
          ephemeral: true,
        });
        return;
      }

      const chosen = randomPick(options);
      await interaction.reply({
        embeds: [
          sesepuhEmbed(
            '⚖️ Putusan Sesepuh',
            `Dari semua kebisingan itu, pilihan Sesepuh jatuh pada: **${chosen}**`,
            '#d35400'
          ),
        ],
      });
      return;
    }

    const target = interaction.options.getUser('target', true);
    const context = interaction.options.getString('konteks', true);
    await interaction.reply({
      embeds: [
        sesepuhEmbed(
          '🔥 Roastmode Sesepuh',
          randomPick(ROASTMODE_POOL)(target.username, context),
          '#d35400'
        ),
      ],
    });
  },
};
