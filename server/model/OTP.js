const mongoose = require('mongoose')
const mailSender = require('../utils/mailSender')
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
    },
    otp:{
        type: String,
        required: true,
    },
    createdAt:{
        type: Date,
        default: Date.now,
        expires: 5*60 // 5mins
    },
})

async function sendVerificationEmail(email, otp){
    try{ // /utils
        const mailResponse = mailSender(email, "Verification email from StudyNotion", emailTemplate(otp)) 
        console.log("Email sent ",mailResponse) 
    }
    catch(err){
        console.log(err)
    }
}

//  next is a function that Mongoose gives you. You are expected to call next() when your async logic is finished — so that Mongoose knows it can continue the save process.
OTPSchema.pre("save", async function(next){
    // Only send an email when a new document is created
	if (this.isNew) {
        await sendVerificationEmail(this.email, this.otp) // current obj email and otp
    }
    next() // passes control to the next middleware or function
})

module.exports = mongoose.model("OTP", OTPSchema)