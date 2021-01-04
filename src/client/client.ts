import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from "discord-akairo";
import { Collection } from "discord.js";
import { join } from "path";

interface BotConfig {
  token: string;
  channels: Collection<string, string>;
}

export default class BotClient extends AkairoClient {
  public commandHandler: CommandHandler;
  public listenerHandler: ListenerHandler;
  public inhibitorHandler: InhibitorHandler;
  public config: BotConfig;

  constructor(config: BotConfig) {
    super({
      disableMentions: "everyone",
      messageCacheMaxSize: 100,
      restTimeOffset: 100,
      restRequestTimeout: 10000,
    });

    this.config = config;

    /**
     * Creates command handler and assigns prefix
     */
    this.commandHandler = new CommandHandler(this, {
      directory: join(__dirname, "..", "commands"),
      prefix: process.env.PREFIX,
      blockBots: true,
      blockClient: true,
      allowMention: true,
      defaultCooldown: 15000,
      commandUtil: true,
      automateCategories: true,
      argumentDefaults: {
        prompt: {
          modifyStart: (_, str): string => `${str}\n\nType \`cancel\` to cancel the command.`,
          modifyRetry: (_, str): string => `${str}\n\nType \`cancel\` to cancel the command.`,
        },
      },
      aliasReplacement: /-/g,
    });

    /**
     * Creates listener handler
     */
    this.listenerHandler = new ListenerHandler(this, {
      directory: join(__dirname, "..", "events"),
    });

    /**
     * Creates inhibitor handler
     */
    this.inhibitorHandler = new InhibitorHandler(this, {
      directory: join(__dirname, "..", "inhibitors"),
    });
  }

  private async initializeBot() {
    //Attach handlers
    this.listenerHandler.setEmitters({
      InhibitorHandler: this.inhibitorHandler,
      commandHandler: this.commandHandler,
      listenerHandler: this.listenerHandler,
    });

    //Load handlers
    this.commandHandler.useListenerHandler(this.listenerHandler);
    this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
    this.listenerHandler.loadAll();
    this.commandHandler.loadAll();
    this.inhibitorHandler.loadAll();
  }

  public async start(): Promise<string> {
    await this.initializeBot();
    return await this.login(this.config.token);
  }
}
