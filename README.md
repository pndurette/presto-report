```bash
docker container run -it --rm -v $(pwd)/js:/usr/src/app/js --env-file .env --cap-add=SYS_ADMIN zenika/alpine-chrome:with-puppeteer node js/test.js
```