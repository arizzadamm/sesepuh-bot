import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import { errorEmbed, sesepuhEmbed } from '../utils/helpers';

const TUTORIALS = {
  dasar: {
    title: '📘 Tutorial Dasar Sesepuh',
    text:
      `Mulai dari yang paling penting:\n` +
      `• \`/deploy\` command tidak dipakai di Discord, itu buat register slash command dari terminal\n` +
      `• \`/bless\` kasih role buff random ke Sesepuh yang lagi online\n` +
      `• \`/curse\` kasih timeout ke member atau random status miskin\n` +
      `• \`/bless\` dan \`/curse\` punya cooldown 30 menit per server\n` +
      `• \`/summon\` buat narik orang ke VC\n` +
      `• \`/tutorial\` ini buat ngelihat panduan singkat tiap topik\n` +
      `• halaman web tutorial juga bisa dibuka dari route \`/tutorial\` di Railway`,
    color: '#3498db',
  },
  summon: {
    title: '📯 Tutorial Summon',
    text:
      `Alur summon sekarang cukup fleksibel:\n` +
      `• pilih VC tujuan\n` +
      `• atur \`audience\` ke \`online_only\` kalau mau target online aja\n` +
      `• pakai \`role\` kalau mau summon role tertentu\n` +
      `• pakai \`filter\` untuk target online, idle, atau game tertentu\n` +
      `• aktifkan \`pressure\` kalau mau ada reminder kedua\n` +
      `• aktifkan \`punish\` kalau mau satu orang random yang telat dikasih role miskin`,
    color: '#e67e22',
  },
  hukuman: {
    title: '💸 Tutorial Hukuman Miskin',
    text:
      `Supaya fitur hukuman jalan:\n` +
      `• bot akan coba cari role \`miskin\`, dan kalau belum ada dia bisa bikin otomatis\n` +
      `• kalau mau lebih rapi, kamu tetap bisa buat manual lalu isi env \`MISKIN_ROLE_ID\`\n` +
      `• bot harus punya permission \`Manage Roles\`\n` +
      `• posisi role bot harus di atas role miskin\n` +
      `• punish dari summon dipilih random dari target yang mangkir dan masih online\n` +
      `• kalau kena punish, role miskin lepas otomatis setelah 1 jam\n` +
      `• kalau user keburu masuk VC, role miskin langsung dicabut otomatis`,
    color: '#c0392b',
  },
  mabar: {
    title: '🎮 Tutorial Fitur Mabar',
    text:
      `Fitur buat ngatur tongkrongan game:\n` +
      `• \`/jadwal\` buat schedule dan reminder mabar\n` +
      `• \`/balance\` bagi tim lebih rata\n` +
      `• \`/votemap\` voting map atau mode\n` +
      `• \`/match\` catat hasil, MVP, carry, beban\n` +
      `• \`/circle\` lihat highlight dan leaderboard`,
    color: '#27ae60',
  },
  fun: {
    title: '🎉 Tutorial Fitur Fun',
    text:
      `Biar circle nggak kaku:\n` +
      `• \`/spin\` kasih tantangan random\n` +
      `• \`/soundboard\` kirim meme soundboard versi chat\n` +
      `• \`/sesepuh\` buat nasihat, keputusan, dan roastmode\n` +
      `• \`/misi\` buat misi harian circle\n` +
      `• \`/streak\` buat ngelacak member yang rajin atau bandel\n` +
      `• \`/remember\` dan \`/lore\` buat nyimpen sejarah receh circle`,
    color: '#8e44ad',
  },
} as const;

type TutorialKey = keyof typeof TUTORIALS;

export const tutorialCommand: SesepuhCommand = {
  data: new SlashCommandBuilder()
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

  async execute(interaction: ChatInputCommandInteraction, _client: Client) {
    const topic = (interaction.options.getString('topik') ?? 'dasar') as TutorialKey;
    const content = TUTORIALS[topic];

    if (!content) {
      await interaction.reply({
        embeds: [errorEmbed('Topik tidak ada', 'Pilih topik tutorial yang tersedia.')],
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      embeds: [sesepuhEmbed(content.title, content.text, content.color)],
      ephemeral: true,
    });
  },
};
