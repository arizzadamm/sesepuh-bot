import { Collection } from 'discord.js';
import { SesepuhCommand } from '../utils/types';
import { blessCommand } from './bless';
import { curseCommand } from './curse';
import { summonCommand } from './summon';
import { roastCommand, praiseCommand } from './roast';
import { spinCommand, teamCommand } from './fun';
import { balanceCommand, jadwalCommand, votemapCommand } from './mabar';
import { misiCommand, sesepuhCommand } from './circle';
import { soundboardCommand } from './soundboard';
import { tutorialCommand } from './tutorial';
import { statusroleCommand } from './statusrole';
import { loreCommand, rememberCommand } from './memory';

export const commands = new Collection<string, SesepuhCommand>();

const commandList: SesepuhCommand[] = [
  blessCommand,
  curseCommand,
  summonCommand,
  roastCommand,
  praiseCommand,
  spinCommand,
  teamCommand,
  jadwalCommand,
  balanceCommand,
  votemapCommand,
  misiCommand,
  sesepuhCommand,
  soundboardCommand,
  tutorialCommand,
  statusroleCommand,
  rememberCommand,
  loreCommand,
];

for (const command of commandList) {
  commands.set(command.data.name, command);
}

export { commandList };
