import { Client, Events, VoiceState } from 'discord.js';
import { penaltyQueries } from '../utils/database';
import { clearTemporaryNickname } from '../utils/helpers';

export function registerVoiceStateEvent(client: Client): void {
  client.on(Events.VoiceStateUpdate, async (_oldState: VoiceState, newState: VoiceState) => {
    const miskinRoleId = process.env.MISKIN_ROLE_ID;
    if (!miskinRoleId) return;

    const member = newState.member;
    if (!member) return;

    // Begitu user join ke VC mana pun, langsung ampuni.
    if (!newState.channelId) return;
    if (!member.roles.cache.has(miskinRoleId)) return;

    try {
      await member.roles.remove(miskinRoleId);
      await clearTemporaryNickname(member);
      penaltyQueries.deleteActiveForRole.run(newState.guild.id, member.id, miskinRoleId);
      console.log(
        `[VoiceState] Removed miskin role from ${member.id} after joining VC ${newState.channelId}`
      );
    } catch (error) {
      console.error(`[VoiceState] Failed to remove miskin role from ${member.id}:`, error);
    }
  });
}
