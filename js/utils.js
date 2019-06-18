const moment = require('moment');

/**
 * Calculate date range string the PRESTO Website expect
 * Args:
 *   argv {Object}: the cli arguments
 * Returns:
 *   {String} the date range string
 *     i.e. "<from MM/DD/YYYY> - <to MM/DD/YYYY>"
 *     e.g. "04/01/2019 - 05/08/2019"
 */
module.exports.prestoDateRange = function (argv) {
    if (argv.lastmonth) {
        // Last month range
        from_date = moment().subtract(1, 'months').startOf('month')
        to_date = moment().subtract(1, 'months').endOf('month')
        return `${from_date.format('MM/DD/YYYY')} - ${to_date.format('MM/DD/YYYY')}`
    }
};

/**
 * Emails a PDF using SendGrid
 * https://github.com/sendgrid/sendgrid-nodejs
 * Args:
 *   from {String}: the email receipient
 *   to {String}: the email sending
 *   subject {String}: the subject
 *   pdf_path {String}: path of pdf file to attach
 */
module.exports.emailPdf = function (from, to, subject, pdf_path) {
    const fs = require('fs');
    const path = require('path');
    const sgMail = require('@sendgrid/mail');

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    pdf_file = path.basename(pdf_path);

    const msg = {
        to: to,
        from: from,
        subject: subject,
        text: pdf_file,
        attachments: [{
            // https://stackoverflow.com/a/54119703/2001387
            content: fs.readFileSync(pdf_path, { encoding: 'base64' }),
            filename: pdf_file,
            type: 'application/pdf',
            disposition: 'attachment',
            contentId: pdf_file
        }],
    };
    console.log(`Sending PDF to '${to}'...`)
    sgMail.send(msg);
};