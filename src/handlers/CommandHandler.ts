import glob from "glob";
import type { Command, MyContext } from "../interfaces";
import type { CommandInteraction, Interaction } from "discord.js";
import { Permissions, Formatters } from "discord.js";

export async function commandHandler(
    context: MyContext,
    interaction: Interaction
) {
    if (interaction.isCommand()) {
        await interaction.deferReply();
        const command = context.commands.get(interaction.commandName);
        if (!command) return interaction.editReply("Command not found");

        if (commandPermissionCheck(interaction, command)) return;
        if (commandCooldownCheck(interaction, command, context)) return;
        try {
            await command.execute(interaction, context);
        } catch (e) {
            console.error(e);
            const errorMessage = "An error has occurred";
            interaction.editReply(errorMessage).catch(console.error);
        }
    }
}
/**
 * Locally loads the commands to the context for further use
 * @param context
 * @returns
 */
export function loadCommands(context: MyContext) {
    // Promisifies the process of glob
    return new Promise((resolve) => {
    // Find all js files
        glob(`${__dirname}/../commands/**/*.js`, async (err, files) => {
            await Promise.all(
                files.map(async (file) => {
                    const { default: myCommandFile }: { default: Command } = await import(
                        file
                    ).catch((err) => {
                        console.error(err);
                        // Since the return value gets destructured, an empty object is returned
                        return {};
                    });
                    if (!myCommandFile) return;
                    context.commands.set(myCommandFile.data.name, myCommandFile);
                })
            );
            resolve(undefined);
        });
    });
}
/**
 * Checks if the bot or a user has the needed permissions to run a command
 * @param interaction
 * @param command
 * @returns Whether to cancel the command
 */
function commandPermissionCheck(
    interaction: CommandInteraction,
    command: Command
): boolean {
    const { client, user, channel } = interaction;
    // If the channel is a dm, if it's a partial, channel.type wouldn't exist
    if (channel.type === "DM" || !channel) {
        if (command.guildOnly) {
            interaction
                .editReply(
                    "This is a guild exclusive command, not to be executed in a dm"
                )
                .catch(console.error);
            // For guild only commands that were executed in a dm, cancel the command
            return true;
        }
        // If it's not a guild only command, since permissions aren't a thing on dms, allow execution
        return false;
    }
    if (command.botPermissions) {
        const botPermissions = new Permissions(command.botPermissions);
        // The required permissions for the bot to run the command, missing in the channel.
        const missingPermissions = channel
            .permissionsFor(client.user)
            .missing(botPermissions);
        if (missingPermissions.length > 0) {
            interaction
                .editReply(
                    `In order to run this command, I need the following permissions: ${missingPermissions
                        .map((perm) => `\`${perm}\``)
                        .join(", ")}`
                )
                .catch(console.error);
            return true;
        }
    }
    if (command.authorPermissions) {
        const authorPermissions = new Permissions(command.authorPermissions);
        // The required permissions for the user to run the command, missing in the channel.
        const missingPermissions = channel
            .permissionsFor(user.id)
            .missing(authorPermissions);
        if (missingPermissions.length > 0) {
            interaction
                .editReply(
                    `In order to run this command, you need: ${missingPermissions
                        .map((perm) => `\`${perm}\``)
                        .join(", ")}`
                )
                .catch(console.error);
            return true;
        }
    }
    // By default, allow execution;
    return false;
}
function commandCooldownCheck(
    interaction: CommandInteraction,
    command: Command,
    context: MyContext
): boolean {
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
                    `Please wait ${Formatters.time(
                        Date.now() + existingCooldown,
                        "R"
                    )} before using the command again`
                )
                .catch(console.error);
            return true;
        }
        context.cooldownCounter.set(
            user.id + "/" + interaction.commandName,
            Date.now() + command.cooldown
        );
    }
    return false;
}
