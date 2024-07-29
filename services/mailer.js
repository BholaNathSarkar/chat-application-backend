const nodemailer = require("nodemailer");
require("dotenv").config();

let transporter = nodemailer.createTransport({
  host: "SMTP.gmail.com", // SMTP server address (usually mail.your-domain.com)
  port: 465, // Port for SMTP (usually 465)
  secure: true, // Usually true if connecting to port 465
  auth: {
    user: process.env.USER, // Your email address
    pass: process.env.APP_PASSWORD, // Password (for gmail, your app password)
   
  },
});

exports.sendEmail = async ({ to, from, subject, html, text, attachment }) => {

  try {
    const msg = {
      from: {
        name: "chat app",
        address: from, 
      },
      to: to,
      subject: subject,
      text: text,
      html: html,
      attachments: attachment, 
    };

    await transporter.sendMail(msg);
  } catch (error) {
    console.log(error);
  }
};

