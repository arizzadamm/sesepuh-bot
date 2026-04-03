import { Client, Events, ActivityType } from 'discord.js';
import { startBuffScheduler } from '../utils/buffManager';
import { startScheduleScheduler } from '../utils/scheduleManager';

export function registerReadyEvent(client: Client): void {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`\n✅ Sesepuh Bot Online!`);
    console.log(`👴 Logged in as: ${readyClient.user.tag}`);
    console.log(`🌐 Serving ${readyClient.guilds.cache.size} server(s)\n`);

    readyClient.user.setPresence({
      activities: [
        {
          name: '👴 Mengawasi Circle',
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });

    // Start buff expiry scheduler
    startBuffScheduler(client);
    startScheduleScheduler(client);
  });
}
