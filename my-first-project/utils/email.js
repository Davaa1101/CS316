const { validateEmail, validatePhone, validatePassword } = require('./validators');

describe('Email Validation Tests', () => {
  test('Зөв и-мэйл хаяг', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.mn')).toBe(true);
  });

  test('Буруу и-мэйл хаяг', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  test('Null эсвэл undefined', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });
});

describe('Phone Validation Tests', () => {
  test('Зөв утасны дугаар (8 орон)', () => {
    expect(validatePhone('99112233')).toBe(true);
    expect(validatePhone('88445566')).toBe(true);
  });

  test('Буруу утасны дугаар', () => {
    expect(validatePhone('1234')).toBe(false);
    expect(validatePhone('abcd1234')).toBe(false);
    expect(validatePhone('')).toBe(false);
  });
});

describe('Password Validation Tests', () => {
  test('Зөв нууц үг (8+ тэмдэгт)', () => {
    expect(validatePassword('Password123')).toBe(true);
    expect(validatePassword('SecurePass!@#')).toBe(true);
  });

  test('Богино нууц үг', () => {
    expect(validatePassword('Pass1')).toBe(false);
    expect(validatePassword('1234567')).toBe(false);
  });

  test('Хоосон нууц үг', () => {
    expect(validatePassword('')).toBe(false);
    expect(validatePassword(null)).toBe(false);
  });
});const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send verification email
const sendVerificationEmail = async (email, name, verificationUrl) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Barter Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Email хаягаа баталгаажуулна уу',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Сайн байна уу ${name}!</h2>
        <p>Barter Platform-д тавтай морилно уу!</p>
        <p>Email хаягаа баталгаажуулахын тулд доорх товч дээр дарна уу:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Email баталгаажуулах
          </a>
        </div>
        <p>Эсвэл доорх холбоосыг хуулж хөтчид буулгана уу:</p>
        <p style="word-break: break-all; color: #666;">
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
        <p style="color: #666; font-size: 12px;">
          Энэ холбоос 24 цагийн дотор дуусах болно.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Barter Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Нууц үг сэргээх хүсэлт',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Сайн байна уу ${name}!</h2>
        <p>Та нууц үгээ сэргээх хүсэлт илгээсэн байна.</p>
        <p>Шинэ нууц үг тохируулахын тулд доорх товч дээр дарна уу:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Нууц үг сэргээх
          </a>
        </div>
        <p>Эсвэл доорх холбоосыг хуулж хөтчид буулгана уу:</p>
        <p style="word-break: break-all; color: #666;">
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #666; font-size: 12px;">
          Энэ холбоос 1 цагийн дотор дуусах болно.
        </p>
        <p style="color: #666; font-size: 12px;">
          Хэрэв та нууц үг сэргээх хүсэлт илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send notification email
const sendNotificationEmail = async (email, name, subject, message) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Barter Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Сайн байна уу ${name}!</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          ${message}
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Энэ имэйлийг Barter Platform-аас илгээсэн болно.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send offer notification
const sendOfferNotification = async (email, name, itemTitle, offerMessage) => {
  const message = `
    <p>Таны "${itemTitle}" зар дээр шинэ санал ирлээ!</p>
    <p><strong>Санал:</strong> ${offerMessage}</p>
    <p>Дэлгэрэнгүй мэдээллийг платформ дээрээс үзнэ үү.</p>
  `;
  
  await sendNotificationEmail(email, name, 'Шинэ бартер санал ирлээ', message);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
  sendOfferNotification
};