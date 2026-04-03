import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  GuildMember,
} from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import { spinQueries } from '../utils/database';
import {
  sesepuhEmbed,
  shuffleArray,
  randomPick,
  progressBar,
  errorEmbed,
  isBlessed,
  isMiskin,
  blessedSpeech,
} from '../utils/helpers';

// ── Spin Challenge Pool ──────────────────────────────────
interface Challenge {
  emoji: string;
  text: string;
  category: string;
}

const CHALLENGES: Challenge[] = [
  // Gaming
  { emoji: '🎮', text: 'Main ranked solo sampai naik 1 divisi', category: 'Gaming' },
  { emoji: '🏆', text: 'Harus top frag di match berikutnya', category: 'Gaming' },
  { emoji: '💀', text: 'Main tanpa beli item mahal selama 1 ronde', category: 'Gaming' },
  { emoji: '🎯', text: 'Harus kill minimal 10 orang di match selanjutnya', category: 'Gaming' },

  // Social
  { emoji: '🎤', text: 'Harus voice chat di VC minimal 30 menit hari ini', category: 'Social' },
  { emoji: '📸', text: 'Share foto meja belajar/kerja kamu sekarang', category: 'Social' },
  { emoji: '🎵', text: 'Share lagu yang lagi kamu dengerin sekarang', category: 'Social' },
  { emoji: '📝', text: 'Ceritakan hal memalukan yang pernah terjadi', category: 'Social' },

  // Dares
  { emoji: '🌶️', text: 'Tidak boleh mengeluh selama 24 jam', category: 'Dare' },
  { emoji: '🙈', text: 'Harus pakai foto profil jelek selama 3 hari', category: 'Dare' },
  { emoji: '🎭', text: 'Harus RP sebagai NPC selama 10 menit di chat', category: 'Dare' },
  { emoji: '🔇', text: 'Mute diri sendiri di VC selama 15 menit', category: 'Dare' },

  // Positif
  { emoji: '💪', text: 'Push-up 20x sekarang dan kirim buktinya', category: 'Aktif' },
  { emoji: '📚', text: 'Baca artikel menarik dan share ringkasannya di chat', category: 'Aktif' },
  { emoji: '🍳', text: 'Masak sesuatu dan share fotonya', category: 'Aktif' },
  { emoji: '🎨', text: 'Gambar sesuatu dalam 5 menit dan share', category: 'Aktif' },

  // Sesepuh Special
  { emoji: '👴', text: 'Harus manggil semua orang "Sesepuh" selama 1 jam', category: 'Sesepuh' },
  { emoji: '🙏', text: 'Wajib minta maaf ke satu orang yang pernah kamu ghosting', category: 'Sesepuh' },
  { emoji: '📯', text: 'Harus announce pencapaian terkecilmu di chat dengan serius', category: 'Sesepuh' },
  { emoji: '🧓', text: 'Tulis wisdom quote versimu sendiri di chat', category: 'Sesepuh' },
];

// ── /spin ────────────────────────────────────────────────
export const spinCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('spin')
    .setDescription('🎰 Putar roda tantangan Sesepuh!')
    .addUserOption((opt) =>
      opt
        .setName('target')
        .setDescription('Pilih member untuk di-spin (default: dirimu sendiri)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, _client: Client) {
    await interaction.deferReply();

    const executor = interaction.member as GuildMember;
    const target =
      (interaction.options.getMember('target') as GuildMember | null) ?? executor;

    if (isMiskin(executor)) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Lagi kena nerf',
            'Role miskin bikin kamu nggak bisa pakai `/spin` dulu. Masuk VC dulu biar tobat.'
          ),
        ],
      });
      return;
    }

    const opener = isBlessed(executor) ? `${blessedSpeech(executor)}\n\n` : '';

    // Animasi spinning
    const spinningEmbed = sesepuhEmbed(
      '🎰 Roda Berputar...',
      `${opener}Lagi milih tantangan buat **${target.displayName}**...\n\n` +
        `${progressBar(0, 10)} 0%`,
      '#9B59B6'
    );
    await interaction.editReply({ embeds: [spinningEmbed] });

    // Simulasi animasi (update bertahap)
    await new Promise((r) => setTimeout(r, 800));

    const midEmbed = sesepuhEmbed(
      '🎰 Roda Berputar...',
      `${opener}Bentar, roda lagi muter buat **${target.displayName}**...\n\n` +
        `${progressBar(6, 10)} 60%`,
      '#9B59B6'
    );
    await interaction.editReply({ embeds: [midEmbed] });

    await new Promise((r) => setTimeout(r, 800));

    // Pick challenge
    const challenge = randomPick(CHALLENGES);

    // Save to DB
    spinQueries.insert.run({
      guild_id: interaction.guildId!,
      user_id: target.id,
      challenge: challenge.text,
    });

    const resultEmbed = sesepuhEmbed(
      `🎰 Tantangan untuk ${target.displayName}!`,
      `${challenge.emoji} **${challenge.text}**\n\n` +
        `**Kategori:** ${challenge.category}\n` +
        `**Kena spin:** ${target}\n` +
        (target.id !== executor.id ? `**Yang muterin:** ${executor}\n` : '') +
        `\n${isBlessed(executor) ? 'Aura Blessed aktif, jadi omonganmu otomatis lebih didenger.' : '*Udah kepilih, jalanin ya jangan ngeles.*'}`,
      '#9B59B6'
    );

    await interaction.editReply({ embeds: [resultEmbed] });
  },
};

