import { Command } from "../../interfaces";
import { SlashCommandBuilder } from "@discordjs/builders";
import Doc, { sources } from "discord.js-docs";
import { checkEmbedLimits } from "../../utils/EmbedUtils";

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
        const query = interaction.options.getString("query");
        // The Default source should be stable
        const source: keyof typeof sources =
            (interaction.options.getString("source") as keyof typeof sources) || "stable";
        // Whether to include private elements on the search results, by default false, shows private elements if the search returns an exact result;
        const searchPrivate = interaction.options.getBoolean("private") || false;
        const doc = await Doc.fetch(source, { force: true });

        const resultEmbed = doc.resolveEmbed(query, { excludePrivateElements: !searchPrivate });

        const notFoundEmbed = doc.baseEmbed();
        notFoundEmbed.description = "Didn't find any results for that query";
        // If a result wasn't found
        if (!resultEmbed || resultEmbed.description === "") {
            const timeStampDate = new Date(notFoundEmbed.timestamp);
            // Satisfies the method's MessageEmbedOption type
            const embedObj = { ...notFoundEmbed, timestamp: timeStampDate };

            interaction.editReply({ embeds: [embedObj] }).catch(console.error);
            return;
        }

        const timeStampDate = new Date(resultEmbed.timestamp);
        const embedObj = { ...resultEmbed, timestamp: timeStampDate };

        //! "checkEmbedLimits" does not support MessageEmbed objects due to the properties being null by default, use a raw embed object for this method
        // Check if the embed exceeds any of the limits
        if (!checkEmbedLimits([resultEmbed])) {
            // The final field should be the View Source button
            embedObj.fields = [embedObj.fields?.at(-1)];
        }
        interaction.editReply({ embeds: [embedObj] }).catch(console.error);
        return;
    },
};

function capitalize(str: string) {
    return str
        .split("-")
        .map((splitStr) => splitStr[0].toUpperCase() + splitStr.substring(1))
        .join("-");
}

export default command;
