import {
  ChatInputCommandInteraction,
  Client,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import {
  errorEmbed,
  formatDuration,
  parseDuration,
  sesepuhEmbed,
  shuffleArray,
  successEmbed,
} from '../utils/helpers';
import {
  buildTeamBalanceScore,
  parseScheduleInput,
} from '../utils/featureHelpers';
import {
  matchQueries,
  scheduleQueries,
  statsQueries,
  streakQueries,
  voteQueries,
} from '../utils/database';

interface RankedMember {
  member: GuildMember;
  score: number;
}

interface VoteOptionRow {
  id: number;
  option_name: string;
}

interface VoteResultRow extends VoteOptionRow {
  vote_count: number;
}

interface ScheduleRow {
  id: number;
  title: string;
  game: string;
  scheduled_for: number;
  remind_before: number;
  host_id: string;
}

function renderBalancedTeams(rankedMembers: RankedMember[], teamCount: number): RankedMember[][] {
  const teams: RankedMember[][] = Array.from({ length: teamCount }, () => []);
  const teamScores = Array.from({ length: teamCount }, () => 0);

  for (const member of rankedMembers) {
    const weakestTeamIndex = teamScores.indexOf(Math.min(...teamScores));
    teams[weakestTeamIndex].push(member);
    teamScores[weakestTeamIndex] += member.score;
  }

  return teams;
}

function formatPollResults(results: VoteResultRow[]): string {
  return results
    .map(
      (result, index) =>
        `**${index + 1}. ${result.option_name}** — ${result.vote_count} vote`
    )
    .join('\n');
}

export const jadwalCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('jadwal')
    .setDescription('📅 Atur jadwal mabar, reminder, dan status war room')
    .addSubcommand((sub) =>
      sub
        .setName('buat')
        .setDescription('Buat jadwal mabar baru')
        .addStringOption((opt) =>
          opt.setName('judul').setDescription('Judul sesi').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('game').setDescription('Game yang dimainkan').setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('waktu')
            .setDescription('Format: YYYY-MM-DD HH:mm')
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName('ingatkan')
            .setDescription('Pengingat berapa menit sebelum mulai')
            .setMinValue(5)
            .setMaxValue(180)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('Lihat jadwal mabar aktif')
        .addIntegerOption((opt) =>
          opt
            .setName('limit')
            .setDescription('Jumlah jadwal yang ditampilkan')
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('selesai')
        .setDescription('Tandai jadwal sudah selesai')
        .addIntegerOption((opt) =>
          opt.setName('id').setDescription('ID jadwal').setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'buat') {
      const title = interaction.options.getString('judul', true);
      const game = interaction.options.getString('game', true);
      const rawTime = interaction.options.getString('waktu', true);
      const remindBefore = interaction.options.getInteger('ingatkan') ?? 15;
      const parsedTime = parseScheduleInput(rawTime);

      if (!parsedTime) {
        await interaction.reply({
          embeds: [
            errorEmbed(
              'Format waktu salah',
              'Gunakan format `YYYY-MM-DD HH:mm`, misalnya `2026-04-03 20:30`.'
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      if (parsedTime.getTime() <= Date.now()) {
        await interaction.reply({
          embeds: [
            errorEmbed(
              'Waktu sudah lewat',
              'Pilih waktu yang masih di masa depan biar circle tidak time-travel.'
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      const result = scheduleQueries.insert.run({
        guild_id: interaction.guildId!,
        channel_id: interaction.channelId,
        host_id: interaction.user.id,
        title,
        game,
        scheduled_for: parsedTime.getTime(),
        remind_before: remindBefore,
      });

      await interaction.reply({
        embeds: [
          successEmbed(
            'Jadwal mabar dibuat',
            `**ID:** ${result.lastInsertRowid}\n` +
              `**Judul:** ${title}\n` +
              `**Game:** ${game}\n` +
              `**Mulai:** <t:${Math.floor(parsedTime.getTime() / 1000)}:F>\n` +
              `**Reminder:** ${remindBefore} menit sebelumnya\n\n` +
              `War room siap. Tinggal panggil pasukan.`
          ),
        ],
      });
      return;
    }

    if (subcommand === 'list') {
      const limit = interaction.options.getInteger('limit') ?? 5;
      const schedules = scheduleQueries.getActive.all(
        interaction.guildId!,
        limit
      ) as ScheduleRow[];

      if (schedules.length === 0) {
        await interaction.reply({
          embeds: [
            sesepuhEmbed(
              '📅 Jadwal Masih Kosong',
              'Belum ada mabar aktif. Waktunya bikin agenda baru.',
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
            '📅 Jadwal Mabar Aktif',
            schedules
              .map(
                (schedule) =>
                  `**#${schedule.id} — ${schedule.title}**\n` +
                  `Game: **${schedule.game}**\n` +
                  `Mulai: <t:${Math.floor(schedule.scheduled_for / 1000)}:F>\n` +
                  `Reminder: ${schedule.remind_before} menit\n` +
                  `Host: <@${schedule.host_id}>`
              )
              .join('\n\n'),
            '#3498db'
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const scheduleId = interaction.options.getInteger('id', true);
    const result = scheduleQueries.complete.run(scheduleId, interaction.guildId!);

    await interaction.reply({
      embeds: [
        result.changes > 0
          ? successEmbed(
              'Jadwal ditutup',
              `Jadwal **#${scheduleId}** sudah ditandai selesai. Circle boleh bubar teratur.`
            )
          : errorEmbed(
              'Jadwal tidak ditemukan',
              `Saya tidak menemukan jadwal aktif dengan ID **${scheduleId}**.`
            ),
      ],
      ephemeral: true,
    });
  },
};

export const balanceCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('⚖️ Bagi tim secara lebih seimbang berdasarkan histori circle')
    .addIntegerOption((opt) =>
      opt
        .setName('jumlah_tim')
        .setDescription('Jumlah tim yang diinginkan')
        .setMinValue(2)
        .setMaxValue(5)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('mode')
        .setDescription('Ambil pemain dari VC atau member online')
        .addChoices(
          { name: '🎙️ Voice Channel Saat Ini', value: 'vc' },
          { name: '🌐 Semua Member Online', value: 'online' }
        )
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const teamCount = interaction.options.getInteger('jumlah_tim', true);
    const mode = interaction.options.getString('mode', true);
    const guild = interaction.guild!;
    const executor = interaction.member as GuildMember;

    let members: GuildMember[] = [];
    if (mode === 'vc') {
      const vcChannel = executor.voice.channel;
      if (!vcChannel) {
        await interaction.editReply({
          embeds: [
            errorEmbed('Kamu belum di VC', 'Masuk ke VC dulu kalau mau balance dari lobby aktif.'),
          ],
        });
        return;
      }

      members = vcChannel.members.filter((member) => !member.user.bot).map((member) => member);
    } else {
      const fetched = await guild.members.fetch();
      members = fetched
        .filter((member) => !member.user.bot && member.presence?.status !== 'offline')
        .map((member) => member);
    }

    if (members.length < teamCount) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Member tidak cukup',
            `Butuh minimal **${teamCount} orang** untuk membentuk ${teamCount} tim.`
          ),
        ],
      });
      return;
    }

    const rankedMembers = shuffleArray(members).map((member) => {
      const stats = statsQueries.get.get(interaction.guildId!, member.id) as
        | { bless_given: number; curse_given: number; roast_given: number }
        | undefined;
      const streak = streakQueries.get.get(interaction.guildId!, member.id) as
        | { reward_points: number; good_streak: number }
        | undefined;

      return {
        member,
        score: buildTeamBalanceScore(member, stats, streak),
      };
    });

    rankedMembers.sort((a, b) => b.score - a.score);
    const teams = renderBalancedTeams(rankedMembers, teamCount);
    const teamEmojis = ['🔴', '🔵', '🟢', '🟡', '🟣'];
    const teamNames = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];

    const description = teams
      .map((team, index) => {
        const totalScore = team.reduce((sum, entry) => sum + entry.score, 0).toFixed(1);
        const players = team
          .map((entry) => `• ${entry.member.displayName} _(power ${entry.score.toFixed(1)})_`)
          .join('\n');
        return `${teamEmojis[index]} **Tim ${teamNames[index]}** — total power ${totalScore}\n${players}`;
      })
      .join('\n\n');

    await interaction.editReply({
      embeds: [
        sesepuhEmbed(
          '⚖️ Tim Sudah Dibalance',
          description +
            `\n\nMetode ini menimbang histori circle, reward streak, dan keaktifan lobby agar tim lebih adil.`,
          '#1abc9c'
        ),
      ],
    });
  },
};

export const votemapCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('votemap')
    .setDescription('🗳️ Buat dan kelola voting map atau mode main')
    .addSubcommand((sub) =>
      sub
        .setName('buat')
        .setDescription('Buat voting baru')
        .addStringOption((opt) =>
          opt.setName('game').setDescription('Nama game').setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName('topik').setDescription('Topik voting').setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('opsi')
            .setDescription('Pisahkan opsi dengan koma, contoh: Ascent, Bind, Haven')
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('durasi')
            .setDescription('Durasi voting, contoh: 30m atau 2h')
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('vote')
        .setDescription('Berikan suara ke voting aktif')
        .addIntegerOption((opt) =>
          opt.setName('poll_id').setDescription('ID voting').setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName('opsi')
            .setDescription('Nomor opsi yang dipilih')
            .setMinValue(1)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('hasil')
        .setDescription('Lihat hasil voting')
        .addIntegerOption((opt) =>
          opt.setName('poll_id').setDescription('ID voting').setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'buat') {
      const game = interaction.options.getString('game', true);
      const topic = interaction.options.getString('topik', true);
      const rawOptions = interaction.options.getString('opsi', true);
      const duration = interaction.options.getString('durasi') ?? '30m';
      const durationMs = parseDuration(duration);

      if (!durationMs) {
        await interaction.reply({
          embeds: [
            errorEmbed(
              'Durasi tidak valid',
              'Gunakan format seperti `30m`, `1h`, atau `2d`.'
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      const options = rawOptions
        .split(',')
        .map((option) => option.trim())
        .filter(Boolean)
        .slice(0, 8);

      if (options.length < 2) {
        await interaction.reply({
          embeds: [
            errorEmbed(
              'Opsi kurang',
              'Masukkan minimal dua opsi yang dipisahkan koma.'
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      const pollResult = voteQueries.insertPoll.run({
        guild_id: interaction.guildId!,
        channel_id: interaction.channelId,
        created_by: interaction.user.id,
        topic,
        game,
        ends_at: Date.now() + durationMs,
      });

      for (const option of options) {
        voteQueries.insertOption.run(Number(pollResult.lastInsertRowid), option);
      }

      await interaction.reply({
        embeds: [
          successEmbed(
            'Voting dibuat',
            `**Poll ID:** ${pollResult.lastInsertRowid}\n` +
              `**Game:** ${game}\n` +
              `**Topik:** ${topic}\n` +
              `**Berakhir:** <t:${Math.floor((Date.now() + durationMs) / 1000)}:R>\n\n` +
              options.map((option, index) => `${index + 1}. ${option}`).join('\n') +
              `\n\nGunakan \`/votemap vote\` untuk kasih suara.`
          ),
        ],
      });
      return;
    }

    if (subcommand === 'vote') {
      const pollId = interaction.options.getInteger('poll_id', true);
      const optionNumber = interaction.options.getInteger('opsi', true);
      const poll = voteQueries.getPoll.get(pollId, interaction.guildId!) as
        | { ends_at: number; status: string }
        | undefined;

      if (!poll) {
        await interaction.reply({
          embeds: [errorEmbed('Poll tidak ditemukan', 'Cek lagi ID voting yang kamu masukkan.')],
          ephemeral: true,
        });
        return;
      }

      if (poll.status !== 'active' || poll.ends_at <= Date.now()) {
        voteQueries.closePoll.run(pollId);
        await interaction.reply({
          embeds: [errorEmbed('Voting sudah tutup', 'Poll ini sudah tidak menerima suara lagi.')],
          ephemeral: true,
        });
        return;
      }

      const options = voteQueries.getOptions.all(pollId) as VoteOptionRow[];
      const selected = options[optionNumber - 1];

      if (!selected) {
        await interaction.reply({
          embeds: [errorEmbed('Opsi tidak ada', 'Nomor opsi yang kamu pilih tidak tersedia.')],
          ephemeral: true,
        });
        return;
      }

      voteQueries.upsertBallot.run({
        poll_id: pollId,
        user_id: interaction.user.id,
        option_id: selected.id,
      });

      await interaction.reply({
        embeds: [
          successEmbed(
            'Vote masuk',
            `Suaramu untuk **${selected.option_name}** pada poll **#${pollId}** sudah tercatat.`
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const pollId = interaction.options.getInteger('poll_id', true);
    const poll = voteQueries.getPoll.get(pollId, interaction.guildId!) as
      | { topic: string; game: string; ends_at: number; status: string }
      | undefined;

    if (!poll) {
      await interaction.reply({
        embeds: [errorEmbed('Poll tidak ditemukan', 'Saya tidak menemukan voting dengan ID itu.')],
        ephemeral: true,
      });
      return;
    }

    if (poll.status === 'active' && poll.ends_at <= Date.now()) {
      voteQueries.closePoll.run(pollId);
      poll.status = 'closed';
    }

    const results = voteQueries.getResults.all(pollId) as VoteResultRow[];
    const winner = results[0];

    await interaction.reply({
      embeds: [
        sesepuhEmbed(
          `🗳️ Hasil Voting #${pollId}`,
          `**Game:** ${poll.game}\n` +
            `**Topik:** ${poll.topic}\n` +
            `**Status:** ${poll.status === 'active' ? 'Masih aktif' : 'Sudah ditutup'}\n` +
            `**Berakhir:** <t:${Math.floor(poll.ends_at / 1000)}:R>\n\n` +
            `${formatPollResults(results)}\n\n` +
            (winner
              ? `Pimpinan sementara: **${winner.option_name}**`
              : 'Belum ada suara yang masuk.'),
          '#9b59b6'
        ),
      ],
      ephemeral: true,
    });
  },
};

export const matchCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('match')
    .setDescription('🎮 Catat hasil mabar dan lihat statistik pemain')
    .addSubcommand((sub) =>
      sub
        .setName('catat')
        .setDescription('Catat hasil match terbaru')
        .addStringOption((opt) =>
          opt.setName('game').setDescription('Nama game').setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('hasil')
            .setDescription('Win atau lose')
            .addChoices(
              { name: '🏆 Win', value: 'win' },
              { name: '💀 Lose', value: 'lose' }
            )
            .setRequired(true)
        )
        .addUserOption((opt) =>
          opt.setName('mvp').setDescription('MVP match').setRequired(false)
        )
        .addUserOption((opt) =>
          opt.setName('carry').setDescription('Siapa yang paling carry').setRequired(false)
        )
        .addUserOption((opt) =>
          opt.setName('beban').setDescription('Siapa yang paling bebannya terasa').setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName('catatan').setDescription('Catatan match').setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('stats')
        .setDescription('Lihat statistik match member')
        .addUserOption((opt) =>
          opt.setName('target').setDescription('Member yang dicek').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('recent').setDescription('Lihat hasil match terbaru')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'catat') {
      const game = interaction.options.getString('game', true);
      const result = interaction.options.getString('hasil', true);
      const mvp = interaction.options.getUser('mvp');
      const carry = interaction.options.getUser('carry');
      const beban = interaction.options.getUser('beban');
      const note = interaction.options.getString('catatan') ?? null;

      const insertResult = matchQueries.insert.run({
        guild_id: interaction.guildId!,
        game,
        result,
        mvp_user_id: mvp?.id ?? null,
        carry_user_id: carry?.id ?? null,
        beban_user_id: beban?.id ?? null,
        recorded_by: interaction.user.id,
        note,
      });

      if (mvp) {
        streakQueries.reward.run({
          guild_id: interaction.guildId!,
          user_id: mvp.id,
          points: 3,
        });
      }

      if (beban) {
        streakQueries.penalty.run({
          guild_id: interaction.guildId!,
          user_id: beban.id,
          points: -1,
        });
      }

      await interaction.reply({
        embeds: [
          successEmbed(
            'Hasil match dicatat',
            `**Match ID:** ${insertResult.lastInsertRowid}\n` +
              `**Game:** ${game}\n` +
              `**Hasil:** ${result === 'win' ? 'Win' : 'Lose'}\n` +
              `**MVP:** ${mvp ? `<@${mvp.id}>` : '-'}\n` +
              `**Carry:** ${carry ? `<@${carry.id}>` : '-'}\n` +
              `**Beban:** ${beban ? `<@${beban.id}>` : '-'}\n` +
              `**Catatan:** ${note ?? '-'}`
          ),
        ],
      });
      return;
    }

    if (subcommand === 'stats') {
      const target = interaction.options.getUser('target', true);
      const stats = matchQueries.getStatsForUser.get(
        target.id,
        target.id,
        target.id,
        interaction.guildId!
      ) as { mvp_count: number | null; carry_count: number | null; beban_count: number | null };
      const streak = streakQueries.get.get(interaction.guildId!, target.id) as
        | { reward_points: number; good_streak: number; bad_streak: number }
        | undefined;

      await interaction.reply({
        embeds: [
          sesepuhEmbed(
            `🎮 Match Stats — ${target.username}`,
            `**MVP:** ${stats.mvp_count ?? 0}\n` +
              `**Carry:** ${stats.carry_count ?? 0}\n` +
              `**Beban:** ${stats.beban_count ?? 0}\n` +
              `**Reward Points:** ${streak?.reward_points ?? 0}\n` +
              `**Good Streak:** ${streak?.good_streak ?? 0}\n` +
              `**Bad Streak:** ${streak?.bad_streak ?? 0}`,
            '#e67e22'
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const recent = matchQueries.getRecent.all(interaction.guildId!, 5) as Array<{
      id: number;
      game: string;
      result: string;
      mvp_user_id: string | null;
      created_at: number;
    }>;

    if (recent.length === 0) {
      await interaction.reply({
        embeds: [
          sesepuhEmbed('🎮 Belum Ada Riwayat Match', 'Belum ada hasil match yang dicatat.', '#95a5a6'),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        sesepuhEmbed(
          '🎮 Match Terbaru',
          recent
            .map(
              (match) =>
                `**#${match.id} — ${match.game}**\n` +
                `Hasil: ${match.result === 'win' ? '🏆 Win' : '💀 Lose'}\n` +
                `MVP: ${match.mvp_user_id ? `<@${match.mvp_user_id}>` : '-'}\n` +
                `Waktu: <t:${match.created_at}:R>`
            )
            .join('\n\n'),
          '#e67e22'
        ),
      ],
      ephemeral: true,
    });
  },
};
