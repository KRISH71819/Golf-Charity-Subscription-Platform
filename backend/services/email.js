import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const from = process.env.EMAIL_FROM || 'FairwayGives <noreply@fairwaygives.com>'

/**
 * Send a welcome email after signup
 */
export async function sendWelcome(to, name) {
  return transporter.sendMail({
    from,
    to,
    subject: 'Welcome to FairwayGives! ⛳',
    html: `
      <div style="font-family:'Inter',sans-serif;max-width:560px;margin:auto;padding:32px;">
        <h1 style="color:#1a1a1a;">Welcome, ${name}!</h1>
        <p>Your FairwayGives subscription is active. Start entering your Stableford scores
           and every round you play makes a real difference for charity.</p>
        <p><strong>What's next:</strong></p>
        <ul>
          <li>Enter your first round score</li>
          <li>Choose your supported charity</li>
          <li>Get entered in the monthly prize draw</li>
        </ul>
        <p style="color:#777;font-size:13px;">— The FairwayGives Team</p>
      </div>
    `,
  })
}

/**
 * Send draw results notification
 */
export async function sendDrawResults(to, name, { tier, prizeAmount, drawnNumbers }) {
  return transporter.sendMail({
    from,
    to,
    subject: `🏆 You won the ${tier} draw!`,
    html: `
      <div style="font-family:'Inter',sans-serif;max-width:560px;margin:auto;padding:32px;">
        <h1 style="color:#1a1a1a;">Congratulations, ${name}!</h1>
        <p>You matched in the <strong>${tier}</strong> tier.</p>
        <p style="font-size:24px;color:#b87333;font-weight:700;">Prize: $${prizeAmount.toFixed(2)}</p>
        <p>Drawn numbers: <strong>${drawnNumbers.join(', ')}</strong></p>
        <p>Please verify your winning scores within 7 days to claim your prize.</p>
        <p style="color:#777;font-size:13px;">— The FairwayGives Team</p>
      </div>
    `,
  })
}

/**
 * Send winner verification request
 */
export async function sendVerificationRequest(to, name) {
  return transporter.sendMail({
    from,
    to,
    subject: 'Action Required: Verify Your Winning Scores',
    html: `
      <div style="font-family:'Inter',sans-serif;max-width:560px;margin:auto;padding:32px;">
        <h1 style="color:#1a1a1a;">Score Verification Needed</h1>
        <p>Hi ${name}, please upload proof of your scorecard to complete winner verification.</p>
        <p>Log in to your dashboard and navigate to the Verification page.</p>
        <p style="color:#777;font-size:13px;">— The FairwayGives Team</p>
      </div>
    `,
  })
}

export default transporter
