import { Listener, Command } from "discord-akairo";
import BotClient from "../client/client";
import { Message } from "discord.js";

export default class CommandError extends Listener {
  public client: BotClient;

  public constructor() {
    super("commandError", {
      event: "error",
      emitter: "commandHandler",
      category: "commandHandler",
    });
  }

  public exec(error: Error, _message: Message, command: Command) {
    return console.error(`Command/Inhibitor ${command} has errored. ${error}`);
  }
}
