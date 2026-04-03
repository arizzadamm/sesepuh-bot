import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import { errorEmbed, randomPick, sesepuhEmbed } from '../utils/helpers';

type MemeKey =
  | 'bruh'
  | 'anjay'
  | 'waduh'
  | 'heker'
  | 'gg'
  | 'sadviolin'
  | 'mantap'
  | 'rip';

const SOUND_MEMES: Record<
  MemeKey,
  { title: string; text: string; vibe: string; color: `#${string}` }
> = {
  bruh: {
    title: 'BRUH',
    text: 'Bruh moment terdeteksi. Circle diminta menahan tawa seperlunya.',
    vibe: 'Cocok saat ada blunder legendaris.',
    color: '#e67e22',
  },
  anjay: {
    title: 'ANJAY',
    text: 'Anjay mabar. Entah jago, entah nekat, pokoknya rame.',
    vibe: 'Cocok saat ada clutch atau keputusan absurd yang berhasil.',
    color: '#f1c40f',
  },
  waduh: {
    title: 'WADUH',
    text: 'Waduh. Situasi sudah di luar prediksi dan di luar akal sehat.',
    vibe: 'Pas buat chaos, throw, atau drama ringan.',
    color: '#c0392b',
  },
  heker: {
    title: 'HEKER',
    text: 'Heker detected. Mainnya terlalu rapi untuk ukuran manusia biasa.',
    vibe: 'Untuk ace, flick, atau luck yang mencurigakan.',
    color: '#8e44ad',
  },
  gg: {
    title: 'GG',
    text: 'GG well played. Yang kalah silakan evaluasi, yang menang jangan sombong.',
    vibe: 'Penutup klasik yang aman di segala cuaca.',
    color: '#2ecc71',
  },
  sadviolin: {
    title: 'SAD VIOLIN',
    text: 'Biola kesedihan dimainkan pelan-pelan untuk korban keadaan hari ini.',
    vibe: 'Paling pas setelah choke, disconnect, atau hampir menang.',
    color: '#3498db',
  },
  mantap: {
    title: 'MANTAP',
    text: 'Mantap kali. Sesepuh mengangguk pelan melihat performa ini.',
    vibe: 'Ketika semuanya klik dan aura carry sedang memuncak.',
    color: '#16a085',
  },
  rip: {
    title: 'RIP',
    text: 'Turut berduka untuk gameplay yang baru saja gugur di medan tempur.',
    vibe: 'Untuk kekalahan pahit yang tetap pantas dikenang.',
    color: '#7f8c8d',
  },
};

const MEME_ORDER = Object.keys(SOUND_MEMES) as MemeKey[];

export const soundboardCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
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

  async execute(interaction: ChatInputCommandInteraction, _client: Client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      await interaction.reply({
        embeds: [
          sesepuhEmbed(
            '🔊 Daftar Soundboard Meme',
            MEME_ORDER.map((key, index) => `**${index + 1}. ${SOUND_MEMES[key].title}** — \`${key}\``).join('\n'),
            '#9b59b6'
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const selectedKey =
      (interaction.options.getString('meme') as MemeKey | null) ?? randomPick(MEME_ORDER);
    const selected = SOUND_MEMES[selectedKey];
    const target = interaction.options.getUser('target');
    const useTts = interaction.options.getBoolean('tts') ?? false;

    if (!selected) {
      await interaction.reply({
        embeds: [errorEmbed('Meme tidak ditemukan', 'Pilih meme yang tersedia dari `/soundboard list`.')],
        ephemeral: true,
      });
      return;
    }

    const targetLine = target ? `\n**Ditujukan untuk:** ${target}` : '';

    await interaction.reply({
      content: useTts ? `${selected.title}! ${target ? `${target.username}, ` : ''}${selected.text}` : undefined,
      tts: useTts,
      embeds: [
        sesepuhEmbed(
          `🔊 ${selected.title}`,
          `${selected.text}${targetLine}\n\n*${selected.vibe}*`,
          selected.color
        ),
      ],
    });
  },
};
