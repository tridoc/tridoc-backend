FROM node:8.11-alpine
EXPOSE 8000
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN yarn install
RUN chmod +x /usr/src/app/docker-cmd.sh
CMD [ "/usr/src/app/docker-cmd.sh" ]