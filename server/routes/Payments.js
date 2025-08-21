// Import the required modules
const express = require("express")
const router = express.Router()

const { capturePayment, verifyPayment, sendPaymentSuccessEmail } = require("../controller/Payments")
const { auth, isInstructor, isStudent, isAdmin } = require("../middleware/auth")
router.post("/capturePayment", auth, isStudent, capturePayment)
router.post("/verifyPayment",auth, isStudent, verifyPayment)
router.post("/sendPaymentSuccessEmail", auth, isStudent, sendPaymentSuccessEmail);

module.exports = router



// Import the required modules
// const express = require("express")
// const router = express.Router()

// const { capturePayment, verifySignature } = require("../controller/Payments")
// const { auth, isInstructor, isStudent, isAdmin } = require("../middleware/Auth")
// router.post("/capturePayment", auth, isStudent, capturePayment)
// router.post("/verifySignature", verifySignature)

// module.exports = router