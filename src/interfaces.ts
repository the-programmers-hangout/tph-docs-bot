import type {
    Client,
    CommandInteraction,
    Collection,
    PermissionString,
    ButtonInteraction,
    SelectMenuInteraction,
    AutocompleteInteraction,
    ApplicationCommandOptionChoice,
} from "discord.js";
import type { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
type SlashCommandOptionsType = ReturnType<SlashCommandBuilder["addChannelOption"]>;
export interface MyContext {
    client: Client;
    commands: {
        autocompletes: Collection<string, Command["autocomplete"][number]>;
        buttons: Collection<string, Command["buttons"][number]>;
        selectMenus: Collection<string, Command["selectMenus"][number]>;
        slashCommands: Collection<string, Command["slashCommand"]>;
    };
    cooldownCounter: Collection<string, number>;
}
export interface Command {
    slashCommand?: {
        data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsType;
        cooldown?: number;
        // * Note that as of writing, slash commands use the permissions for @everyone
        botPermissions?: PermissionString[];
        authorPermissions?: PermissionString[];
        guildOnly?: boolean;
        run(interaction: CommandInteraction, context: MyContext): Promise<void>;
    };
    buttons?: { custom_id: string; run(interaction: ButtonInteraction<"cached">, context: MyContext): Promise<void> }[];
    selectMenus?: {
        custom_id: string;
        run(interaction: SelectMenuInteraction<"cached">, context: MyContext): Promise<void>;
    }[];
    autocomplete?: {
        focusedOption: string;
        run(
            interaction: AutocompleteInteraction<"cached">,
            focusedOption: ApplicationCommandOptionChoice,
            context: MyContext,
        ): Promise<void>;
    }[];
}
export interface MdnDoc {
    isMarkdown: boolean;
    isTranslated: boolean;
    isActive: boolean;
    flaws: Record<string, unknown>;
    title: string;
    mdn_url: string;
    locale: string;
    native: string;
    sidebarHTML: string;
    body: {
        type: "prose" | "specifications" | "browser_compatibility";
        value: {
            id: string | null;
            title: string | null;
            isH3: boolean;
            // type:prose
            content?: string;
            // type:specifications
            specifications?: { bcdSpecificationURL: string; title: string; shortTitle: string }[];
            // type:browser_compatibility
            dataURL?: string;
            // type:specifications | type:browser_compatibility
            query?: string;
        };
    }[];
    toc: { text: string; id: string }[];
    summary: string;
    popularity: number;
    modified: string; // ISO Date String
    other_translations: { title: string; locale: string; native: string }[];
    source: {
        folder: string;
        github_url: string;
        last_commit_url: string;
        filename: string;
    };
    parents: { uri: string; title: string }[];
    pageTitle: string;
    noIndexing: boolean;
}
