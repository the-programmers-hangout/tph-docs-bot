import { AkairoClient, CommandHandler, ListenerHandler } from "discord-akairo";
import { join } from "path";

interface BotConfig {
  TOKEN: string;
}

export default class BotClient extends AkairoClient {
  public commandHandler: CommandHandler;
  public listenerHandler: ListenerHandler;
  public config: BotConfig;

  constructor(config: BotConfig) {
    super(
      { ownerID: process.env.ownerID },
      {
        disableMentions: "everyone",
        messageCacheMaxSize: 2500,
        restTimeOffset: 100,
        restRequestTimeout: 10000,
      }
    );

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
      defaultCooldown: 5000,
      ignoreCooldown: [],
      commandUtil: true,
      argumentDefaults: {
        prompt: {
          modifyStart: (_, str): string => `${str}\n\nType \`cancel\` to cancel the command.`,
          modifyRetry: (_, str): string => `${str}\n\nType \`cancel\` to cancel the command.`,
          timeout: "Guess you took too long, the command has been cancelled.",
          ended: "More than 3 tries and you still didn't couldn't do it... The command has been cancelled.",
          cancel: "The command has been cancelled.",
          retries: 3,
          time: 30000,
        },
        otherwise: "",
      },
      aliasReplacement: /-/g,
    });

    /**
     * Creates listener handler
     */
    this.listenerHandler = new ListenerHandler(this, {
      directory: join(__dirname, "..", "events"),
    });
  }

  /**
   * Attach listener handler, command handler, connect to DB.
   */
  private async initializeBot() {
    this.listenerHandler.setEmitters({
      commandHandler: this.commandHandler,
      listenerHandler: this.listenerHandler,
    });

    /**
     * Loading handlers
     */
    this.commandHandler.useListenerHandler(this.listenerHandler);
    this.listenerHandler.loadAll();
    this.commandHandler.loadAll();
  }

  public async start(): Promise<string> {
    await this.initializeBot();
    return await this.login(this.config.TOKEN);
  }
}
