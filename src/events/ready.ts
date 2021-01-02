import { Listener } from "discord-akairo";
import BotClient from "../client/client";

export default class Ready extends Listener {
  public client: BotClient;

  constructor() {
    super("ready", {
      event: "ready",
      emitter: "client",
      category: "client",
    });
  }

  public exec() {
    // this.setPresence();

    return console.info("Connected to Discord API");
  }

  private setPresence() {
    this.client.user
      .setPresence({ activity: { type: "WATCHING", name: "Discord.JS channel" }, status: "online" })
      .then(console.log)
      .catch(console.error);
  }
}
