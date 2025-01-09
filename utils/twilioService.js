const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID; // Environment variables are typically uppercase
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

const sendOtp = async (phone, otp) => {
  try {
    // Validate inputs
    if (!phone || !otp) {
      throw new Error('Phone and OTP are required');
    }

    // Format phone number
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    const message = await client.messages.create({
      body: `Your OTP is ${otp}.
It is valid for the next 10 minutes.
Please do not share this OTP with anyone.
If you did not request this, contact us at support@paxowealth.com.`,
      to: formattedPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    return message;
  } catch (error) {
    console.error("Twilio Error:", error);
    throw error;
  }
};

module.exports = { sendOtp };