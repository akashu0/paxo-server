const twilio = require('twilio');
const accountSid = process.env.Twilio_Account_SID; // Your Twilio account SID
const authToken = process.env.Twilio_Auth_Token; // Your Twilio Auth Token
const client = new twilio(accountSid, authToken);

const sendOtp = (phone, otp) => {
  if (!phone.startsWith('+')) {
    phone = `+91${phone}`;
  }
  return client.messages.create({
    body: `Your OTP is ${otp}.
     It is valid for the next 10 minutes.
      Please do not share this OTP with anyone. If you did not request this, contact us at support@paxowealth.com.`,
    to: phone, // Text this number
    from: process.env.TWILIO_PHONE_NUMBER
  });
};

module.exports = { sendOtp };
