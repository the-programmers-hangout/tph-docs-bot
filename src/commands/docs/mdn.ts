import { SlashCommandBuilder } from "@discordjs/builders";
import { deleteButton } from "../../utils/CommandUtils";
import { MessageActionRow, MessageEmbed } from "discord.js";
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
                .setRequired(true),
        ),
    async execute(interaction) {
        const deleteButtonRow = new MessageActionRow().addComponents([deleteButton]);
        const query = interaction.options.getString("query");
        const { index, sitemap } = await getSources();
        const search: string[] = index.search(query, { limit: 10 }).map((id) => sitemap[<number>id].loc);
        const embed = new MessageEmbed()
            .setColor(MDN_BLUE_COLOR)
            .setAuthor({ name: "MDN Documentation", iconURL: MDN_ICON_URL })
            .setTitle(`Search for: ${query}`);

        if (!search.length) {
            embed.setColor(0xff0000).setDescription("No results found...");
            interaction.editReply({ embeds: [embed], components: [deleteButtonRow] });
            return;
        }

        if (search.length === 1) {
            const res = await fetch(`${MDN_BASE_URL + search[0]}/index.json`);
            const doc: MdnDoc = (await res.json()).doc;
            const docEmbed = embed
                .setColor(0xffffff)
                .setTitle(doc.pageTitle)
                .setURL(`https://developer.mozilla.org/${doc.mdn_url}`)
                .setThumbnail(this.MDN_ICON_URL)
                .setDescription(doc.summary);
            interaction.editReply({ embeds: [docEmbed], components: [deleteButtonRow] });
            return;
        }

        const results = search.map((path) => `**• [${path.replace(/_|-/g, " ")}](${MDN_BASE_URL}${path})**`);
        embed.setDescription(results.join("\n"));
        interaction.editReply({ embeds: [embed], components: [deleteButtonRow] });
        return;
    },
};

async function getSources(): Promise<typeof sources> {
    if (sources.lastUpdated && Date.now() - sources.lastUpdated < 43200000 /* 12 hours */) return sources;

    const res = await fetch("https://developer.mozilla.org/sitemaps/en-us/sitemap.xml.gz");
    if (!res.ok) return sources; // Fallback to old sources if the new ones are not available for any reason

    const sitemap: Sitemap<number> = new XMLParser()
        .parse(gunzipSync(await res.buffer()).toString())
        .urlset.url.map((entry: SitemapEntry<string>) => ({
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
