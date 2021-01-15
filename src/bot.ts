import "dotenv/config";

import BotClient from "./client/client";

const client: BotClient = new BotClient({
  token: process.env.TOKEN
});

client.on("error", (error) => console.error(error));
client.on("warn", (warn) => console.warn(warn));

client.start();
