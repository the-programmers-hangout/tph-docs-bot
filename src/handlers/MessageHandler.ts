import { Formatters, MessageEmbed } from "discord.js";
import type { Message } from "discord.js";
import { intervalToDuration, intervalObjToStr } from "../utils/DateUtils";

export async function messageHandler(message: Message<true>) {
    try {
        const clientUser = message.client.user;
        // The regex for the bot's mention
        const mentionRegex = new RegExp(`^<@!?${clientUser.id}>$`);

        if (message.content.trim().match(mentionRegex)) {
            const pkgJSONPath = "../../package.json";
            const pkgJSON = await import(pkgJSONPath);
            const { version, description, dependencies } = pkgJSON;

            const uptime = intervalToDuration(Date.now() - message.client.uptime, Date.now());
            const statusEmbed = new MessageEmbed()
                .setTitle(`${clientUser.username} (v${version})`)
                .setURL("https://github.com/the-programmers-hangout/tph-docs-bot/")
                .setColor(0xd250c7)
                .setDescription(description)
                .setThumbnail(clientUser.displayAvatarURL({ dynamic: true, format: "png", size: 256 }))
                .addField(
                    "Currently Supported Docs",
                    ["discord.js", "Javascript (mdn)"].map((str) => `\`${str}\``).join(", "),
                )
                .addField("Dependencies", Formatters.codeBlock("json", JSON.stringify(dependencies, undefined, 4)))
                .addField("Uptime", `${intervalObjToStr(uptime)}` || "Just turned on")
                .addField("Ping", message.client.ws.ping + "ms", true)
                .addField("Source", "[GitHub](https://github.com/the-programmers-hangout/tph-docs-bot/)", true)
                .addField(
                    "Contributors",
                    "[Link](https://github.com/the-programmers-hangout/tph-docs-bot/graphs/contributors)",
                    true,
                );

            await message.reply({ embeds: [statusEmbed] });
        }
    } catch (e) {
        console.error(e);
    }

    return;
}
