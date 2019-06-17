const puppeteer = require('puppeteer');
const moment = require('moment');
const argv = require('yargs')
    .usage('$0 [args]', 'Generate PRESTO card activity reports')
    .option('last', {
        demandOption: true,
        default: true,
        describe: 'Last month',
        group: "Date Range",
        type: 'boolean'
    })
    .option('type', {
        alias: 't',
        demandOption: true,
        default: ['Loads', 'Transit pass payment'],
        describe: 'Transaction type',
        group: "Transaction type",
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
    .option('to', {
        describe: 'Email to send to',
        group: "Emailing",
        type: 'string'
    })
    .option('from', {
        describe: 'Email sent from',
        group: "Emailing",
        type: 'string'
    })
    // emails must be used together
    .implies('to', 'from')
    .implies('from', 'to')
    .help()
    .version()
    .argv

console.dir(argv);

// Calculate date range string PRESTO expects.
// In the format "<from MM/DD/YYYY> - <to MM/DD/YYYY>"
//   e.g. "04/01/2019 - 05/08/2019"
date_rage = (function(argv) {
    if (argv.last) {
        // Last month range
        from_date = moment().subtract(1, 'months').startOf('month')
        to_date = moment().subtract(1, 'months').endOf('month')
        return `${from_date.format('MM/DD/YYYY')} - ${to_date.format('MM/DD/YYYY')}`
    }
})(argv);

// Login credentials
presto_user = process.env.PRESTO_USER
presto_pass = process.env.PRESTO_PASS

// PDF output
pdf_name = "report.pdf";
pdf_path = `${process.env.ARTIFACTS_DIR}/${pdf_name}`;

// Structuring:
// https://gist.github.com/glenhallworthreadify/d447e9d6b1fc9cb807b46f952236d4bc
// Passing variables to evaluate()
// https://stackoverflow.com/a/47598159/2001387

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Open page
    console.log("Loading page...")
    await page.goto(
        'https://www.prestocard.ca/en/dashboard/card-activity',
        { waitUntil: 'networkidle2' }
    );

    // Log in
    console.log(`Logging in as '${presto_user}'...`);
    await page.type('input#SignIn_Username', presto_user);
    await page.type('input#SignIn_Password', presto_pass);

    const [response_login] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('button#btnsubmit'),
    ]);

    // Date Range
    // The 'select#Months' element has hardcoded option values.
    // When picking a date, it will add it as option value '6'
    // In the format "<from MM/DD/YYYY> - <to MM/DD/YYYY>"
    //   e.g. "04/01/2019 - 05/08/2019"
    // This creates, sets, adds and selects that option
    // This date string is used by the site for filtering/printing.
    console.log(`Setting date range as '${date_rage}'...`);
    await page.evaluate(({date_rage}) => {
        range_opt = document.createElement('option');
        range_opt.value = 6;
        range_opt.text = date_rage;
        document.querySelector("select#Months").add(range_opt);
        document.querySelector("select#Months").value = 6;
    }, {date_rage});

    // Transaction Type(s)
    // The 'div.overSelect' element when clicked
    // displays a div that contains some checkboxes
    // that each have a value set to the full name
    // of a 'transaction type' (case sensitive!):
    //   * 'ALL'
    //   * 'Loads'
    //   * 'Transit pass loads'
    //   * 'Fare Payment'
    //   * 'Transit pass payment'
    // This selects the desired transaction types.
    // Those checked checkboxes are used by the site
    // for filtering/printing.
    console.log(`Setting transaction types as '${argv.type}'...`);
    await page.click('div.overSelect');
    for (t of argv.type) {
        await page.click(`input[value='${t}']`);
    }

    // Filter
    console.log("Filtering...");
    await page.click('button#buttonCTID13');

    // Print
    console.log("Generating report...");
    await page.click('button#printTHR');

    // Bait and Switch
    // The report is generated in an iframe '#printArea_1'.
    // To make it easier for puppeteer, this replaces the
    // root 'document' with the iframe's 'document', effectively
    // replacing the entire current page with the iframe's contents.
    await page.evaluate(() => {
        report_iframe = document.querySelector("iframe[id=printArea_1]");
        report_document = report_iframe.contentDocument.documentElement;
        document.replaceChild(report_document, document.documentElement);
    });

    // Patch
    // (to mimic css when the iframe is part of the page)
    await page.evaluate(() => {
        document.body.style.fontSize = "medium";
    });

    // Save as PDF
    console.log("Saving PDF...");
    await page.pdf({
        path: pdf_path,
        displayHeaderFooter: true,
        format: 'Letter',
        margin: {
            top: "0.69in",
            right: "0.39in",
            bottom: "0.72in",
            left: "0.38in"
        }
    });

    // Done
    await browser.close();
})();