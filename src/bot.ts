import { Collection } from "discord.js";
import "dotenv/config";

import BotClient from "./client/client";

const client: BotClient = new BotClient({
  token: process.env.TOKEN,
  channels: new Collection([
    ["bot-commands", "353544874034855936"],
    ["discord-js", "713041505719287818"],
    //TODO add channels here, will be converted into an array, only using Map to add visualization on channel names
  ]),
});

client.on("error", (error) => console.error(error));
client.on("warn", (warn) => console.warn(warn));

client.start();
