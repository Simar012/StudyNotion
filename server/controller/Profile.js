const Profile = require('../model/Profile')
const { uploadImageToCloudinary } = require('../utils/imageUploader')
const User = require('../model/User')
const { convertSecondsToDuration } = require("../utils/secToDuration");
const Course = require("../model/Course");
const CourseProgress = require("../model/CourseProgress");

// updateProfile
exports.updateProfile = async (req, res) => {
  try {
    // get data and userId
    const { gender, dateOfBirth = "", about = "", contactNumber } = req.body
    const id = req.user.id
    // validations
    if (!contactNumber || !gender || !id) {
      res.status(400).json({
        success: false,
        message: "Missing proper properties"
      })
    }
    // find and update profile
    const userDetails = await User.findById(id)
    const profileId = userDetails.additionalDetails
    const profileDetails = await Profile.findById(profileId)

    profileDetails.dateOfBirth = dateOfBirth,
      profileDetails.about = about,
      profileDetails.gender = gender,
      profileDetails.contactNumber = profileDetails

    await profileDetails.save() // object is already there so we used this method

    return res.status(200).json({
      success: true,
      message: "Profile updated",
      profileDetails
    })
  }
  catch (err) {
    console.log(err)
    res.status(500).json({
      success: false,
      message: "Unable to update"
    })
  }
}

// deleteAccount
exports.deleteAccount = async (req, res) => {
  try {
    // get id and validations
    const id = req.user.id
    const userDetails = await User.findById(id)
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "User not found"
      })
    }
    // delete profile
    const profileDetails = await Profile.findByIdAndDelete(
      { _id: userDetails.additionalDetails }
    )
    // delete user
    await User.findByIdAndDelete({ _id: id })

    return res.status(200).json({
      success: true,
      message: "Account deleted",
      profileDetails
    })
  }
  catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: "Unable to delete"
    })
  }
}

// getAllUserDetails
exports.getAllUserDetails = async (req, res) => {
  try {
    // get id and validations
    const id = req.user.id
    const userDetails = await User.findById(id).populate("additionalDetails").exec()

    return res.status(200).json({
      success: true,
      message: "Data fetched",
      userDetails
    })
  }
  catch (err) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch"
    })
  }
}

//updateDisplayPicture
exports.updateDisplayPicture = async (req, res) => {
  try {
    console.log("req.files:", req.files);
    console.log("req.user:", req.user);

    const displayPicture = req.files.displayPicture
    const userId = req.user.id
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    )
    console.log(image)
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    )
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    })
  } catch (error) {
    console.error("ERROR in updateDisplayPicture:", error);
    return res.status(500).json({
      success: false,
      message: "Error in contoller/Profile.updateDisplayPicture",
    })
  }
}

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec()
    userDetails = userDetails.toObject()
    var SubsectionLength = 0
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0
      SubsectionLength = 0
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        )
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length
      }
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      })
      courseProgressCount = courseProgressCount?.completedVideos.length
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2)
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier
      }
    }

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      })
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id });

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnrolled.length
      const totalAmountGenerated = totalStudentsEnrolled * course.price;

      // create a new object with the additional fields

      const courseDatawithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDesc: course.courseDescription,
        totalStudentsEnrolled,
        totalAmountGenerated,
      }
      return courseDatawithStats
    })
    res.status(200).json({ courses: courseData })
  }
  catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error"
    })
  }
}