FROM denoland/deno:1.26.2

EXPOSE 8000

RUN mkdir -p /home/deno
RUN chown -R deno /home/deno
RUN mkdir -p /usr/src/app/src
WORKDIR /usr/src/app

RUN apt update \
    && apt -y install pdfsandwich tesseract-ocr-deu tesseract-ocr-fra curl git zip unzip
RUN rm /etc/ImageMagick-6/policy.xml

USER deno
COPY src/deps.ts src/deps.ts
RUN deno cache src/deps.ts

COPY . .

CMD [ "/bin/bash", "/usr/src/app/.devcontainer/docker-cmd.sh" ]