FROM node:8.11-onbuild
EXPOSE 8000
# ADD docker-cmd.sh /usr/local/
RUN chmod +x /usr/src/app/docker-cmd.sh
CMD [ "/usr/src/app/docker-cmd.sh" ]