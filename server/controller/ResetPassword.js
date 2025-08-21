// In this file, in first function we will fetch email and find user details for validations. Then we generated token and stored in User db with expiration time (which we will use in second function to find user details and update Pass). Then we sent a frontend link with token on email.
// In second function we fetched pass, confirmPass, token and find user details for validations, checked expiry time then hashed the password and updated in User Db

const User = require('../model/User')
const mailSender = require('../utils/mailSender')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
// resetPasswordToken - generate front end link with token and send email
exports.resetPasswordToken = async(req,res)=>{
    try{
        // fetch email
        const email = req.body.email
        // check user
        const user = await User.findOne({email: email})
        if(!user){
            return res.json({
                success: false,
                message: "Email not registered with us"
            })
        }
        // generate token - for uniqueness
        const token = crypto.randomBytes(20).toString("hex"); // will generate token
        // add token with expiry in db
        const updateDetails = await User.findOneAndUpdate( // store this for finding user data through token while resetting pass 
            {email:email},
            {
                token:token,
                resetPasswordExpires:Date.now()+ 5*60*1000
            },
            {new:true}
        )

        const url = `http://localhost:3000/update-password/${token}`
        // send email
        await mailSender(email,"Password reset link ", `Password reset link ${url}`)
        return res.json({
                success: true,
                message: "Email sent"
            })
    }
    catch (err) {
        console.log(err)
        res.statsu(500).json({
            status: false,
            message: "Something went wrong"
        })
    }
}
// resetPassword
exports.resetPassword = async(req,res)=>{
    try{
        // fetch email
        const {token, password, confirmPassword} = req.body
        //validations
        if(password != confirmPassword){
            return res.json({
                success: false,
                message: "Wrong Password"
            })
        }
        const userDetails = await User.findOne({token:token})
        if(!userDetails){
            return res.json({
                success: false,
                message: "Token is invalid"
            })
        }
        // time check
        if(userDetails.resetPasswordExpires < Date.now()){
            return res.json({
                success: false,
                message: "Token is Expired"
            })
        }
        // hash pass
        const hashPass = await bcrypt.hash(password,10)
        await User.findOneAndUpdate(
            {token:token},
            {password:hashPass},
            {new:true}
        )
        return res.status(200).json({
                success: true,
                message: "Password changed"
            })
    }
    catch (err) {
        console.log(err)
        res.statsu(500).json({
            status: false,
            message: "Something went wrong"
        })
    }
}