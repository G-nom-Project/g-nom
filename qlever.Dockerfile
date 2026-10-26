FROM docker.io/adfreiburg/qlever:latest

USER root
RUN mkdir -p /index
WORKDIR /index
USER qlever

# Pull all settings from the Qleverfile except for the access token, which we will store in .env
ENTRYPOINT ["qlever", "-q", "Qleverfile", "start", "--run-in-foreground", "--access-token", "\"$ACCESS_TOKEN\""]
