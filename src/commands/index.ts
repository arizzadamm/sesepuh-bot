import { Collection } from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import { blessCommand } from './bless';
import { curseCommand } from './curse';
import { summonCommand } from './summon';
import { roastCommand, praiseCommand } from './roast';
import { spinCommand, teamCommand } from './fun';

export const commands = new Collection<string, SesepuhCommand>();

const commandList: SesepuhCommand[] = [
  blessCommand,
  curseCommand,
  summonCommand,
  roastCommand,
  praiseCommand,
  spinCommand,
  teamCommand,
];

for (const command of commandList) {
  commands.set(command.data.name, command);
}

export { commandList };
