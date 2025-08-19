FROM denoland/deno:2.4.4

EXPOSE 8000

RUN mkdir -p /usr/src/app/src
WORKDIR /usr/src/app

RUN apt update \
    && apt -y install pdfsandwich tesseract-ocr-deu tesseract-ocr-fra curl zip unzip

USER deno
COPY src/deps.ts src/deps.ts
RUN deno cache src/deps.ts

COPY . .

CMD [ "/bin/bash", "/usr/src/app/docker-cmd.sh" ]