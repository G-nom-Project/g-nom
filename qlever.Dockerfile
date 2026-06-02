# Use the prebuilt QLever image directly
FROM docker.io/adfreiburg/qlever:latest

USER root
# Create working directory
RUN mkdir -p /index
WORKDIR /index
USER qlever

# Start server
ENTRYPOINT sh -c 'qlever-server \
    -i gnom \
    -j 8 \
    -p 8888 \
    -m 5G \
    -c 2G \
    -e 1G \
    -k 200 \
    -s 30s \
    -a "$ACCESS_TOKEN"'
