import {
  EmbedBuilder,
  GuildMember,
  TextChannel,
  Client,
  ColorResolvable,
  Guild,
  PermissionFlagsBits,
  Role,
} from 'discord.js';
import { cooldownQueries } from './database';

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
    .setFooter({ text: '👴 Sesepuh Bot Beta (Created by MontenezaX)' });
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

export function isBlessed(member: GuildMember): boolean {
  const blessRoleId = process.env.BLESS_ROLE_ID;
  if (blessRoleId && member.roles.cache.has(blessRoleId)) return true;
  return member.roles.cache.some((role) => role.name.toLowerCase() === 'blessed');
}

export function isMiskin(member: GuildMember): boolean {
  const miskinRoleId = process.env.MISKIN_ROLE_ID;
  if (miskinRoleId && member.roles.cache.has(miskinRoleId)) return true;
  return member.roles.cache.some((role) => role.name.toLowerCase() === 'miskin');
}

export async function resolveBlessedRole(guild: Guild): Promise<Role> {
  const configured = process.env.BLESS_ROLE_ID
    ? guild.roles.cache.get(process.env.BLESS_ROLE_ID)
    : null;
  if (configured) return configured;

  const existing = guild.roles.cache.find((role) => role.name.toLowerCase() === 'blessed');
  if (existing) {
    if (existing.color !== 0xf1c40f || !existing.permissions.has(PermissionFlagsBits.PrioritySpeaker)) {
      await existing.edit({
        color: 0xf1c40f,
        permissions: existing.permissions.add(PermissionFlagsBits.PrioritySpeaker),
        reason: 'Sync Blessed role defaults for Sesepuh Bot',
      }).catch(() => {});
    }
    return existing;
  }

  return guild.roles.create({
    name: 'Blessed',
    color: 0xf1c40f,
    permissions: [PermissionFlagsBits.PrioritySpeaker],
    mentionable: true,
    reason: 'Auto-created Blessed role for Sesepuh Bot',
  });
}

export async function resolveMiskinRole(guild: Guild): Promise<Role> {
  const configured = process.env.MISKIN_ROLE_ID
    ? guild.roles.cache.get(process.env.MISKIN_ROLE_ID)
    : null;
  if (configured) return configured;

  const existing = guild.roles.cache.find((role) => role.name.toLowerCase() === 'miskin');
  if (existing) return existing;

  return guild.roles.create({
    name: 'miskin',
    color: 0x7f8c8d,
    mentionable: true,
    reason: 'Auto-created miskin role for Sesepuh Bot',
  });
}

export async function setTemporaryNickname(
  member: GuildMember,
  prefix: string
): Promise<void> {
  if (!member.manageable) return;
  const baseName = member.displayName.replace(/^(✨ Blessed |Cupu )/i, '').trim();
  const nextName = `${prefix}${baseName}`.slice(0, 32);
  if (member.displayName === nextName) return;
  await member.setNickname(nextName).catch(() => {});
}

export async function clearTemporaryNickname(member: GuildMember): Promise<void> {
  if (!member.manageable) return;
  const cleaned = member.displayName.replace(/^(✨ Blessed |Cupu )/i, '').trim();
  if (cleaned === member.displayName) return;
  await member.setNickname(cleaned.slice(0, 32) || null).catch(() => {});
}

export function blessedSpeech(member: GuildMember): string {
  return `✨ Blessed ${member.displayName.replace(/^✨ Blessed /, '')} telah berbicara, dengarkan!`;
}

export function getCommandCooldownRemaining(
  guildId: string,
  commandName: string,
  cooldownMs: number
): number {
  const record = cooldownQueries.get.get(guildId, commandName) as
    | { last_used_at: number }
    | undefined;
  if (!record) return 0;
  const elapsed = Date.now() - record.last_used_at;
  return elapsed >= cooldownMs ? 0 : cooldownMs - elapsed;
}

export function setCommandCooldown(
  guildId: string,
  commandName: string,
  userId: string
): void {
  cooldownQueries.upsert.run({
    guild_id: guildId,
    command_name: commandName,
    last_used_at: Date.now(),
    last_used_by: userId,
  });
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
