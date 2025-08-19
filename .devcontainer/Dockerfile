FROM denoland/deno:2.4.4

EXPOSE 8000

RUN mkdir -p /usr/src/app/src
WORKDIR /usr/src/app

# Install required packages for development environment
RUN apt update \
    && apt -y install pdfsandwich tesseract-ocr-deu tesseract-ocr-fra curl git zip unzip iputils-ping \
    && rm -rf /var/lib/apt/lists/*

# Ensure Deno cache dir exists and is writable
RUN mkdir -p /deno-dir && chown -R deno:deno /deno-dir

# Remove ImageMagick policy restrictions (only if file exists)
RUN rm -f /etc/ImageMagick-6/policy.xml

# Change ownership of the working directory to deno user
RUN chown -R deno:deno /usr/src/app \
    && mkdir -p /home/deno \
    && chown -R deno:deno /home/deno

# Switch to deno user before creating files
USER deno

# (Optional) set DENO_DIR explicitly
ENV DENO_DIR=/deno-dir

# Pre-cache dependencies (will be overridden by volume mount in dev)
RUN mkdir -p src && echo 'export {};' > src/deps.ts

# Keep container running for development
CMD ["sleep", "infinity"]