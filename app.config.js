const { expo } = require('./app.json');

const isEnabled = String(process.env.OTP_TEST_LOGIN_ENABLED || 'true').toLowerCase() === 'true';

module.exports = () => ({
  ...expo,
  extra: {
    ...(expo.extra || {}),
    playStoreReview: {
      enabled: isEnabled,
      reviewerEmail: process.env.OTP_TEST_LOGIN_EMAIL || 'test@grovine.ng',
      reviewerName: process.env.OTP_TEST_LOGIN_NAME || 'Product Tester',
      reviewerOtp: process.env.OTP_TEST_LOGIN_CODE || 55555,
    },
  },
});
