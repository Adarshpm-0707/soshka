import nodemailer from 'nodemailer';

const host = 'smtp.gmail.com';
const port = 587;
const user = 'soshka.in@gmail.com';
const pass = 'qqpw ahvd rlcy aekk';

console.log('Initializing transporter...');
const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false,
  auth: {
    user,
    pass,
  },
  tls: {
    rejectUnauthorized: false
  }
});

const mailOptions = {
  from: `"Sõshka Jewellery" <${user}>`,
  to: 'soshka.in@gmail.com',
  subject: 'Test Email from Soshka Store',
  text: 'Hello, this is a test email to verify SMTP configuration!'
};

console.log('Sending test email...');
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('SMTP sending error:', error);
  } else {
    console.log('Email sent successfully:', info.response);
  }
});
