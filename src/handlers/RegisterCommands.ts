import "dotenv/config";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import glob from "glob";

const {
    APPLICATIONID: applicationId,
    GUILDID: guildId,
    TOKEN: token,
    /**
     * REGISTER_MODE should be either "GUILD", "GUILD_RESET" or "GLOBAL"
     * GLOBAL globally registers commands,
     * GUILD registers on the provided GUILDID's guild
     */
    REGISTER_MODE: registerMode = "GLOBAL",
} = process.env;

// Check if the environment variables were provided
if (!applicationId) throw new Error("Please make sure the bot's application ID is mentioned on \"APPLICATIONID\"");
if (!token) throw new Error("Please make sure you add a token");
if (["GUILD", "RESET_GUILD"].includes(registerMode) && !guildId)
    throw new Error("The target's guild id is needed but was not provided");

const commands = [];
const commandFiles = glob.sync(`${__dirname}/../commands/**/*.js`);
const rest = new REST({ version: "9" }).setToken(token);

(async function () {
    for (const file of commandFiles) {
        const { default: command } = await import(`${file}`);
        commands.push(command.slashCommand.data.toJSON());
    }
    console.info(
        `${
            ["RESET_GUILD", "RESET_GLOBAL"].includes(registerMode) ? "Resetting" : "Reloading"
        } application (/) commands for ${applicationId} ${
            ["GUILD", "RESET_GUILD"].includes(registerMode) ? `on guild ${guildId}` : ""
        }: \n\t${commands.map((cmd) => cmd.name).join("\n\t")}\nOn mode: "${registerMode}"`,
    );
    try {
        if (registerMode === "RESET_GUILD") {
            await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
                body: [],
            });
        } else if (registerMode === "RESET_GLOBAL") {
            await rest.put(Routes.applicationCommands(applicationId), {
                body: [],
            });
        } else if (registerMode === "GUILD") {
            await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
                body: commands,
            });
        } else if (registerMode === "GLOBAL") {
            await rest.put(Routes.applicationCommands(applicationId), {
                body: commands,
            });
        }

        console.info(
            `Successfully ${
                ["RESET_GUILD", "RESET_GLOBAL"].includes(registerMode) ? "reset" : "reloaded"
            } application (/) commands.`,
        );
    } catch (error) {
        console.error(error);
    }
})();
