# presto-report

>  **presto-report**, a cli tool to automate the generation (and emailing) of [prestocard.ca](https://www.prestocard.ca) transit activity reports, mainly for expense purposes.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## About

**presto-report** is a simple NodeJS app packaged in a Docker image alongside a full Chrome headless browser. It is based on [zenika/alpine-chrome](https://github.com/Zenika/alpine-chrome) and uses [puppeteer](https://github.com/GoogleChrome/puppeteer) to crawl the Web and generate PDFs. It supports emailing PDFs with a [free] [SendGrid](https://sendgrid.com) API key.

**What it does:**

1. Navigates to https://www.prestocard.ca/en/dashboard/card-activity & signs in;
2. Picks a date range, transaction types(s) (default: 'card loads') and clicks '*View*';
3. Clicks '*Print*' & saves as PDF;
4. *(Optional)* Emails that PDF.



## Installation

```bash
docker pull pndurette/presto-report
```

```bash
cat << EOF > .env
PRESTO_USER=youruser
PRESTO_PASS=yourpass
EOF
```

Define `PRESTO_USER` and `PRESTO_PASS` respectively as your [prestocard.ca](https://www.prestocard.ca/) credentials (see [`.env.example`](.env.example)). 



## Usage

```bash
docker run --rm --privileged --env-file .env pndurette/presto-report --help
```

### Examples

<u>Last month's report</u> to `./artifacts/<report>.pdf` [1]

```bash
docker run --rm --privileged --env-file .env \
           -v $(pwd)/artifacts:/artifacts \
           pndurette/presto-report --lastmonth
```

<u>June 2018's report</u> to `receipts@company.com` [2] [3]:

```bash
docker run --rm --privileged --env-file .env \
           -v $(pwd)/artifacts:/artifacts \
           pndurette/presto-report --year 2018 --month 06 \
           --to receipts@company.com \
           --from me@company.com \
           --subject '$100'
```

<u>Last month's report</u> to ``receipts@company.com` [4]:

```bash
docker run --rm --privileged --env-file .env pndurette/presto-report --lastmonth
```



#### Footnotes:

[1] **NB:** Emailing is optional. Mount the `artifact` directory to access your report.

[2] **NB:** To email, you'll need a [SendGrid API Key](https://sendgrid.com/pricing/) (with at least the 'Mail Send' scope—it's free for 100 emails/day) set to `SENDGRID_API_KEY` in your `.env` file.

[3] **NB:** Some expensing software (like Chrome River) that supports receipts emailing let's you set the expense amount in the subjet line.

[4] **NB:** Any CLI option `opt` can be set via a  `PRESTO_<OPT>` environment variable in `.env` (e.g. `PRESTO_TO`, `PRESTO_FROM`, etc.) as defaults. See [`.env.example`](.env.example).



## Caveats 

The error management in this piece of software is <u>piss-poor at best</u>. Effort was made to pre-validate the input, but that's about it. If it hangs, CTRL-C and check your parameters (username, password, api keys) but also the network, etc. Please note that is also my first forray into NodeJS. 