import { SlashCommandBuilder } from "@discordjs/builders";
import { deleteButton } from "../../utils/CommandUtils";
import { MessageActionRow, MessageEmbed, MessageSelectMenu } from "discord.js";
import { gunzipSync } from "zlib";
import { XMLParser } from "fast-xml-parser";
import { Command } from "../../interfaces";
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
const MDN_ICON_URL = "https://i.imgur.com/1P4wotC.png" as const;
const MDN_BLUE_COLOR = 0x83bfff as const;

const command: Command = {
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
    async execute(interaction) {
        const deleteButtonRow = new MessageActionRow().addComponents([deleteButton(interaction.user.id)]);
        const query = interaction.options.getString("query");
        const { index, sitemap } = await getSources();
        const search: string[] = index.search(query, { limit: 10 }).map((id) => sitemap[<number>id].loc);
        const embed = new MessageEmbed()
            .setColor(MDN_BLUE_COLOR)
            .setAuthor({ name: "MDN Documentation", iconURL: MDN_ICON_URL })
            .setTitle(`Search for: ${query.slice(0, 243)}`);

        if (!search.length) {
            embed.setColor(0xff0000).setDescription("No results found...");
            await interaction.editReply({ embeds: [embed] }).catch(console.error);
            return;
        } else if (search.length === 1) {
            const resultEmbed = await getSingleMDNSearchResults(search[0]);
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
};

// Export to reuse on the select menu handler
export async function getSingleMDNSearchResults(searchQuery: string) {
    // Search for the match once again
    const { index, sitemap } = await getSources();
    const secondSearch = index.search(searchQuery, { limit: 10 }).map((id) => sitemap[<number>id].loc)[0];

    const res = await fetch(`${MDN_BASE_URL + secondSearch}/index.json`).catch(console.error);
    if (!res || !res?.ok) return null;
    const resJSON = await res.json?.().catch(console.error);
    if (!res.json) return null;

    const doc: MdnDoc = resJSON.doc;

    return new MessageEmbed()
        .setColor(MDN_BLUE_COLOR)
        .setAuthor({ name: "MDN Documentation", iconURL: MDN_ICON_URL })
        .setColor(0xffffff)
        .setTitle(doc.pageTitle)
        .setURL(`https://developer.mozilla.org/${doc.mdn_url}`)
        .setThumbnail(MDN_ICON_URL)
        .setDescription(doc.summary);
}
export async function getSources(): Promise<typeof sources> {
    if (sources.lastUpdated && Date.now() - sources.lastUpdated < 43200000 /* 12 hours */) return sources;

    const res = await fetch("https://developer.mozilla.org/sitemaps/en-us/sitemap.xml.gz");
    if (!res.ok) return sources; // Fallback to old sources if the new ones are not available for any reason
    const something = new XMLParser().parse(gunzipSync(await res.buffer()).toString());
    const sitemap: Sitemap<number> = something.urlset.url.map((entry: SitemapEntry<string>) => ({
        loc: entry.loc.slice(MDN_BASE_URL.length),
        lastmod: new Date(entry.lastmod).valueOf(),
    }));
    const index = new flexsearch.Index();
    sitemap.forEach((entry, idx) => index.add(idx, entry.loc));

    sources = { index, sitemap, lastUpdated: Date.now() };
    return sources;
}

interface MdnDoc {
    isMarkdown: boolean;
    isTranslated: boolean;
    isActive: boolean;
    flaws: Record<string, unknown>;
    title: string;
    mdn_url: string;
    locale: string;
    native: string;
    sidebarHTML: string;
    body: {
        type: "prose" | "specifications" | "browser_compatibility";
        value: {
            id: string | null;
            title: string | null;
            isH3: boolean;
            // type:prose
            content?: string;
            // type:specifications
            specifications?: { bcdSpecificationURL: string; title: string; shortTitle: string }[];
            // type:browser_compatibility
            dataURL?: string;
            // type:specifications | type:browser_compatibility
            query?: string;
        };
    }[];
    toc: { text: string; id: string }[];
    summary: string;
    popularity: number;
    modified: string; // ISO Date String
    other_translations: { title: string; locale: string; native: string }[];
    source: {
        folder: string;
        github_url: string;
        last_commit_url: string;
        filename: string;
    };
    parents: { uri: string; title: string }[];
    pageTitle: string;
    noIndexing: boolean;
}

export default command;
