import "dotenv/config";
import { Client, Collection } from "discord.js";
import { MyContext } from "./interfaces";
import { loadCommands, commandHandler } from "./handlers/CommandHandler";

(async function () {
    const context: MyContext = {
        client: new Client({
            intents: ["GUILDS"],
            presence: {
                activities: [{ type: "WATCHING", name: "Discord.JS channel" }],
                status: "online",
            },
            // For DMs, a partial channel object is received, in order to receive dms, CHANNEL partials must be activated  
            partials: ["CHANNEL"],
        }),
        commands: new Collection(),
        cooldownCounter: new Collection(),
    };
    const docsBot = context.client;
    await loadCommands(context);
    docsBot.on("error", console.error);
    docsBot.on("warn", console.warn);
    docsBot.on("ready", (client) => {
        console.info(`Logged in as ${client.user.tag} (${client.user.id})`);
    });
    docsBot.on("interactionCreate", commandHandler.bind(null, context));

    docsBot.login(process.env.TOKEN);
})();
