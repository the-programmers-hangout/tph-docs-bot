import { Command } from "../../interfaces";
import { SlashCommandBuilder } from "@discordjs/builders";
import Doc, { sources } from "discord.js-docs";
import { checkEmbedLimits } from "../../utils/EmbedUtils";
import { deleteButton } from "../../utils/CommandUtils";
import { MessageActionRow, MessageSelectMenu } from "discord.js";
import { APIEmbed } from "discord-api-types";

const supportedBranches = Object.keys(sources).map((branch) => [capitalize(branch), branch] as [string, string]);

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("djs")
        .setDescription("Search discord.js documentations, supports builders, voice, collection and rpc documentations")
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("Enter the phrase you'd like to search for, e.g: client#isready")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("source")
                .setDescription("Select which branch/repository to get documentation off of (Default: stable)")
                .addChoices(supportedBranches)
                .setRequired(false),
        )
        .addBooleanOption((option) =>
            option
                .setName("private")
                .setDescription("Whether or not to search private elements (default false)")
                .setRequired(false),
        ),
    async execute(interaction) {
        const deleteButtonRow = new MessageActionRow().addComponents([deleteButton(interaction.user.id)]);
        const query = interaction.options.getString("query");
        // The Default source should be stable
        const source: keyof typeof sources =
            (interaction.options.getString("source") as keyof typeof sources) || "stable";
        // Whether to include private elements on the search results, by default false, shows private elements if the search returns an exact result;
        const searchPrivate = interaction.options.getBoolean("private") || false;
        const doc = await Doc.fetch(source, { force: true });

        // const resultEmbed = doc.resolveEmbed(query, { excludePrivateElements: !searchPrivate });
        const result = searchDJSDoc(doc, query, searchPrivate);
        // If a result wasn't found
        if (!result || (result as APIEmbed).description === "") {
            const notFoundEmbed = doc.baseEmbed();
            notFoundEmbed.description = "Didn't find any results for that query";

            const timeStampDate = new Date(notFoundEmbed.timestamp);
            // Satisfies the method's MessageEmbedOption type
            const embedObj = { ...notFoundEmbed, timestamp: timeStampDate };

            await interaction.reply({ embeds: [embedObj], ephemeral: true }).catch(console.error);
            return;
        } else if (Array.isArray(result)) {
            const selectMenuRow = new MessageActionRow().addComponents(
                new MessageSelectMenu()
                    .setCustomId(`djsselect/${source}/${searchPrivate}/${interaction.user.id}`)
                    .addOptions(result)
                    .setPlaceholder("Select documentation to send"),
            );
            await interaction
                .reply({
                    content: "Didn't find an exact match, please select one from below",
                    ephemeral: true,
                    components: [selectMenuRow],
                })
                .catch(console.error);
            return;
        }
        const resultEmbed = result;
        const timeStampDate = new Date(resultEmbed.timestamp);
        const embedObj = { ...resultEmbed, timestamp: timeStampDate };

        //! "checkEmbedLimits" does not support MessageEmbed objects due to the properties being null by default, use a raw embed object for this method
        // Check if the embed exceeds any of the limits
        if (!checkEmbedLimits([resultEmbed])) {
            // The final field should be the View Source button
            embedObj.fields = [embedObj.fields?.at(-1)];
        }
        await interaction.reply({ embeds: [embedObj], components: [deleteButtonRow] }).catch(console.error);
        return;
    },
};

function capitalize(str: string) {
    return str
        .split("-")
        .map((splitStr) => splitStr[0].toUpperCase() + splitStr.substring(1))
        .join("-");
}

export function searchDJSDoc(doc: Doc, query: string, searchPrivate?: boolean) {
    const options = { excludePrivateElements: !searchPrivate };

    const singleElement = doc.get(...query.split(/\.|#/));
    if (singleElement) return singleElement.embed(options);

    const searchResults = doc.search(query, options);
    if (!searchResults) return null;
    return searchResults.map((res) => {
        const description = res.description.length >= 99 ? res.description.slice(0, 96) + "..." : res.description;
        return {
            label: res.formattedName,
            description,
            emoji: resolveRegionalEmoji(res.embedPrefix),
            value: res.formattedName,
        };
    });
}
function resolveRegionalEmoji(regionalEmoji: string) {
    const character = regionalEmoji.match(/:regional_indicator_(.):/)?.[1];
    if (!character) return null;
    switch (character) {
        case "c":
            return "🇨";
        case "e":
            return "🇪";
        case "i":
            return "🇮";
        case "m":
            return "🇲";
        case "t":
            return "🇹";
        case "p":
            return "🇵";
        default:
            return null;
    }
}

export default command;
