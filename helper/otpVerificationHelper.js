const accountSid = "ACa5c28721228a0cea1bbe5e22fb9fb9a1"
const authToken = "e7fad788963ed3073d0a1ce170ca2b1b"
const verifySid = "VAb6ba54e0329a5902aaacef3eca0f5c69"
const client = require("twilio") (accountSid, authToken)
//const client = require("twilio")(process.env.ACCOUNTSID, process.env.AUTHTOKEN);
module.exports.sendotp = (phonenumber, callback) => {
  client.verify.v2
    .services(process.env.verifySid)
    .verifications.create({ to: phonenumber, channel: "whatsapp" })
    .then((verification) => callback(verification.status))
    .catch((verification) => callback(verification.status));
};
module.exports.verifyotp = (phonenumber, otpCode, callback) => {
  client.verify.v2
    .services(process.env.verifySid)
    .verificationChecks.create({ to: phonenumber, code: otpCode })
    .then((verification_check) => callback(verification_check.status))
    .catch((verification_check) => callback(verification_check.status));
};
