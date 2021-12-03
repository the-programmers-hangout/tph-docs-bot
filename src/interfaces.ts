import type {
    Client,
    CommandInteraction,
    Collection,
    PermissionString,
} from "discord.js";
import type {
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from "@discordjs/builders";
type SlashCommandOptionsType = ReturnType<
  SlashCommandBuilder["addChannelOption"]
>;
export interface MyContext {
  client: Client;
  commands: Collection<string, Command>;
  cooldownCounter: Collection<string, number>;
}
export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsType;
  cooldown?: number;
  botPermissions?: PermissionString[];
  authorPermissions?: PermissionString[];
  guildOnly?: boolean;
  execute(interaction: CommandInteraction, context: MyContext): Promise<void>;
}
