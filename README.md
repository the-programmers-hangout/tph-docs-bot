# tphdocsbot

A Discord bot to display documentation

## Docker

To build and run the Docker container locally:

```console
$ docker build . -t tphdocsbot:latest
$ docker run -e TOKEN=<your discord token> tphdocsbot:latest
```

### Cofiguration

  * `TOKEN` [required] the Discord bot token to run under