// ── /team ────────────────────────────────────────────────
export const teamCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('⚔️ Generate tim secara acak dari member yang ada di VC atau mention')
    .addIntegerOption((opt) =>
      opt
        .setName('jumlah_tim')
        .setDescription('Berapa tim yang ingin dibuat? (2-5)')
        .setMinValue(2)
        .setMaxValue(5)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('mode')
        .setDescription('Mode pengambilan member')
        .addChoices(
          { name: '🎙️ Dari VC saat ini', value: 'vc' },
          { name: '🌐 Semua member online', value: 'online' }
        )
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction, _client: Client) {
    await interaction.deferReply();

    const jumlahTim = interaction.options.getInteger('jumlah_tim', true);
    const mode = interaction.options.getString('mode', true);
    const executor = interaction.member as GuildMember;
    const guild = interaction.guild!;

    if (isMiskin(executor)) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Akses dibatasi',
            'Role miskin bikin kamu belum boleh pakai `/team`. Selesaikan masa cupumu dulu.'
          ),
        ],
      });
      return;
    }

    let memberPool: GuildMember[] = [];

    if (mode === 'vc') {
      // Ambil member dari VC yang sama dengan executor
      const vcChannel = executor.voice.channel;
      if (!vcChannel) {
        await interaction.editReply({
          embeds: [
            sesepuhEmbed(
              '❌ Kamu tidak di VC!',
              'Masuk ke Voice Channel dulu untuk mode VC.',
              '#e74c3c'
            ),
          ],
        });
        return;
      }

      memberPool = vcChannel.members
        .filter((m) => !m.user.bot)
        .map((m) => m);
    } else {
      // Ambil semua member online
      const members = await guild.members.fetch();
      memberPool = members
        .filter((m) => !m.user.bot && m.presence?.status !== 'offline')
        .map((m) => m);
    }

    if (memberPool.length < jumlahTim) {
      await interaction.editReply({
        embeds: [
          sesepuhEmbed(
            '❌ Member tidak cukup!',
            `Butuh minimal **${jumlahTim} member** untuk membuat ${jumlahTim} tim.\n` +
              `Member tersedia: **${memberPool.length}**`,
            '#e74c3c'
          ),
        ],
      });
      return;
    }

    // Shuffle and distribute
    const shuffled = shuffleArray(memberPool);
    const teams: GuildMember[][] = Array.from({ length: jumlahTim }, () => []);

    shuffled.forEach((member, index) => {
      teams[index % jumlahTim].push(member);
    });

    const teamEmojis = ['🔴', '🔵', '🟢', '🟡', '🟣'];
    const teamNames = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];

    let description =
      `${isBlessed(executor) ? `${blessedSpeech(executor)}\n\n` : ''}` +
      `**Mode:** ${mode === 'vc' ? '🎙️ Voice Channel' : '🌐 Member Online'}\n` +
      `**Total Member:** ${memberPool.length}\n` +
      `**Jumlah Tim:** ${jumlahTim}\n\n` +
      `━━━━━━━━━━━━━━━━━\n\n`;

    teams.forEach((team, i) => {
      const memberList = team.map((m) => `• ${m.displayName}`).join('\n');
      description += `${teamEmojis[i]} **Tim ${teamNames[i]}** (${team.length} orang)\n${memberList}\n\n`;
    });

    description += `*Tim dibentuk oleh Sesepuh. Tidak ada negosiasi.* 👴`;

    await interaction.editReply({
      embeds: [sesepuhEmbed('⚔️ Tim Telah Dibentuk!', description, '#3498DB')],
    });
  },
};
