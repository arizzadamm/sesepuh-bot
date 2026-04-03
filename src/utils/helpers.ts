import {
  EmbedBuilder,
  GuildMember,
  TextChannel,
  Client,
  ColorResolvable,
} from 'discord.js';

// ── Embed Builder Helpers ────────────────────────────────
export function sesepuhEmbed(
  title: string,
  description: string,
  color: ColorResolvable = '#FFD700'
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: '👴 Sesepuh Bot v1 – Circle Edition' });
}

export function successEmbed(title: string, description: string) {
  return sesepuhEmbed(`✅ ${title}`, description, '#2ecc71');
}

export function errorEmbed(title: string, description: string) {
  return sesepuhEmbed(`❌ ${title}`, description, '#e74c3c');
}

export function warningEmbed(title: string, description: string) {
  return sesepuhEmbed(`⚠️ ${title}`, description, '#f39c12');
}

// ── Duration Parser ──────────────────────────────────────
export function parseDuration(input: string): number | null {
  const regex = /^(\d+)(s|m|h|d)$/i;
  const match = input.match(regex);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  const ms = value * multipliers[unit];

  // Discord timeout max = 28 days
  const MAX_TIMEOUT = 28 * 24 * 60 * 60 * 1000;
  return ms <= MAX_TIMEOUT ? ms : null;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} hari`;
  if (hours > 0) return `${hours} jam`;
  if (minutes > 0) return `${minutes} menit`;
  return `${seconds} detik`;
}

// ── Permission Check ─────────────────────────────────────
export function isSesepuh(member: GuildMember): boolean {
  const sesepuhRoleId = process.env.SESEPUH_ROLE_ID;
  if (!sesepuhRoleId) return member.permissions.has('Administrator');
  return (
    member.roles.cache.has(sesepuhRoleId) ||
    member.permissions.has('Administrator')
  );
}

// ── Log to Channel ───────────────────────────────────────
export async function logAction(
  client: Client,
  embed: EmbedBuilder
): Promise<void> {
  const logChannelId = process.env.LOG_CHANNEL_ID;
  if (!logChannelId) return;

  try {
    const channel = await client.channels.fetch(logChannelId);
    if (channel instanceof TextChannel) {
      await channel.send({ embeds: [embed] });
    }
  } catch {
    // Log channel not found, skip silently
  }
}

// ── Shuffle Array ────────────────────────────────────────
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Random Pick ──────────────────────────────────────────
export function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// ── Progress Bar ─────────────────────────────────────────
export function progressBar(value: number, max: number, size = 10): string {
  const filled = Math.round((value / max) * size);
  return '█'.repeat(filled) + '░'.repeat(size - filled);
}
