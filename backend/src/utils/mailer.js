import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send a styled OTP verification email to a user.
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} fullName - Recipient's full name for personalization
 */
export const sendOtpEmail = async (toEmail, otp, fullName = 'Patient') => {
    const mailOptions = {
        from: `"UCC Eye Clinic – OptiFlow" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Your OptiFlow Email Verification Code',
        text: `Hello ${fullName},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n– UCC Eye Clinic OptiFlow Team`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#F4F7F5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;border:1px solid #e2e8f0;overflow:hidden;max-width:95%;">
          <tr>
            <td style="background:linear-gradient(135deg,#27AE60 0%,#6FCF97 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-block;width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;line-height:52px;font-size:28px;margin-bottom:12px;">&#128065;</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">UCC Eye Clinic</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:500;">OptiFlow Patient Portal</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 6px;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email Verification</p>
              <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;font-weight:800;">Hello, ${fullName}</h2>
              <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.6;">
                To complete your account registration with <strong>OptiFlow</strong>, please use the verification code below.
                This code is valid for <strong>10 minutes</strong>.
              </p>
              <div style="background:#F4F7F5;border:2px dashed #6FCF97;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Your Verification Code</p>
                <p style="margin:0;font-size:42px;font-weight:900;color:#27AE60;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</p>
              </div>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">
                Do not share this code with anyone. OptiFlow staff will never ask for your OTP.
              </p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;" />
              <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">
                If you did not request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${toEmail}`);
};
