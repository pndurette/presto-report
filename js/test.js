const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    console.log("Loading page...")
    await page.goto('https://www.prestocard.ca/en/dashboard/card-activity', { waitUntil: 'networkidle2' });

    console.log("Logging in...")
    await page.type('#SignIn_Username', process.env.PRESTO_USER)
    await page.type('#SignIn_Password', process.env.PRESTO_PASS)

    const [response_login] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('#btnsubmit'),
    ]);

    // Date Range
    // The 'select#Months' element has fixed option values
    // When picking a date, it will add it as option value '6'
    // In the format "<from MM/DD/YYYY> - <to MM/DD/YYYY>"
    //   e.g. "04/01/2019 - 05/08/2019"
    // This creates, sets, adds and selects that option
    console.log("Setting date...")
    await page.evaluate(() => {
        the_range = document.createElement('option')
        the_range.value = 6
        the_range.text = "05/01/2019 - 05/31/2019"
        document.querySelector("select#Months").add(the_range)
        document.querySelector("select#Months").value = 6
    });

    // Transaction Type(s)
    // The 'input#hdnTypes' element is set to: 
    //  * "0" (all transaction types), or
    //  * a csv string of transaction type values:
    //      - Loads: 1
    //      - Transit pass loads: 2
    //      - Fare Payment: 3
    //      - Transit pass payment: 4
    //    e.g. "1,2" for 'Loads' and 'Transit pass loads'
    console.log("Setting transaction types...")
    await page.evaluate(() => {
        document.querySelector("#hdnTypes").innerText = "1,2"
    });



    console.log("Saving PDF...")
    await page.pdf({ path: 'js/hn.pdf', format: 'A4' });
    await browser.close();
})();