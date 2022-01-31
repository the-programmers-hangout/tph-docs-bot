import "dotenv/config";
import { Client, Collection, LimitedCollection } from "discord.js";
import { MyContext } from "./interfaces";
import { loadCommands, interactionCreateHandler } from "./handlers/InteractionCreateHandler";
import { messageHandler } from "./handlers/MessageHandler";
import { deleteButtonHandler } from "./utils/CommandUtils";

(async function () {
    const context: MyContext = {
        client: new Client({
            intents: ["GUILDS", "GUILD_MESSAGES"],
            presence: {
                activities: [{ type: "PLAYING", name: "Read the docs" }],
                status: "online",
            },
            // For DMs, a partial channel object is received, in order to receive dms, CHANNEL partials must be activated
            partials: ["CHANNEL"],
            makeCache: (manager) => {
                //! Disabling these caches will break djs functionality
                const unsupportedCaches = [
                    "GuildManager",
                    "ChannelManager",
                    "GuildChannelManager",
                    "RoleManager",
                    "PermissionOverwriteManager",
                ];
                if (unsupportedCaches.includes(manager.name)) return new Collection();
                // Disable every supported cache
                return new LimitedCollection({ maxSize: 0 });
            },
        }),
        commands: {
            autocompletes: new Collection(),
            buttons: new Collection(),
            selectMenus: new Collection(),
            slashCommands: new Collection(),
        },
        cooldownCounter: new Collection(),
    };
    const docsBot = context.client;
    await loadCommands(context);
    // Add delete button handler
    context.commands.buttons.set("deletebtn", { custom_id: "deletebtn", run: deleteButtonHandler });

    docsBot.on("error", console.error);
    docsBot.on("warn", console.warn);

    docsBot.once("ready", (client) => {
        console.info(`Logged in as ${client.user.tag} (${client.user.id})`);
    });

    docsBot.on("messageCreate", messageHandler);
    docsBot.on("interactionCreate", interactionCreateHandler.bind(null, context));

    docsBot.login(process.env.TOKEN);
})();
