import { Client } from 'discord.js';
import { sendScheduleReminders } from './featureHelpers';

export function startScheduleScheduler(client: Client): void {
  console.log('[ScheduleManager] Schedule reminder scheduler started (interval: 60s)');

  sendScheduleReminders(client).catch((error) => {
    console.error('[ScheduleManager] Initial reminder check failed:', error);
  });

  setInterval(() => {
    sendScheduleReminders(client).catch((error) => {
      console.error('[ScheduleManager] Reminder check failed:', error);
    });
  }, 60_000);
}
