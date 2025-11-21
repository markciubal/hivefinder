import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function verifyMailer() {
  try {
    await transporter.verify();
    console.log('SMTP ready');
  } catch (e) {
    console.error('SMTP verify failed:', e.message);
  }
}

export async function sendResetEmail(to, token) {
  const resetUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/newPassword?token=${token}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.4">
      <h2>Password reset</h2>
      <p>Click the button to set a new password. Link expires in 15 minutes.</p>
      <p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#14532d;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">
          Set new password
        </a>
      </p>
      <p>Or paste this URL:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'HiveFinder password reset',
    html,
  });
}
