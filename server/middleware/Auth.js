const jwt = require('jsonwebtoken')
const User = require('../model/User')
require('dotenv').config()

// auth
exports.auth = async (req, res, next) => {
    try {
        // fetch token from req and verify token
        const token = req.body?.token || req.cookies?.token || req.header("Authorization").replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token missing"
            })
        }
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET)
            req.user = decode
        }
        catch (err) {
            return res.status(401).json({
                success: false,
                mesage: "token invalid"
            })
        }
        next() // next middleware
    }
    catch (error) {
        console.log("ERROR in auth middleware:", error.message)
        return res.status(401).json({
            success: false,
            mesage: "Error in auth",
        })
    }
}
// isStudent
exports.isStudent = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Student") {
            return res.status(400).json({
                success: false,
                mesage: "Protected Route for Student"
            })
        }
        next() // next middleware
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            mesage: "User role is not matching"
        })
    }
}
// isInstructor
exports.isInstructor = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Instructor") {
            console.log("isInstructor: not an instructor");
            return res.status(403).json({
                success: false,
                message: "Protected route. Only accessible to instructors.",
            });
        }
        next(); // Only called if accountType is Instructor
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error verifying user role",
        });
    }
};

// isAdmin
exports.isAdmin = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Admin") {
            return res.status(400).json({
                success: false,
                mesage: "Protected Route for Admin"
            })
        }
        next() // next middleware
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            mesage: "User role is not matching"
        })
    }
}