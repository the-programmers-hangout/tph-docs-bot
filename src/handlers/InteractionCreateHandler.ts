import type { Command, MyContext } from "../interfaces";
import type {
    AutocompleteInteraction,
    ButtonInteraction,
    CommandInteraction,
    Interaction,
    Message,
    SelectMenuInteraction,
} from "discord.js";
import type { APIEmbed } from "discord-api-types";

import { commandCooldownCheck, commandPermissionCheck, deleteButton } from "../utils/CommandUtils";
import { getSingleMDNSearchResults, getSources } from "../commands/docs/mdn";
import { searchDJSDoc } from "../commands/docs/djs";
import { MessageActionRow } from "discord.js";

import glob from "glob";
import Doc from "discord.js-docs";

export async function interactionCreateHandler(context: MyContext, interaction: Interaction<"cached">) {
    try {
        if (interaction.isCommand()) {
            await commandInteractionHandler(context, interaction);
        } else if (interaction.isButton()) {
            await buttonInteractionHandler(context, interaction);
        } else if (interaction.isSelectMenu()) {
            await selectMenuInteractionHandler(context, interaction);
        } else if (interaction.isAutocomplete()) {
            await autocompleteInteractionHandler(context, interaction);
        }
    } catch (e) {
        console.error(e);
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
    await interaction.deferReply({ ephemeral: true }).catch(console.error);

    const command = context.commands.get(interaction.commandName);
    if (!command) return interaction.editReply({ content: "Command not found" }).catch(console.error);

    if (commandPermissionCheck(interaction, command)) return;
    if (commandCooldownCheck(interaction, command, context)) return;
    try {
        await command.execute(interaction, context);
    } catch (e) {
        console.error(e);
        const errorMessage = "An error has occurred";
        await interaction[interaction.replied ? "editReply" : "reply"]?.({
            content: errorMessage,
        }).catch(console.error);
    }
}
async function selectMenuInteractionHandler(context: MyContext, interaction: SelectMenuInteraction) {
    await interaction.deferUpdate().catch(console.error);
    const CommandName = interaction.customId.split("/")[0];
    switch (CommandName) {
        case "mdnselect": {
            const Initiator = interaction.customId.split("/")[1];
            const deleteButtonRow = new MessageActionRow().addComponents([deleteButton(Initiator)]);
            const selectedValue = interaction.values[0];
            const resultEmbed = await getSingleMDNSearchResults(selectedValue);

            // Remove the menu and update the ephemeral message
            await interaction
                .editReply({ content: "Sent documentations for " + selectedValue, components: [] })
                .catch(console.error);
            // Send documentation
            await interaction.followUp({ embeds: [resultEmbed], components: [deleteButtonRow] }).catch(console.error);
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
                .editReply({ content: "Sent documentations for " + selectedValue, components: [] })
                .catch(console.error);
            // Send documentation
            await interaction.followUp({ embeds: [resultEmbed], components: [deleteButtonRow] }).catch(console.error);
            break;
        }
        default: {
            interaction.editReply({ content: "Unknown menu" }).catch(console.error);
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

async function autocompleteInteractionHandler(context: MyContext, interaction: AutocompleteInteraction) {
    switch (interaction.commandName) {
        case "djs": {
            // Check the cache, the command will force fetch anyway
            const doc = await Doc.fetch("stable", { force: false });
            const query = interaction.options.getFocused() as string;
            const singleElement = doc.get(...query.split(/\.|#/));
            if (singleElement) {
                await interaction
                    .respond([{ name: singleElement.formattedName, value: singleElement.formattedName }])
                    .catch(console.error);
                return;
            }
            const searchResults = doc.search(query, { excludePrivateElements: false });
            if (!searchResults) {
                await interaction.respond([]).catch(console.error);
                return;
            }
            await interaction
                .respond(searchResults.map((elem) => ({ name: elem.formattedName, value: elem.formattedName })))
                .catch(console.error);
            break;
        }
        case "mdn": {
            const query = interaction.options.getFocused() as string;

            const { index, sitemap } = await getSources();
            const search = index.search(query, { limit: 10 }).map((id) => {
                const val = sitemap[<number>id].loc;
                const parsed = val.length >= 99 ? val.split("/").slice(-2).join("/") : val;
                return { name: parsed, value: parsed };
            });
            await interaction.respond(search).catch(console.error);
        }
    }
}
