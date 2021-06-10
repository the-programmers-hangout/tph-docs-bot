import { Command } from "discord-akairo";
import { Message } from "discord.js";
import Botclient from "./../../client/client";

export default class HelpCommand extends Command {
  public client: Botclient;
  private DJS_BLUE_COLOR = 2266867;

  public constructor() {
    super("help", {
      aliases: ["help", "info", "about"],
      description: {
        content:
          "Shows a collection of available commands, or information about a specifically provided command",
        usage: "<optional command>",
      },
      channel: "guild",
      clientPermissions: ["EMBED_LINKS"],
      ratelimit: 2,
      args: [
        {
          id: "cmd",
          type: "commandAlias",
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { cmd }: { cmd: Command }
  ): Promise<Message | Message[]> {
    const prefix = process.env.PREFIX;

    if (!cmd) {
      const embed = this.client.util
        .embed()
        .setAuthor(this.client.user.tag, this.client.user.displayAvatarURL())
        .setColor(this.DJS_BLUE_COLOR)
        .setDescription(
          `For additional info on a command, type \`${prefix}help <command>\``
        );

      for (const category of this.handler.categories.values()) {
        embed.addField(
          `${category.id.replace(/(\b\w)/gi, (lc): string =>
            lc.toUpperCase()
          )}`,
          `${category
            .filter((cmd): boolean => cmd.aliases.length > 0)
            .map((cmd): string => ` ${cmd.aliases[0]}`)}`
        );
      }

      return message.util.send(embed);
    }

    const embed = this.client.util
      .embed()
      .setAuthor(this.client.user.tag, this.client.user.displayAvatarURL())
      .setColor(2266867)
      .setTitle(`${cmd.aliases[0]} ${cmd.description.usage ?? ""}`)
      .addField("Description", cmd.description.content ?? "\u200b");

    if (cmd.aliases.length > 1)
      embed.addField("Aliases", `${cmd.aliases.join(" ")}`, true);
    if (cmd.description.examples && cmd.description.examples.length)
      embed.addField(
        "Examples",
        `${cmd.aliases[0]} ${cmd.description.examples.join(
          `\n${cmd.aliases[0]} `
        )}`,
        true
      );

    return message.util.send(embed);
  }
}
