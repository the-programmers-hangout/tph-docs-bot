import { Message } from "discord.js";
import { Command } from "discord-akairo";
import fetch from "node-fetch";
import * as qs from "querystring";

export default class DiscordCommand extends Command {
  public constructor() {
    super("djs-docs", {
      aliases: ["djs", "d.js", "djsdocs", "discordjs", "discord.js"],
      description: {
        content: "Searches discord.js documentation for what it thinks you mean. Defaults to using the master branch",
        usage: "<query> <optional branch>",
        examples: ["Guild#Members", "Guild#Members -branch stable"],
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
          flag: ["-b ", "--b ", "-branch ", "--branch "],
          match: "option",
        },
      ],
    });
  }

  public async exec(message: Message, { query, branch }): Promise<Message | Message[]> {
    const str = query.split(" ");

    const source = branch == "stable" ? "stable" : "master";

    //src and q being the params accepted by the API
    const queryString = qs.stringify({ src: source, q: str.join(" ") });
    const res = await fetch(`https://djsdocs.sorta.moe/v2/embed?${queryString}`);
    const embedObj = await res.json();
    console.log(embedObj);

    if (!embedObj) return;

    return message.channel.send({ embed: embedObj });
  }
}
