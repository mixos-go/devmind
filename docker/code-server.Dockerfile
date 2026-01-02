FROM codercom/code-server:latest
USER root
RUN apt-get update && apt-get install -y git
USER coder
WORKDIR /home/coder/project
CMD ["/usr/bin/code-server", "--auth", "none", "."]
