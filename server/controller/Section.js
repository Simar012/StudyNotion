// I created course, then created section(courseContent), then i have to update the Course schema
// same for sub section - there are multiple section and each section have multiple sub-section
const Section = require('../model/Section')
const subSection = require('../model/SubSection')
const Course = require('../model/Course')

// createSection
exports.createSection = async (req, res) => {
    try {
        // fetch data and validations
        const { sectionName, courseId } = req.body
        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Missing proper properties"
            })
        }

        // create section and update in course schema
        const newSection = await Section.create({ sectionName })
        const courseinfo = await Course.findByIdAndUpdate(
            courseId,
            {
                $push: { courseContent: newSection._id }
            }, { new: true }
        )
            // will populate courseContent(which is in Course) and then populate subSection(which is in Course)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                    model: "subSection",
                },
            })
            .exec();

        return res.status(200).json({
            success: true,
            message: "Section Created",
            courseinfo
        })
    }
    catch (err) {
        console.error("Error in createSection:", err); // 🐞 Log the actual error
        return res.status(500).json({
            success: false,
            message: "Unable to create section",
            error: err.message, // Optionally send back the error for debugging
        });
    }
}
// updateSection
exports.updateSection = async (req, res) => {
    try {
        const { updatedName, sectionId, courseId } = req.body
        if (!updatedName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "Missing proper properties"
            })
        }
        // Update the section name
        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            { sectionName: updatedName },
            { new: true }
        );
        console.log("Updated Section:", updatedSection);

        // Fetch the updated course with full populate
        const updatedCourse = await Course.findById(courseId)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            });
        console.log("Fetched Course:", updatedCourse);

        if (!updatedCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Section updated",
            data: updatedCourse,
        });
    } catch (err) {
        console.error("❌ Error in updateSection:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error while updating section",
            error: err.message,
        });
    }
};

// deleteSection
// exports.deleteSection = async (req, res) => {
//     try {
//         // const {sectionId} = req.body
//         const { sectionId } = req.params
//         await Section.findByIdAndDelete(
//             sectionId,
//         )
//         res.status(200).json({
//             success: true,
//             message: "Section deleted",
//         })
//     }
//     catch (err) {
//         res.status(500).json({
//             success: false,
//             message: "Unable to delete section"
//         })
//     }
// }
exports.deleteSection = async (req, res) => {
    try {
        const { sectionId, courseId } = req.body;

        if (!sectionId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Missing sectionId or courseId",
            });
        }

        // ✅ Find section to get its subSection IDs
        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found",
            });
        }

        const subSectionIds = section.subSection;

        // ✅ Delete all related subSections
        await subSection.deleteMany({ _id: { $in: subSectionIds } });

        // ✅ Delete the section itself
        await Section.findByIdAndDelete(sectionId);

        // Remove from course
        await Course.findByIdAndUpdate(courseId, {
            $pull: { courseContent: sectionId },
        });

        // ✅ Fetch updated course
        const updatedCourse = await Course.findById(courseId)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            });

        return res.status(200).json({
            success: true,
            message: "Section deleted",
            data: updatedCourse,  // ✅ Send updated course
        });
    } catch (err) {
        console.error("Delete section error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
