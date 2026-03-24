// utils/mailer.js — Mock Email Utility · ResumeIQ v3.0
const fs = require('fs');
const path = require('path');

/**
 * Mocks sending an email by logging it to the console and appending to a dev log file.
 */
function sendStatusEmail(to, candidateName, jobTitle, company, status, extraDetails = '') {
  const subject = `Update on your application for ${jobTitle} at ${company}`;
  let message = `Hi ${candidateName},\n\nYour application for the ${jobTitle} role at ${company} has been updated to: ${status.toUpperCase()}.\n`;
  
  if (extraDetails) {
    message += `\nDetails:\n${extraDetails}\n`;
  }
  
  message += `\nBest regards,\nThe ResumeIQ Team`;

  const emailLog = `
========================================
[EMAIL SENT]
To: ${to}
Date: ${new Date().toISOString()}
Subject: ${subject}
----------------------------------------
${message}
========================================
\n`;

  // Log to console
  console.log(emailLog);

  // Append to email.log file
  try {
    const logPath = path.join(__dirname, '../../email.log');
    fs.appendFileSync(logPath, emailLog);
  } catch (e) {
    console.error("Failed to write to email mock log", e);
  }
}

module.exports = {
  sendStatusEmail
};
