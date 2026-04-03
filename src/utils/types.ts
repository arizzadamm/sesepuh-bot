import {
  ChatInputCommandInteraction,
  Client,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandBuilder,
} from 'discord.js';

export interface SesepuhCommand {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
}

export type CommandData = RESTPostAPIChatInputApplicationCommandsJSONBody;
