FROM denoland/deno:2.4.4

EXPOSE 8000

RUN mkdir -p /usr/src/app/src /usr/src/app/.devcontainer
WORKDIR /usr/src/app

# Install required packages (union of prod + dev wants)
RUN apt update \
    && apt -y install pdfsandwich tesseract-ocr-deu tesseract-ocr-fra curl git zip unzip iputils-ping \
    && rm -rf /var/lib/apt/lists/*

# Remove restrictive ImageMagick policy if present (non-fatal if absent)
RUN rm -f /etc/ImageMagick-6/policy.xml || true

# Adjust ownership for non-root usage
RUN chown -R deno:deno /usr/src/app \
    && mkdir -p /home/deno \
    && chown -R deno:deno /home/deno

USER deno


# Local Deno cache + persistent bash history (handy even outside devcontainer)
ENV DENO_DIR=/usr/src/app/.deno-dir \
    HISTFILE=/usr/src/app/.devcontainer/.bash_history \
    HISTSIZE=5000 \
    HISTFILESIZE=10000
RUN mkdir -p "$DENO_DIR" src && touch /usr/src/app/.devcontainer/.bash_history && chmod 600 /usr/src/app/.devcontainer/.bash_history

# Configure history persistence only for interactive shells by appending to the deno user's .bashrc
# This avoids PROMPT_COMMAND being executed in non-interactive shells where 'history' may not accept
# the supplied arguments and would emit errors.
RUN mkdir -p /home/deno && \
    printf '\n# Persist bash history across sessions (interactive shells only)\nif [[ $- == *i* ]]; then\n  # append new history lines and read new lines from history file\n  PROMPT_COMMAND="history -a; history -n; ${PROMPT_COMMAND:-}"\nfi\n' >> /home/deno/.bashrc || true

# Pre-cache dependencies (will speed up builds; safe if later bind-mounted)
COPY src/deps.ts src/deps.ts
RUN deno cache src/deps.ts

# Copy application source
COPY . .

# Default container command (can be overridden in dev to `sleep infinity`)
CMD [ "/bin/bash", "/usr/src/app/docker-cmd.sh" ]