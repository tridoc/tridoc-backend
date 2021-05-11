FROM node:lts-buster
EXPOSE 8000
RUN apt update \
    && apt -y install pdfsandwich tesseract-ocr-deu tesseract-ocr-fra
RUN rm /etc/ImageMagick-6/policy.xml
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN yarn install
RUN chmod +x /usr/src/app/docker-cmd.sh
CMD [ "/usr/src/app/docker-cmd.sh" ]