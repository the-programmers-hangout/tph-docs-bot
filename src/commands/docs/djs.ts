import { Message } from "discord.js";
import { Command } from "discord-akairo";
import fetch from "node-fetch";
import { stringify } from "querystring";

export default class DiscordCommand extends Command {
  public constructor() {
    super("djs-docs", {
      aliases: ["djs", "d.js", "djsdocs", "discordjs", "discord.js"],
      description: {
        content: "Searches discord.js documentation for what it thinks you mean. Defaults to using the master branch",
        usage: "<query> <optional branch>",
        examples: ["Guild#Members", "Guild#Members master"],
      },
      channel: "guild",
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 2,
      args: [
        {
          id: "query",
          match: "rest",
          type: "lowercase",
          prompt: {
            start: "```\n" + "Enter the phrase you'd like to search for.\n" + "Example: Guild#channels" + "```",
            retry: "Not a valid search phrase.",
          },
        },
        {
          id: "branch",
          flag: ["master", "stable"],
          match: "flag",
          default: "stable",
        },
      ],
    });
  }

  public async exec(message: Message, { query, branch }: { query: string; branch: string }): Promise<Message | Message[]> {
    const str = query.split(" ");

    const source = branch ? "stable" : "master";

    //src and q being the params accepted by the API
    const queryString = stringify({ src: source, q: str.join(" ") });
    const res = await fetch(`https://djsdocs.sorta.moe/v2/embed?${queryString}`);
    const embedObj = await res.json();
    console.log(embedObj);

    if (!embedObj) return;

    return message.channel.send({ embed: embedObj });
  }
}
