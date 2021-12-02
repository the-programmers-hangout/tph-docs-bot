# tphdocsbot

A Discord bot to display documentation

## Currently supported docs

* discord.js (includes main/stable branch, includes djs-voice, djs-builders and djs-collection documentations)

## Docker

To build and run the Docker container locally:

```console
docker build . -t tphdocsbot:latest
```

```console
docker run -e TOKEN=<your discord token> -e APPLICATIONID=<ApplicationID> -e GUILDID=<GuildID> tphdocsbot:latest
```

Or put the values in a local file and use that using..

```console
docker run --env-file .env tphdocsbot:latest
```

### Cofiguration

* `TOKEN` [required] the Discord bot token to run under
* `APPLICATIONID` [required]  the Discord bot's application ID. Get it from [Dev portal](https://discord.com/developers/applications) -> your bot -> General Information -> Application ID
* `GUILDID` (required to register on a specific guild) the guild id to register commands on, recommended to register on a specific guild for testing

### Registering

In order to register the commands globally, run

```console
npm run registerGlobalCommands
```

For registering guild-specific commands (Recommended for testing)

```console
npm run registerGuildCommands
```

Afterwards to reset guild commands, (To avoid duplication of global and guild-specific commands)

```console
npm run resetGuildCommands
```
