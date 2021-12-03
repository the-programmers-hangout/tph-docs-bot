import { Command } from "../../interfaces";
import { SlashCommandBuilder } from "@discordjs/builders";
import Doc, { sources } from "discord.js-docs";
import { checkEmbedLimits } from "../../utils/embedUtils";

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
                .setDescription("Select which branch/repository to get documentation off of")
                .addChoices(supportedBranches)
                .setRequired(false),
        ),
    async execute(interaction, context) {
        const query = interaction.options.getString("query");
        // The Default source should be stable
        const source: keyof typeof sources =
            (interaction.options.getString("source") as keyof typeof sources) || "stable";

        const doc = await Doc.fetch(source, { force: true });

        const notFoundEmbed = doc.baseEmbed();
        notFoundEmbed.description = "Didn't find any results for that query";

        const resultEmbed = doc.resolveEmbed(query);

        if (!resultEmbed) {
            const timeStampDate = new Date(notFoundEmbed.timestamp);
            const embedObj = { ...notFoundEmbed, timestamp: timeStampDate };
            return interaction.reply({ embeds: [embedObj] }).catch(console.error);
        }

        const timeStampDate = new Date(resultEmbed.timestamp);
        let embedObj = {...resultEmbed, timestamp: timeStampDate};
        if(!checkEmbedLimits([resultEmbed])) {
            // The final fields should be the View Source button
            embedObj.fields = [embedObj.fields?.at(-1)]
        }
        interaction.reply({ embeds: [embedObj] }).catch(console.error);
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
