import { Command } from "discord-akairo";
import { Message } from "discord.js";
import { gunzipSync } from "zlib";
import { XMLParser } from "fast-xml-parser";
import BotClient from "../../client/client";
import fetch from "node-fetch";
import flexsearch from "flexsearch";

interface SitemapEntry<T extends string | number> {
  loc: string;
  lastmod: T;
}
type Sitemap<T extends string | number> = SitemapEntry<T>[];

const baseURL = "https://developer.mozilla.org/en-US/docs/" as const;
let sources = {
  index: null as flexsearch.Index,
  sitemap: null as Sitemap<number>,
  lastUpdated: null as number,
};

async function getSources(): Promise<typeof sources> {
  if (sources.lastUpdated && Date.now() - sources.lastUpdated < 43200000 /* 12 hours */) return sources;

  const res = await fetch("https://developer.mozilla.org/sitemaps/en-us/sitemap.xml.gz");
  if (!res.ok) return sources; // Fallback to old sources if the new ones are not available for any reason

  const sitemap: Sitemap<number> = new XMLParser()
    .parse(gunzipSync(await res.buffer()).toString()).urlset.url
    .map((entry: SitemapEntry<string>) => ({
      loc: entry.loc.slice(baseURL.length),
      lastmod: new Date(entry.lastmod).valueOf()
    }));

  const index = new flexsearch.Index();
  sitemap.forEach((entry, idx) => index.add(idx, entry.loc));

  sources = { index, sitemap, lastUpdated: Date.now() };
  return sources;
}

export default class MdnCommand extends Command {
  public client: BotClient;
  private MDN_BLUE_COLOR = 0x83BFFF as const;
  private MDN_ICON_URL = "https://i.imgur.com/1P4wotC.png" as const;

  public constructor() {
    super("mdn-docs", {
      aliases: ["mdn", "mdndocs"],
      description: {
        content: "Searches MDN documentation.",
        usage: "<query>",
        examples: ['TODO']
      },
      channel: "guild",
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 2,
      args: [
        {
          id: "query",
          match: "rest",
          type: "string",
          prompt: {
            start: "```\n" + "Enter the phrase you'd like to search for.\n" + "Example: Array.filter" + "```",
            retry: "Not a valid search phrase.",
          },
        }
      ],
    });
  }

  public async exec(message: Message, { query }: { query: string }): Promise<Message | Message[]> {
    const { index, sitemap } = await getSources();
    const search: string[] = index.search(query, { limit: 10 }).map((id) => sitemap[<number>id].loc);
    const embed = this.client.util
      .embed()
      .setColor(this.MDN_BLUE_COLOR)
      .setAuthor("MDN Documentation", this.MDN_ICON_URL)
      .setTitle(`Search for: ${query}`);

    if (!search.length) {
      embed.setColor(0xFF0000).setDescription("No results found...");
      return message.util.send(embed);
    }

    if (search.length === 1) {
      const res = await fetch(`${baseURL + search[0]}/index.json`);
      const doc: MdnDoc = (await res.json()).doc;
      const docEmbed = this.client.util
        .embed()
        .setColor(0xFFFFFF)
        .setTitle(doc.pageTitle)
        .setURL(`https://developer.mozilla.org/${doc.mdn_url}`)
        .setThumbnail(this.MDN_ICON_URL)
        .setDescription(doc.summary);
      return message.util.send(docEmbed);
    }

    let results = search.map((path) => `**• [${path.replace(/_|-/g, " ")}](${baseURL}${path})**`);
    embed.setDescription(results.join("\n"));
    return message.util.send(embed);
  }
}

interface MdnDoc {
  isMarkdown: boolean,
  isTranslated: boolean,
  isActive: boolean,
  flaws: {},
  title: string,
  mdn_url: string,
  locale: string,
  native: string,
  sidebarHTML: string,
  body: ({
    type: "prose" | "specifications" | "browser_compatibility",
    value: {
      id: string | null,
      title: string | null,
      isH3: boolean,
      // type:prose
      content?: string,
      // type:specifications
      specifications?: ({ bcdSpecificationURL: string, title: string, shortTitle: string })[],
      // type:browser_compatibility
      dataURL?: string,
      // type:specifications | type:browser_compatibility
      query?: string,
    }
  })[],
  toc: ({ text: string, id: string })[],
  summary: string,
  popularity: number,
  modified: string, // ISO Date String
  other_translations: ({ title: string, locale: string, native: string })[],
  source: {
    folder: string,
    github_url: string,
    last_commit_url: string,
    filename: string
  },
  parents: ({ uri: string, title: string })[],
  pageTitle: string,
  noIndexing: boolean
}
