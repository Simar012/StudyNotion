const mongoose = require('mongoose')

const categoriesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    course: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
    }],
})

module.exports = mongoose.model("Category", categoriesSchema)