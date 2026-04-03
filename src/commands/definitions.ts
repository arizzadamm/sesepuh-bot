import { ChannelType, SlashCommandBuilder } from 'discord.js';

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName('bless')
    .setDescription('👴 Berikan buff random ke salah satu Sesepuh yang sedang online [SESEPUH ONLY]')
    .addStringOption((opt) =>
      opt
        .setName('alasan')
        .setDescription('Alasan memberikan buff')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
    .setName('summon')
    .setDescription('📯 Panggil member ke Voice Channel dengan filter pintar [SESEPUH ONLY]')
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
          { name: 'Semua target relevan', value: 'all' },
          { name: 'Hanya yang online', value: 'online' },
          { name: 'Hanya yang idle/dnd', value: 'idle' },
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

  new SlashCommandBuilder()
    .setName('roast')
    .setDescription('🔥 Roast seseorang dengan gaya Sesepuh')
    .addUserOption((opt) =>
      opt.setName('target').setDescription('Siapa yang mau diroast?').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('praise')
    .setDescription('🌟 Puji seseorang dengan restu Sesepuh')
    .addUserOption((opt) =>
      opt.setName('target').setDescription('Siapa yang mau dipuji?').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('spin')
    .setDescription('🎰 Putar roda tantangan Sesepuh!')
    .addUserOption((opt) =>
      opt
        .setName('target')
        .setDescription('Pilih member untuk di-spin (default: dirimu sendiri)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
    .setName('soundboard')
    .setDescription('🔊 Mainkan soundboard meme versi circle')
    .addSubcommand((sub) =>
      sub.setName('list').setDescription('Lihat daftar meme soundboard')
    )
    .addSubcommand((sub) =>
      sub
        .setName('play')
        .setDescription('Kirim satu meme soundboard ke chat')
        .addStringOption((opt) =>
          opt
            .setName('meme')
            .setDescription('Pilih meme')
            .addChoices(
              { name: 'Bruh', value: 'bruh' },
              { name: 'Anjay', value: 'anjay' },
              { name: 'Waduh', value: 'waduh' },
              { name: 'Heker', value: 'heker' },
              { name: 'GG', value: 'gg' },
              { name: 'Sad Violin', value: 'sadviolin' },
              { name: 'Mantap', value: 'mantap' },
              { name: 'RIP', value: 'rip' }
            )
            .setRequired(false)
        )
        .addUserOption((opt) =>
          opt
            .setName('target')
            .setDescription('Kalau ada korban atau pahlawan yang ingin ditandai')
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName('tts')
            .setDescription('Kirim juga sebagai TTS di channel')
            .setRequired(false)
        )
    ),

  new SlashCommandBuilder()
    .setName('tutorial')
    .setDescription('📚 Menu tutorial biar para Sesepuh gampang paham')
    .addStringOption((opt) =>
      opt
        .setName('topik')
        .setDescription('Pilih topik tutorial')
        .addChoices(
          { name: 'Dasar', value: 'dasar' },
          { name: 'Summon', value: 'summon' },
          { name: 'Hukuman Miskin', value: 'hukuman' },
          { name: 'Fitur Mabar', value: 'mabar' },
          { name: 'Fitur Fun', value: 'fun' }
        )
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('statusrole')
    .setDescription('🛠️ Audit role Blessed dan miskin untuk kebutuhan bot'),

  new SlashCommandBuilder()
    .setName('remember')
    .setDescription('🧠 Simpan lore/member memory biar circle punya sejarah')
    .addUserOption((opt) =>
      opt.setName('target').setDescription('Member yang mau diingat').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('catatan').setDescription('Contoh: suka telat, raja AFK').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('lore')
    .setDescription('📜 Lihat lore dan reputasi member di circle')
    .addUserOption((opt) =>
      opt.setName('target').setDescription('Member yang mau dicek').setRequired(true)
    )
];
