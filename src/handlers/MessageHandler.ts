import { intervalToDuration } from "date-fns";
import { Formatters, MessageEmbed } from "discord.js";
import type { Message } from "discord.js";

export async function messageHandler(message: Message<true>) {
    const clientUser = message.client.user;
    // The regex for the bot's mention
    const mentionRegex = new RegExp(`<@!?${clientUser.id}>`);

    if (message.content.trim().match(mentionRegex)) {
        const pkgJSONPath = "../../package.json";
        const pkgJSON = await import(pkgJSONPath);
        const { version, description, dependencies } = pkgJSON;

        const uptime = intervalToDuration({
            start: new Date().getTime() - message.client.uptime,
            end: new Date().getTime(),
        });

        const statusEmbed = new MessageEmbed()
            .setTitle(`${clientUser.tag} ${version}`)
            .setURL("https://github.com/the-programmers-hangout/tph-docs-bot/")
            .setColor(0x90ee90)
            .setDescription(description)
            .addField(
                "Currently Supported Docs",
                ["discord.js", "Javascript (mdn)"].map((str) => `\`${str}\``).join(", "),
            )
            .addField("Dependencies", Formatters.codeBlock("json", JSON.stringify(dependencies, undefined, 4)))
            .addField(
                "Uptime",
                `${uptime.months} months, ${uptime.days} days, ${uptime.hours} hours, ${uptime.minutes} minutes, ${uptime.seconds} seconds`,
            )
            .addField("Ping", message.client.ws.ping + "ms", true)
            .addField("Source", "[github](https://github.com/the-programmers-hangout/tph-docs-bot/)", true)
            .addField(
                "Contributors",
                "[link](https://github.com/the-programmers-hangout/tph-docs-bot/graphs/contributors)",
                true,
            );

        message.reply({ embeds: [statusEmbed] }).catch(console.error);
    }
    return;
}
