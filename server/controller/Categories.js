const Category = require("../model/Categories")
const Course = require("../model/Course")
// admin
// create Category
exports.createCategory = async(req,res)=>{
    try{
        // fetch data and validate
        const {name, description} = req.body
        if(!name || !description){
            res.json({
                success:false,
                message:"All fields are required"
            })
        }
        // insert in db
        const categoryDetails = await Category.create({name:name, description:description})
        console.log(categoryDetails)
        res.json({
                success:true,
                message:"Category created"
            })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            status: false,
            message: err.message
        })
    }
}
// showAllCategory - catalog
// exports.showAllCategories = async(req,res)=>{
//     try{
//         // fetch data and show Categories
//         const allCategories = await Category.find({}, {name:true, description:true})
//         res.json({
//                 success:true,
//                 message:"All categories returned",
//                 data:allCategories
//             })
//     }
//     catch (err) {
//         console.log(err)
//         res.status(500).json({
//             status: false,
//             message: err.message
//         })
//     }
// }
// showAllCategory
exports.showAllCategories = async (req, res) => {
  try {
    const allCategories = await Category.find({}, { name: true, description: true })
      .populate({
        path: "course", // field name in Category schema
        match: { status: "Published" }, // only published courses
        select: "courseName", // select only necessary fields
      })
      .lean();

    // Rename 'course' to 'courses' for frontend consistency
    const formattedCategories = allCategories.map(cat => ({
      ...cat,
      courses: cat.course || [],
    }));

    res.json({
      success: true,
      message: "All categories returned",
      data: formattedCategories
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// categoryPageDetails	
// exports.categoryPageDetails = async (req, res) => {
// 	try {
// 		const { categoryId } = req.body;


// 		// Get courses for the specified category
// 		const selectedCategory = await Category.findById(categoryId)
// 			.populate("course")
// 			.exec();
// 		console.log(selectedCategory);

// 		// Handle the case when the category is not found
// 		if (!selectedCategory) {
// 			console.log("Category not found.");
// 			return res
// 				.status(404)
// 				.json({ success: false, message: "Category not found" });
// 		}
		
// 		// Handle the case when there are no courses
// 		if (selectedCategory.course.length === 0) {
// 			console.log("No courses found for the selected category.");
// 			return res.status(404).json({
// 				success: false,
// 				message: "No courses found for the selected category.",
// 			});
// 		}

// 		const selectedCourses = selectedCategory.course;

// 		// Get courses for other categories
// 		const categoriesExceptSelected = await Category.find({
// 			_id: { $ne: categoryId }, // notequal
// 		}).populate("course").exec();

// 		let differentCourses = [];
// 		for (const category of categoriesExceptSelected) {
// 			differentCourses.push(...category.course);
// 		}

// 		// Get top-selling courses across all categories
// 		const allCategories = await Category.find().populate("course");
// 		const allCourses = allCategories.flatMap((category) => category.course);
// 		const mostSellingCourses = allCourses
// 			.sort((a, b) => b.sold - a.sold)
// 			.slice(0, 10);

// 		res.status(200).json({
// 			selectedCourses: selectedCourses,
// 			differentCourses: differentCourses,
// 			mostSellingCourses: mostSellingCourses,
// 		});
// 	} catch (error) {
// 		return res.status(500).json({
// 			success: false,
// 			message: "Internal server error",
// 			error: error.message,
// 		});
// 	}
// };
exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;

    // Find selected category
    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "course",
        match: { status: "Published" },
        populate: {
          path: "instructor",
          select: "firstName lastName"
        }
      })
      .exec();

    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // Find a different category to show in section 2
    const differentCategory = await Category.findOne({
      _id: { $ne: categoryId }
    })
      .populate({
        path: "course",
        match: { status: "Published" }
      })
      .exec();

    // Get most selling courses (example: sort by students enrolled)
    const mostSellingCourses = await Course.find({ status: "Published" })
      .sort({ studentsEnrolled: -1 })
      .limit(10)
      .exec();

    return res.status(200).json({
      success: true,
      data: {
        selectedCategory: {
          ...selectedCategory.toObject(),
          courses: selectedCategory.course, // rename for frontend
        },
        differentCategory: {
          ...differentCategory.toObject(),
          courses: differentCategory?.course || [],
        },
        mostSellingCourses
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
