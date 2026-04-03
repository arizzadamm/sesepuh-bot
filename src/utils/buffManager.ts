import { Client, Guild } from 'discord.js';
import { buffQueries } from './database';

interface ActiveBuff {
  id: number;
  guild_id: string;
  user_id: string;
  role_id: string;
  expires_at: number;
  created_by: string;
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

/**
 * Start scheduler — jalankan ini sekali saat bot ready.
 */
export function startBuffScheduler(client: Client): void {
  console.log('[BuffManager] Buff expiry scheduler started (interval: 30s)');

  // Langsung cek saat start (untuk buff yang expired saat bot offline)
  checkExpiredBuffs(client);

  setInterval(() => {
    checkExpiredBuffs(client);
  }, 30_000); // setiap 30 detik
}
