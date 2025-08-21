const Subsection = require('../model/SubSection')
const Section = require('../model/Section')
const Course = require('../model/Course')
const { uploadImageToCloudinary } = require('../utils/imageUploader')

// createSubsection
exports.createSubsection = async (req, res) => {
    try {
        // fetch data and validations
        const { sectionId, title, timeduration, description } = req.body
        const video = req.files.videoFile
        console.log("Uploaded file:", video);

        if (!sectionId || !title || !description || !video) {
            return res.status(400).json({
                success: false,
                message: "Missing proper properties"
            })
        }
        // upload
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME)
        // db entry
        const newSubSection = await Subsection.create(
            { title, timeduration, description, videoUrl: uploadDetails.secure_url }
        )
        // update section
        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            { $push: { subSection: newSubSection._id } }, { new: true }
        ).populate("subSection")
        return res.status(200).json({
            success: true,
            message: "Sub Section Created",
            updatedSection
        })
    }
    catch (err) {
        console.error("Error in createSubsection:", err);
        res.status(500).json({
            success: false,
            message: "Unable to create Sub Section",
            error: err.message,
        });
    }
}

// updateSubSection
exports.updateSubSection = async (req, res) => {
    try {
        const { subSectionId, title, timeduration, description, courseId } = req.body
        if (!subSectionId) {
            return res.status(400).json({
                success: false,
                message: "subSectionId is required",
            })
        }
        const updateData = {
            title,
            timeduration,
            description,
        };
        if (req.files && req.files.videoFile) {
            const video = req.files.videoFile;

            const uploadDetails = await uploadImageToCloudinary(
                video,
                process.env.FOLDER_NAME
            );

            updateData.videoUrl = uploadDetails.secure_url;
        }
        const updateSubSection = await Subsection.findByIdAndUpdate(
            subSectionId,
            updateData,
            { new: true }
        )

        // ✅ Fetch and return the full updated course
        const updatedCourse = await Course.findById(courseId)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec();

        return res.status(200).json({
            success: true,
            message: "Sub section updated successfully",
            data: updatedCourse, // ✅ send full course back
        });
    }
    catch (err) {
        console.error("Error in updateSubSection:", err)
        return res.status(500).json({
            success: false,
            message: "Unable to update Sub section"
        })
    }
}

// deleteSubSection
// controllers/SubSection.js

exports.deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId, courseId } = req.body;

    // Validate input
    if (!subSectionId || !sectionId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: subSectionId, sectionId, or courseId",
      });
    }

    // 1. Delete the subsection
    const deletedSubSection = await Subsection.findByIdAndDelete(subSectionId);
    if (!deletedSubSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }

    // 2. Remove reference from section
    await Section.findByIdAndUpdate(sectionId, {
      $pull: { subSection: subSectionId },
    });

    // 3. Get updated course
    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    // 4. Send response
    return res.status(200).json({
      success: true,
      message: "Sub section deleted",
      data: updatedCourse,
    });

  } catch (err) {
    console.error("DELETE SUBSECTION ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to delete Sub section",
    });
  }
};
