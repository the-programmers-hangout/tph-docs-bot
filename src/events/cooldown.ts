import { Listener, Command } from "discord-akairo";
import { Message } from "discord.js";
import BotClient from "../client/client";
import ms = require("ms");

export default class Cooldown extends Listener {
  public client: BotClient;
  constructor() {
    super("cooldown", {
      event: "cooldown",
      emitter: "commandHandler",
      category: "commandHandler",
    });
  }

  public exec(message: Message, command: Command, remaning: number) {
    return message.reply(
      `Please wait \`\`${ms(
        remaning
      )}\`\` before using the \`\`${command}\`\` command again`
    );
  }
}
