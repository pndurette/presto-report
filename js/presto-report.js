const puppeteer = require('puppeteer');
const argv = require('yargs')
    .usage('$0 [args]', 'Generate PRESTO card activity reports')
    .option('f', {
        alias: 'file',
        demandOption: true,
        default: '/etc/passwd',
        describe: 'x marks the spot',
        type: 'string'
    })
    .help()
    .version()
    .argv

process.exit()

// Login credentials
presto_user = process.env.PRESTO_USER
presto_pass = process.env.PRESTO_PASS

// Report parameters
date  = '06/01/2019 - 06/30/2019';
types = ['Loads', 'Transit pass loads'];

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
    console.log(`Setting date range as '${date}'...`);
    await page.evaluate(({date}) => {
        the_range = document.createElement('option');
        the_range.value = 6;
        the_range.text = date;
        document.querySelector("select#Months").add(the_range);
        document.querySelector("select#Months").value = 6;
    }, {date});

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
    console.log(`Setting transaction types as '${types}'...`);
    await page.click('div.overSelect');
    for (t of types) {
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