const cron = require('node-cron');
const nodemailer = require('nodemailer');
const axios = require('axios');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'madjes2519@gmail.com',
    pass: 'ahon yrkv ujob udtz'
  }
});

// Run every week on Sunday at 00:00: '0 0 * * 0'
cron.schedule('0 0 * * 0', async () => {
    console.log("Running weekly expense report cron job...");
    try {
        const summaryMsg = "Your weekly Finance Summary is ready! This is an automated report of your tracked expenses. Keep striving for your financial goals.";
        
        await transporter.sendMail({
            from: '"FinTrack Alerts" <madjes2519@gmail.com>',
            to: "madjes2519@gmail.com",
            subject: "Your Weekly Expense Report from FinTrack",
            text: summaryMsg,
            html: `<h3>Weekly Expense Report</h3><p>${summaryMsg}</p><p>Check your dashboard for comprehensive insights!</p>`
        });
        console.log("Weekly expense report sent successfully.");
    } catch (e) {
        console.error("Failed to send weekly email", e);
    }
});

console.log("Weekly node-cron initialized for email reports.");
