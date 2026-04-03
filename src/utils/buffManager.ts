import { Client, Guild } from 'discord.js';
import { buffQueries, penaltyQueries } from './database';
import { clearTemporaryNickname } from './helpers';

interface ActiveBuff {
  id: number;
  guild_id: string;
  user_id: string;
  role_id: string;
  expires_at: number;
  created_by: string;
}

interface ActivePenalty extends ActiveBuff {
  reason?: string;
}

/**
 * Cek dan hapus buff yang sudah expired.
 * Dipanggil setiap 30 detik oleh scheduler.
 */
async function checkExpiredBuffs(client: Client): Promise<void> {
  const expired = buffQueries.getExpired.all() as ActiveBuff[];

  for (const buff of expired) {
    try {
      const guild: Guild | undefined = client.guilds.cache.get(buff.guild_id);
      if (!guild) {
        buffQueries.deleteById.run(buff.id);
        continue;
      }

      const member = await guild.members.fetch(buff.user_id).catch(() => null);
      if (member) {
        await member.roles.remove(buff.role_id).catch(() => {});
        await clearTemporaryNickname(member);
        console.log(
          `[BuffManager] Removed expired buff role ${buff.role_id} from ${buff.user_id}`
        );
      }

      buffQueries.deleteById.run(buff.id);
    } catch (err) {
      console.error(`[BuffManager] Error removing buff ${buff.id}:`, err);
      buffQueries.deleteById.run(buff.id);
    }
  }
}

async function checkExpiredPenalties(client: Client): Promise<void> {
  const expired = penaltyQueries.getExpired.all() as ActivePenalty[];

  for (const penalty of expired) {
    try {
      const guild: Guild | undefined = client.guilds.cache.get(penalty.guild_id);
      if (!guild) {
        penaltyQueries.deleteById.run(penalty.id);
        continue;
      }

      const member = await guild.members.fetch(penalty.user_id).catch(() => null);
      if (member) {
        await member.roles.remove(penalty.role_id).catch(() => {});
        await clearTemporaryNickname(member);
        console.log(
          `[BuffManager] Removed expired penalty role ${penalty.role_id} from ${penalty.user_id}`
        );
      }

      penaltyQueries.deleteById.run(penalty.id);
    } catch (err) {
      console.error(`[BuffManager] Error removing penalty ${penalty.id}:`, err);
      penaltyQueries.deleteById.run(penalty.id);
    }
  }
}

/**
 * Start scheduler — jalankan ini sekali saat bot ready.
 */
export function startBuffScheduler(client: Client): void {
  console.log('[BuffManager] Buff expiry scheduler started (interval: 30s)');

  // Langsung cek saat start (untuk buff yang expired saat bot offline)
  checkExpiredBuffs(client);
  checkExpiredPenalties(client);

  setInterval(() => {
    checkExpiredBuffs(client);
    checkExpiredPenalties(client);
  }, 30_000); // setiap 30 detik
}
