import { Client, GuildMember } from 'discord.js';
import { scheduleQueries } from './database';
import { sesepuhEmbed } from './helpers';

const DAILY_MISSIONS = [
  'Main 2 match bareng member circle',
  'Masuk VC minimal 30 menit',
  'Ajak 1 member lama untuk gabung mabar',
  'Kirim screenshot hasil match terbaik hari ini',
  'Puji 1 teman circle yang lagi carry',
  'Share 1 tips gameplay atau build favoritmu',
  'Menang 1 game tanpa toxic di chat',
  'Join lobby dalam waktu kurang dari 10 menit saat dipanggil',
  'Bantu jadi shotcaller di satu match',
  'Bikin suasana circle lebih hidup dengan 1 topik seru',
  'Upload clip lucu atau epic dari game hari ini',
  'Temani teman yang lagi solo queue minimal 1 match',
];

function seededNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getMissionDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getPreviousMissionDay(date = new Date()): string {
  const previous = new Date(date);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return getMissionDay(previous);
}

export function getDailyMissions(guildId: string, date = new Date()): string[] {
  const missionDay = getMissionDay(date);
  const seed = seededNumber(`${guildId}:${missionDay}`);
  const pool = [...DAILY_MISSIONS];
  const selected: string[] = [];

  while (selected.length < 3 && pool.length > 0) {
    const index = (seed + selected.length * 7) % pool.length;
    selected.push(pool.splice(index, 1)[0]);
  }

  return selected;
}

export function parseScheduleInput(input: string): Date | null {
  const match = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0
  );

  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function buildTeamBalanceScore(
  member: GuildMember,
  stats?: { bless_given?: number; curse_given?: number; roast_given?: number } | undefined,
  streak?: { reward_points?: number; good_streak?: number } | undefined
): number {
  const bless = stats?.bless_given ?? 0;
  const curse = stats?.curse_given ?? 0;
  const roast = stats?.roast_given ?? 0;
  const rewardPoints = streak?.reward_points ?? 0;
  const goodStreak = streak?.good_streak ?? 0;
  const presenceBoost = member.voice.channel ? 2 : 0;

  return bless * 3 + curse * 2 + roast + rewardPoints * 0.5 + goodStreak * 1.5 + presenceBoost;
}

export async function sendScheduleReminders(client: Client): Promise<void> {
  const now = Date.now();
  scheduleQueries.cancelExpired.run(now - 2 * 60 * 60 * 1000);
  const candidates = scheduleQueries.getReminderCandidates.all(now) as Array<{
    id: number;
    channel_id: string;
    title: string;
    game: string;
    scheduled_for: number;
    remind_before: number;
  }>;

  for (const schedule of candidates) {
    try {
      const channel = await client.channels.fetch(schedule.channel_id);
      if (channel && channel.isTextBased() && 'send' in channel) {
        await channel.send({
          embeds: [
            sesepuhEmbed(
              '⏰ Pengingat Jadwal Mabar',
              `**${schedule.title}** untuk **${schedule.game}** akan mulai <t:${Math.floor(
                schedule.scheduled_for / 1000
              )}:R>.\n\n` +
                `Waktu kumpul, wahai circle. Jangan bikin Sesepuh menunggu. 👴`,
              '#3498db'
            ),
          ],
        });
      }
    } catch {
      // Skip missing/inaccessible channel.
    } finally {
      scheduleQueries.markReminded.run(schedule.id);
    }
  }
}
