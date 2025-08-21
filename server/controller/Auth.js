const bcrypt = require('bcrypt')
const User = require('../model/User')
const OTP = require('../model/OTP')
const jwt = require('jsonwebtoken')
const otpGenerator = require('otp-generator')
const Profile = require('../model/Profile')
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");

require("dotenv").config()
// send otp
exports.sendOTP = async (req, res) => {
    try {
        // fetch email and check in db
        const { email } = req.body
        const checkUserPresent = await User.findOne({ email })
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: "User already exists"
            })
        }
        // generate otp
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        })
        // check unique or not
        const result = await OTP.findOne({ otp: otp }) // if yes then not unique
        while (result) {
            otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            })
            result = await OTP.findOne({ otp: otp })
        }
        const otpPayload = {email, otp};

        // db entry
        const otpBody = await OTP.create(otpPayload) // before this mail will be sent check model/otp
        console.log(otpBody)
        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            otp,
        })
    }
    catch (err) {
        console.log(err)
        res.statsu(500).json({
            status: false,
            message: err.message
        })
    }
}

// signup - signup page then verify email page
exports.signUp = async (req, res) => {
    try {
        // fetch data
        const { firstName, lastName, email, password, confirmPassword, accountType, contactNumber, otp } = req.body
        // validations
        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.json({
                success: false,
                message: "All fields are required"
            })
        }
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Passwords mismatched"
            })
        }
        const dbUser = await User.findOne({ email })
        if (dbUser) {
            return res.json({
                success: false,
                message: "User already exists"
            })
        }
        // find most recent otp
        const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1) // sort in descending order and give first value
        if (recentOtp.length == 0) { // checking entry in db
            return res.status(400).json({
                success: false,
                message: "OTP not found"
            })
        } else if (otp !== recentOtp[0].otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        // hash pass
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create the user =========================================================================
		let approved = "";
		approved === "Instructor" ? (approved = false) : (approved = true);

        // store in db
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contact: null
        })
        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType: accountType,
			approved: approved,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}${lastName}`
        })
        res.status(200).json({
            success: true,
            message: "User Registered Successfully"
        })
    }
    catch (err) {
        console.log(err)
        res.statsu(500).json({
            status: false,
            message: "Try Again"
        })
    }
}

// login
exports.login = async (req, res) => {
    try {
        // fetch data
        const { email, password } = req.body
        // validations
        if (!email || !password) { // check filled correctly?
            res.status(400).json({
                success: false,
                message: "Fill email and password correctly"
            })
        }
        // find user data in db
        const user = await User.findOne({ email }).populate("additionalDetails")
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not registered"
            })
        }
        // matching password and generate jwt then send it
        if (await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType
            }
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                {
                    expiresIn: "24h"
                }
            )
            user.password = undefined
            const usertoken = user.toObject()
            usertoken.token = token

            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "User logged in succesfully"
            })
        } else {
            return res.status(401).json({
                success: false,
                message: "Password is incorrect"
            })
        }
    }
    catch (err) {
        console.log(err)
        res.statsu(500).json({
            status: false,
            message: "Try Again"
        })
    }
}
// change pass
exports.changePassword = async (req, res) => {
    try {
		// Get user data from req.user
		const userDetails = await User.findById(req.user.id);

		// Get old password, new password, and confirm new password from req.body
		const { oldPassword, newPassword, confirmNewPassword } = req.body;

		// Validate old password
		const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if (!isPasswordMatch) {
			// If old password does not match, return a 401 (Unauthorized) error
			return res
				.status(401)
				.json({ success: false, message: "The password is incorrect" });
		}

		// Match new password and confirm new password
		if (newPassword !== confirmNewPassword) {
			// If new password and confirm new password do not match, return a 400 (Bad Request) error
			return res.status(400).json({
				success: false,
				message: "The password and confirm password does not match",
			});
		}

		// Update password
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true }
		);

		// Send notification email
		try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
				passwordUpdated(
					updatedUserDetails.email,
					`Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
				)
			);
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			// If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
		}

		// Return success response
		return res
			.status(200)
			.json({ success: true, message: "Password updated successfully" });
	}
    catch (err) {
        console.log(err)
        res.statsu(500).json({
            status: false,
            message: "Try Again"
        })
    }
}