import { Inhibitor } from "discord-akairo";
import { Message } from "discord.js";
import BotClient from "./../client/client";

export default class AcceptedChannelsInhibitor extends Inhibitor {
  public client: BotClient;
  public constructor() {
    super("acceptedChannels", {
      reason: "acceptedChannels",
    });
  }

  public async exec(message: Message) {
    const isIncluded = this.client.config.channels.array().includes(message.channel.id);
    console.warn(`Command [${message.util.parsed.command.id}] was attempted to be used in an inappropriate channel.`);
    return !isIncluded;
  }
}
