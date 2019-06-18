const utils = require('./utils');
const crawler = require('./crawler');
const path = require('path');

// Artifacts dir
const artifacts_dir = process.env.ARTIFACTS_DIR

// Arguments
const argv = require('yargs')
    .usage('$0 [args]', 'Generate PRESTO card activity reports')
    .env("PRESTO") // Parse env. vars for args ('PRESTO_<ARG>' for 'arg')

    // Date Ranges
    .option('lastmonth', {
        demandOption: true,
        default: true,
        describe: 'Last month',
        group: "Date Ranges:",
        type: 'boolean'
    })
    // Transaction Types
    .option('type', {
        demandOption: true,
        default: ['Loads', 'Transit pass payment'],
        describe: 'Transaction type',
        group: "Transaction types:",
        type: 'string',
        array: true,
        choices: [
            'ALL',
            'Loads',
            'Transit pass loads',
            'Fare Payment',
            'Transit pass payment'
        ]
    })

    // Report emailing
    .option('to', {
        describe: 'Email recipient',
        group: "Emailing:",
        type: 'string'
    })
    .option('from', {
        describe: 'Email sender',
        group: "Emailing:",
        type: 'string'
    })
    .option('subject', {
        describe: 'Email subject',
        group: "Emailing:",
        type: 'string'
    })

    // Email options must be used together
    .implies({
        'to': ['from', 'subject'],
        'from': ['to', 'subject'],
        'subject': ['to', 'from']
    })

    .help()
    .version()
    .argv

// console.dir(argv)

// Calculate a date range the PRESTO Website expects
date_range = utils.prestoDateRange(argv)

// Report name based on date range (replace '/' or ' ' with '_')
pdf_name = 'presto_' + date_range.replace(/\/| /g, '_') + '.pdf'
pdf_path = path.join(artifacts_dir, pdf_name)

// Crawl and save PDF
crawler.savePdf(date_range, argv.type, pdf_path)
    .then(function () {
        // Email PDF
        if (argv.to) {
            utils.emailPdf(argv.from, argv.to, argv.subject, pdf_path)
        }
    });