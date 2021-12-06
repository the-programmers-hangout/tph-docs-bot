import type { Message } from "discord.js";
import { Command } from "discord-akairo";
import Doc from "discord.js-docs";
import sources = require("../../sources.json");

export default class DiscordCommand extends Command {
  public constructor() {
    super("djs-docs", {
      aliases: ["djs", "d.js", "djsdocs", "discordjs", "discord.js"],
      description: {
        content: "Searches discord.js documentation for what it thinks you mean. Defaults to using the main branch",
        usage: "<query> <optional branch>",
        examples: ["Guild#Members", "Guild#Members main"],
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
          flag: ["main", "stable"],
          match: "flag",
          default: "stable",
        },
      ],
    });
  }

  public async exec(message: Message, { query, branch }: { query: string; branch: string }): Promise<Message | Message[]> {
    const str = query.split(" ");

    const source = branch ? "stable" : sources["main"];
    const doc = await Doc.fetch(source, {force: true});
    const resultEmbed = doc.resolveEmbed(str.join("#"));
    if (!resultEmbed) return;
    // For typings of djs' embeds
    const timeStampDate = new Date(resultEmbed.timestamp);
    const embedObj = {...resultEmbed, timestamp: timeStampDate} ;

    if (!embedObj) return;

    return message.channel.send({ embed: embedObj });
  }
}
