import nodemailer from 'nodemailer';

export const sendRegistrationEmail = async (toEmail, name, activationCode) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"HomelyServ" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Welcome to HomelyServ - Activate Your Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #e0a905; text-align: center;">Welcome to HomelyServ!</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for creating an account with us. Your account registration details are ready.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #e0a905; margin: 20px 0;">
            <p style="margin: 0;"><strong>Username / Email:</strong> ${toEmail}</p>
          </div>
          <p>Please use the following activation code to complete your verification setup:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #e0a905; background: #222; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
            ${activationCode}
          </div>
          <p style="font-size: 12px; color: #777; text-align: center; margin-top: 30px;">
            If you did not sign up for this account, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ Activation code email sent successfully to: ${toEmail}`);
  } catch (error) {
    console.error('❌ Failed to send registration email:', error);
  }
};