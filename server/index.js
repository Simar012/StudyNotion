const express = require('express')
const app = express();

require('dotenv').config()
const PORT = process.env.PORT || 4000

app.use(express.json())
const cookieParser = require('cookie-parser')
app.use(cookieParser());

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");

const {dbconnect} = require("./config/database")
const {cloudinaryConnect} = require("./config/cloudinary")
const cors = require('cors')
const fileupload = require('express-fileupload')

dbconnect();

app.use(cors({
    origin: ["http://localhost:3000","https://studynotion-v2.netlify.app/"],
    credentials: true,
}))

app.use(fileupload({
    useTempFiles: true, // this will save the file in temp path, then cloudinary.uploader.upload() will read    
    tempFileDir: '/tmp/' // file from disk and save it to cloudinary
}));

cloudinaryConnect()

// routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);

// default route
app.get("/", (req, res) => {
    return res.json({
        success: true,
        message: "Your server is up and running...."
    });
});

app.listen(PORT, () => {
    console.log(`App is running at ${PORT}`);
});
