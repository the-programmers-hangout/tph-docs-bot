import type { Command, MyContext } from "../interfaces";
import type { ButtonInteraction, CommandInteraction, Interaction, Message, SelectMenuInteraction } from "discord.js";
import type { APIEmbed } from "discord-api-types";

import { commandCooldownCheck, commandPermissionCheck, deleteButton } from "../utils/CommandUtils";
import { getSingleMDNSearchResults } from "../commands/docs/mdn";
import { searchDJSDoc } from "../commands/docs/djs";
import { MessageActionRow } from "discord.js";

import glob from "glob";
import Doc from "discord.js-docs";

export async function interactionCreateHandler(context: MyContext, interaction: Interaction<"cached">) {
    if (interaction.isCommand()) {
        commandInteractionHandler(context, interaction);
    } else if (interaction.isButton()) {
        buttonInteractionHandler(context, interaction);
    } else if (interaction.isSelectMenu()) {
        selectMenuInteractionHandler(context, interaction);
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
                    const { default: myCommandFile }: { default: Command } = await import(file).catch((err) => {
                        console.error(err);
                        // Since the return value gets destructured, an empty object is returned
                        return {};
                    });
                    if (!myCommandFile) return;
                    context.commands.set(myCommandFile.data.name, myCommandFile);
                }),
            );
            resolve(undefined);
        });
    });
}
async function commandInteractionHandler(context: MyContext, interaction: CommandInteraction) {
    const command = context.commands.get(interaction.commandName);
    if (!command) return interaction.reply({ content: "Command not found", ephemeral: true });

    if (commandPermissionCheck(interaction, command)) return;
    if (commandCooldownCheck(interaction, command, context)) return;
    try {
        await command.execute(interaction, context);
    } catch (e) {
        console.error(e);
        const errorMessage = "An error has occurred";
        interaction
            .reply({
                content: errorMessage,
                ephemeral: true,
            })
            .catch(console.error);
    }
}
async function selectMenuInteractionHandler(context: MyContext, interaction: SelectMenuInteraction) {
    const CommandName = interaction.customId.split("/")[0];
    if (!CommandName)
        switch (CommandName) {
            case "mdnselect": {
                const Initiator = interaction.customId.split("/")[1];
                const deleteButtonRow = new MessageActionRow().addComponents([deleteButton(Initiator)]);
                const selectedValue = interaction.values[0];
                const resultEmbed = await getSingleMDNSearchResults(selectedValue);

                // Remove the menu and update the ephemeral message
                await interaction
                    .update({ content: "Sent documentation for " + selectedValue, components: [] })
                    .catch(console.error);
                // Send documentation
                await interaction
                    .followUp({ embeds: [resultEmbed], components: [deleteButtonRow] })
                    .catch(console.error);
                break;
            }

            case "djsselect": {
                const selectedValue = interaction.values[0];
                const [, source, searchPrivate, Initiator] = interaction.customId.split("/");
                const deleteButtonRow = new MessageActionRow().addComponents([deleteButton(Initiator)]);

                const doc = await Doc.fetch(source, { force: true });

                const resultEmbed = searchDJSDoc(doc, selectedValue, searchPrivate === "true") as APIEmbed;

                // Remove the menu and update the ephemeral message
                await interaction
                    .update({ content: "Sent documentation for " + selectedValue, components: [] })
                    .catch(console.error);
                // Send documentation
                await interaction
                    .followUp({ embeds: [resultEmbed], components: [deleteButtonRow] })
                    .catch(console.error);
                break;
            }
            default: {
                interaction.reply({ content: "Unknown menu", ephemeral: true }).catch(console.error);
            }
        }
}
async function buttonInteractionHandler(context: MyContext, interaction: ButtonInteraction<"cached">) {
    // The delete button
    if (interaction.customId.startsWith("deletebtn")) {
        const commandInitiatorId = interaction.customId.replace("deletebtn/", "");
        // If the button clicker is the command initiator
        if (interaction.user.id === commandInitiatorId) {
            (interaction.message as Message).delete().catch(console.error);
        } else
            interaction
                .reply({
                    content: "Only the command initiator is allowed to delete this message",
                    ephemeral: true,
                })
                .catch(console.error);
    }
}
// TODO add autocomplete
// async function autocompleteInteractionHandler(context: MyContext, interaction: AutocompleteInteraction) {}s
