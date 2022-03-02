import { SlashCommandBuilder } from "@discordjs/builders";
import { deleteButton } from "../../utils/CommandUtils";
import { MessageActionRow, MessageEmbed, MessageSelectMenu } from "discord.js";
import { gunzipSync } from "zlib";
import { XMLParser } from "fast-xml-parser";
import { Command, MdnDoc } from "../../interfaces";
import fetch from "node-fetch";
import flexsearch from "flexsearch";

interface SitemapEntry<T extends string | number> {
    loc: string;
    lastmod: T;
}
type Sitemap<T extends string | number> = SitemapEntry<T>[];

let sources = {
    index: null as flexsearch.Index,
    sitemap: null as Sitemap<number>,
    lastUpdated: null as number,
};

const MDN_BASE_URL = "https://developer.mozilla.org/en-US/docs/" as const;
const MDN_ICON_URL = "https://i.imgur.com/qwmSZxR.png" as const;
const MDN_COLOR = 0xffffff as const;

const command: Command = {
    slashCommand: {
        data: new SlashCommandBuilder()
            .setName("mdn")
            .setDescription("Searches MDN documentation.")
            .addStringOption((opt) =>
                opt
                    .setName("query")
                    .setDescription("Enter the phrase you'd like to search for. Example: Array.filter")
                    .setRequired(true)
                    .setAutocomplete(true),
            ),
        async run(interaction) {
            const deleteButtonRow = new MessageActionRow().addComponents([deleteButton(interaction.user.id)]);
            const query = interaction.options.getString("query");
            const { index, sitemap } = await getSources();
            // Get the top 25 results
            const search: string[] = index.search(query, { limit: 25 }).map((id) => sitemap[<number>id].loc);

            if (!search.length) {
                const noResultsEmbed = new MessageEmbed()
                    .setColor(0xff0000)
                    .setAuthor({ name: "MDN Documentation", iconURL: MDN_ICON_URL })
                    .setTitle(`Search for: ${query.slice(0, 243)}`)
                    .setDescription("No results found...");
                await interaction.editReply({ embeds: [noResultsEmbed] }).catch(console.error);
                return;
            } else if (search.length === 1 || search.includes(query)) {
                // If there's an exact match
                const resultEmbed = await getSingleMDNSearchResults(search.includes(query) ? query : search[0]);
                if (!resultEmbed) {
                    await interaction.editReply({ content: "Couldn't find any results" }).catch(console.error);
                    return;
                }
                await interaction
                    .editReply("Sent documentation for " + (query.length >= 100 ? query.slice(0, 100) + "..." : query))
                    .catch(console.error);
                await interaction
                    .followUp({
                        embeds: [resultEmbed],
                        components: [deleteButtonRow],
                    })
                    .catch(console.error);

                return;
            } else {
                // If there are multiple results, send a select menu from which the user can choose which one to send
                const selectMenuRow = new MessageActionRow().addComponents(
                    new MessageSelectMenu()
                        .setCustomId("mdnselect/" + interaction.user.id)
                        .addOptions(
                            search.map((val) => {
                                const parsed = val.length >= 99 ? val.split("/").slice(-2).join("/") : val;
                                return { label: parsed, value: parsed };
                            }),
                        )
                        .setPlaceholder("Select documentation to send"),
                );
                await interaction
                    .editReply({
                        content: "Didn't find an exact match, please select one from below",
                        components: [selectMenuRow],
                    })
                    .catch(console.error);
                return;
            }
        },
    },
    selectMenus: [
        {
            custom_id: "mdnselect",
            async run(interaction) {
                const Initiator = interaction.customId.split("/")[1];
                const deleteButtonRow = new MessageActionRow().addComponents([deleteButton(Initiator)]);
                const selectedValue = interaction.values[0];
                const resultEmbed = await getSingleMDNSearchResults(selectedValue);

                // Remove the menu and update the ephemeral message
                await interaction
                    .editReply({ content: "Sent documentations for " + selectedValue, components: [] })
                    .catch(console.error);
                // Send documentation
                await interaction
                    .followUp({ embeds: [resultEmbed], components: [deleteButtonRow] })
                    .catch(console.error);
            },
        },
    ],
    autocomplete: [
        {
            focusedOption: "query",
            async run(interaction, focusedOption) {
                const query = focusedOption.value as string;
                const { index, sitemap } = await getSources();
                // The limit for autocomplete options is 25
                const search = index.search(query, { limit: 25 }).map((id) => {
                    const val = sitemap[<number>id].loc;
                    // Values and names have a limit of 100 characters
                    const parsed = val.length >= 99 ? val.split("/").slice(-2).join("/") : val;
                    return { name: parsed, value: parsed };
                });
                await interaction.respond(search).catch(console.error);
            },
        },
    ],
};

// Export to reuse on the select menu handler
export async function getSingleMDNSearchResults(searchQuery: string) {
    // Search for the match once again
    const { index, sitemap } = await getSources();
    // Search one more time
    const secondSearch = index.search(searchQuery, { limit: 25 }).map((id) => sitemap[<number>id].loc);
    // Since it returns an array, the exact match might not be the first selection, if the exact match exists, fetch using that, if not get the first result
    const finalSelection = secondSearch.includes(searchQuery) ? searchQuery : secondSearch[0];
    const res = await fetch(`${MDN_BASE_URL + finalSelection}/index.json`).catch(console.error);
    if (!res || !res?.ok) return null;
    const resJSON = await res.json?.().catch(console.error);
    if (!res.json) return null;

    const doc: MdnDoc = resJSON.doc;

    return new MessageEmbed()
        .setColor(MDN_COLOR)
        .setAuthor({ name: "MDN Documentation", iconURL: MDN_ICON_URL })
        .setTitle(doc.pageTitle)
        .setURL(`https://developer.mozilla.org/${doc.mdn_url}`)
        .setDescription(doc.summary);
}
export async function getSources(): Promise<typeof sources> {
    if (sources.lastUpdated && Date.now() - sources.lastUpdated < 43200000 /* 12 hours */) return sources;

    const res = await fetch("https://developer.mozilla.org/sitemaps/en-us/sitemap.xml.gz");
    if (!res.ok) return sources; // Fallback to old sources if the new ones are not available for any reason
    const parsedSitemap = new XMLParser().parse(gunzipSync(await res.buffer()).toString());
    const sitemap: Sitemap<number> = parsedSitemap.urlset.url.map((entry: SitemapEntry<string>) => ({
        loc: entry.loc.slice(MDN_BASE_URL.length),
        lastmod: new Date(entry.lastmod).valueOf(),
    }));
    const index = new flexsearch.Index();
    sitemap.forEach((entry, idx) => index.add(idx, entry.loc));

    sources = { index, sitemap, lastUpdated: Date.now() };
    return sources;
}

export default command;
