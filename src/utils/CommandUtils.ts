import { Permissions, Formatters, MessageButton } from "discord.js";
import type { CommandInteraction, Snowflake } from "discord.js";
import type { Command, MyContext } from "../interfaces";

export const deleteButton = (initiatorId: Snowflake) =>
    new MessageButton()
        .setCustomId("deletebtn/" + initiatorId)
        .setEmoji("🗑")
        .setStyle("SECONDARY");

/**
 * Checks if the bot or a user has the needed permissions to run a command
 * @param interaction
 * @param command
 * @returns Whether to cancel the command
 */
// * Note that as of writing, slash commands can override permissions
export function commandPermissionCheck(interaction: CommandInteraction, command: Command): boolean {
    const { client, user, channel } = interaction;
    // If the channel is a dm
    // if it's a partial, channel.type wouldn't exist
    if (channel.type === "DM" || !channel) {
        if (command.guildOnly) {
            interaction.editReply("This is a guild exclusive command, not to be executed in a dm").catch(console.error);
            // For guild only commands that were executed in a dm, cancel the command
            return true;
        }
        // If it's not a guild only command, since permissions aren't a thing on dms, allow execution
        return false;
    }
    if (command.botPermissions) {
        const botPermissions = new Permissions(command.botPermissions);
        // The required permissions for the bot to run the command, missing in the channel.
        const missingPermissions = channel.permissionsFor(client.user).missing(botPermissions);
        if (missingPermissions.length > 0) {
            interaction
                .editReply(
                    `In order to run this command, I need the following permissions: ${missingPermissions
                        .map((perm) => `\`${perm}\``)
                        .join(", ")}`,
                )
                .catch(console.error);
            return true;
        }
    }
    if (command.authorPermissions) {
        const authorPermissions = new Permissions(command.authorPermissions);
        // The required permissions for the user to run the command, missing in the channel.
        const missingPermissions = channel.permissionsFor(user.id).missing(authorPermissions);
        if (missingPermissions.length > 0) {
            interaction
                .editReply(
                    `In order to run this command, you need: ${missingPermissions
                        .map((perm) => `\`${perm}\``)
                        .join(", ")}`,
                )
                .catch(console.error);
            return true;
        }
    }
    // By default, allow execution;
    return false;
}
export function commandCooldownCheck(interaction: CommandInteraction, command: Command, context: MyContext): boolean {
    const { user } = interaction;
    if (command.cooldown) {
        const id = user.id + "/" + interaction.commandName;
        const existingCooldown = context.cooldownCounter.get(id);
        if (existingCooldown) {
            if (Date.now() >= existingCooldown) {
                context.cooldownCounter.delete(id);
                return false;
            }
            interaction
                .editReply(
                    //TODO revert to using custom logic to send remaining time as the discord timestamp formatting isn't very descriptive
                    `Please wait ${Formatters.time(existingCooldown, "R")} before using the command again`,
                )
                .catch(console.error);
            return true;
        }
        context.cooldownCounter.set(user.id + "/" + interaction.commandName, Date.now() + command.cooldown);
    }
    return false;
}
