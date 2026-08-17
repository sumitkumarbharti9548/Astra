// utils/sendEmail.js
// npm install resend

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends the password reset email.
 * @param {string} to - recipient email
 * @param {string} resetLink - full URL the user clicks to reset their password
 */
async function sendResetPasswordEmail(to, resetLink) {
  await resend.emails.send({
    // For testing, Resend lets you send from this address without verifying a domain.
    // Once you verify your own domain on Resend, change this to something like
    // "Student Notes Hub <noreply@studentnoteshub.com>"
    from: 'Student Notes Hub <onboarding@resend.dev>',
    to,
    subject: 'Reset your Student Notes Hub password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
        <h2 style="color:#7c5cff;margin-bottom:8px">Reset your password</h2>
        <p>We received a request to reset the password for your Student Notes Hub account.</p>
        <p>Click the button below to choose a new password. This link expires in 30 minutes.</p>
        <a href="${resetLink}"
           style="display:inline-block;margin:20px 0;padding:12px 24px;background:#7c5cff;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          Reset Password
        </a>
        <p style="color:#666;font-size:13px">
          If you didn't request this, you can safely ignore this email — your password will not change.
        </p>
        <p style="color:#999;font-size:12px;margin-top:24px">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${resetLink}
        </p>
      </div>
    `,
  });
}

module.exports = { sendResetPasswordEmail };