# presto-report

>  **presto-report**, a cli tool to automate the generation (and emailing) of [prestocard.ca](https://www.prestocard.ca) transit activity reports, mainly for expense purposes.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

### About

**presto-report** is a simple NodeJS app packaged in a Docker image alongside a full Chrome headless browser. It is based on [zenika/alpine-chrome](https://github.com/Zenika/alpine-chrome) and uses [puppeteer](https://github.com/GoogleChrome/puppeteer) to crawl the Web and generate PDFs. It supports emailing PDFs with a [free] [SendGrid](https://sendgrid.com) API key.

**What it does:**

1. Navigates to https://www.prestocard.ca/en/dashboard/card-activity & signs in;
2. Picks a date range, transaction types(s) (default: 'card loads') and clicks '*View*';
3. Clicks '*Print*' & saves as PDF;
4. *(Optional)* Emails that PDF.

### Installation

**Pull image**

```bash
$ docker pull pndurette/presto-report
```

**Setup environment**

Define `PRESTO_USER` and `PRESTO_PASS` in a file named `.env`; respectively as the username and password you use to login to [prestocard.ca](https://www.prestocard.ca/) (see [`.env.example`](.env.example)). 

### Usage

```bash
$ docker run --rm --privileged --env-file .env pndurette/presto-report --help
```

**NB:** Chrome needs `--privileged` to run inside Docker (or at the very least [`--cap-add=SYS_ADMIN`](https://github.com/Zenika/alpine-chrome#with-sys_admin-capability))

#### Examples

<u>Last month's report</u> to `./artifacts/<report>.pdf`[1]

```bash
$ docker run --rm --privileged --env-file .env \
             -v $(pwd)/artifacts:/artifacts \
             pndurette/presto-report --lastmonth
```

<u>June 2018's report</u> to `receipts@company.com` [2] [3]:

```bash
$ docker run --rm --privileged --env-file .env \
             -v $(pwd)/artifacts:/artifacts \
             pndurette/presto-report --year 2018 --month 06 \
             --to receipts@company.com \
             --from me@company.com \
             --subject '$100'
```

<u>Last month's report</u> to ``receipts@company.com` [4]:

```bash
$ docker run --rm --privileged --env-file .env pndurette/presto-report --lastmonth
```

[1] **NB:** To skip the emailing feature, you'll have to mount the `artifact` directory to access your report (not don't use any email argument).

[2] **NB:** To use the emailing feature, you'll need a [SendGrid API Key](https://sendgrid.com/pricing/) (with at least the 'Mail Send' scope) set to `SENDGRID_API_KEY` in your `.env` file. They're free for 100 emails/day. Otherwise, you'll have to mount the `artifacts` directory.

[3] **NB:** Many expensing software (like Chrome River) that supports emailing of receipts also support setting the amount set as the email 'subject' line.

[4] **NB:** Any CLI option `opt` can be set via a  `PRESTO_<OPT>` environment variable in `.env` (e.g. `PRESTO_TO`, `PRESTO_FROM`, etc.) as defaults. See [`.env.example`](.env.example).

### Caveats 

The error management in this piece of software is <u>piss-poor at best</u>. Effort was made to pre-validate the input, but that's about it. If it hangs, CTRL-C and check your parameters (username, password, api keys) but also the network, etc. Please note that is also my first forray into NodeJS. 