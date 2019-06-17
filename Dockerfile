FROM zenika/alpine-chrome:with-node

ENV ARTIFACTS_DIR /artifacts

# Use the Google Chrome installed upstream
# (env. vars used by the puppeteer node module install)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD 1
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser

# Upstream runs as 'chrome'
# (Chrome doesn't like to be root)
# Use 'root' for setup tasks
USER root
RUN mkdir /app \
    && mkdir -p $ARTIFACTS_DIR \
    && chown -R chrome:chrome /app \
    && chown -R chrome:chrome $ARTIFACTS_DIR

WORKDIR /app
COPY --chown=chrome js .

USER chrome
RUN npm install

ENTRYPOINT ["tini", "--", "node", "presto-report"]