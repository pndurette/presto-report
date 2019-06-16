FROM zenika/alpine-chrome:with-puppeteer

# Use upstream image WORKDIR for node/node_modules
# https://github.com/Zenika/alpine-chrome/tree/master/with-puppeteer
WORKDIR /usr/src/app

COPY sh .
COPY js .

# Where created files go.
# Mount this to get them.
RUN mkdir /tmp/artifacts

ENTRYPOINT ["tini", "--"]
CMD ["sh", "cli.sh"]