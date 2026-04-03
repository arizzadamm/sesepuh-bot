import { ChannelType, SlashCommandBuilder } from 'discord.js';

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName('bless')
    .setDescription('👴 Berikan buff/role sementara kepada member [SESEPUH ONLY]')
    .addUserOption((opt) =>
      opt
        .setName('target')
        .setDescription('Member yang akan dibless')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('duration')
        .setDescription('Durasi buff (contoh: 30m, 2h, 1d)')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('alasan')
        .setDescription('Alasan memberikan buff')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
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
];
