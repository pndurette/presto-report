```bash
docker run --rm --privileged -v $(pwd)/artifacts:/artifacts --env-file .env presto-report:latest
```