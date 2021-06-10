import { Listener, Command } from "discord-akairo";
import BotClient from "../client/client";
import { Message } from "discord.js";

export default class MissingPermissions extends Listener {
  public client: BotClient;

  public constructor() {
    super("missingPermissions", {
      emitter: "commandHandler",
      category: "commandHandler",
      event: "missingPermissions",
    });
  }

  public async exec(
    message: Message,
    command: Command,
    type: string,
    missing: never
  ): Promise<void> {
    switch (type) {
      case "client":
        console.info(
          `Missing the permission: ${missing}, in guild "${message.guild.name}" (${message.guild.id})`
        );
        await message.util?.send(
          `It seems like I'm missing the permission \`\`${missing}\`\` to execute the \`\`${command}\`\` command.`
        );
        break;
      case "user":
        await message.reply(
          `You're missing the permission \`\`${missing}\`\` in order to execute the \`\`${command}\`\` command.`
        );
        break;
    }
  }
}
