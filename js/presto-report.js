const utils = require('./utils');
const crawler = require('./crawler');
const moment = require('moment');
const path = require('path');

// Artifacts dir
const artifacts_dir = process.env.ARTIFACTS_DIR

// Arguments
const argv = require('yargs')
    .usage('$0 [args]', 'Generate PRESTO card activity reports')
    .env('PRESTO') // Parse env. vars for args ('PRESTO_<ARG>' for 'arg')

    // Report period
    .option('lastmonth', {
        describe: 'Last month period',
        group: 'Report Period:',
        type: 'boolean'
    })
    .option('year', {
        describe: 'Period year (use with --month)',
        group: 'Report Period:',
        type: 'number'
    })
    .option('month', {
        describe: 'Period month (use with --year)',
        group: 'Report Period:',
        type: 'number'
    })
    // Use either ('lastmonth') OR ('year' AND 'month')
    .implies({
        'year': 'month',
        'month': 'year'
    })
    .conflicts({
        'lastmonth': ['year', 'month'],
        'year': ['lastmonth'],
        'month': ['lastmonth']
    })
    .check(function (argv) {
        // Check mutual-exclusivity of range options
        if ('lastmonth' in argv && ('year' in argv || 'month' in argv)) {
            msg = "Range Error: Use either ('lastmonth') OR ('year' AND 'month')";
            throw (new Error(msg));
        };
        return true;
    })
    .check(function (argv) {
        // Check validity of year and month
        if (argv.year) {
            if (!moment(argv.year, "YYYY").isValid())
                throw (new Error('Invalid year'));
        };
        if (argv.month) {
            if (!moment(argv.month, "MM").isValid())
                throw (new Error('Invalid month'));
        };
        return true;
    })

    // Transaction Types
    .option('type', {
        demandOption: true,
        default: ['Loads', 'Transit pass loads'],
        describe: 'Transaction type',
        group: 'Transaction Types:',
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

// Calculate a date range the PRESTO Website expects
date_range = utils.prestoDateRange(argv)

// Report name based on date range (replace '/' or ' ' with '_')
pdf_name = 'presto_' + date_range.replace(/\/| /g, '_') + '.pdf'
pdf_path = path.join(artifacts_dir, pdf_name)

console.log(date_range)
process.exit()

// Crawl and save PDF
crawler.savePdf(date_range, argv.type, pdf_path)
    .then(function () {
        // Email PDF
        if (argv.to) {
            utils.emailPdf(argv.from, argv.to, argv.subject, pdf_path)
        }
    });