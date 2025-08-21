const cloudinary = require('cloudinary').v2
require("dotenv").config()

exports.uploadImageToCloudinary = async(file, folder, height, quality)=>{
    const fileName = file.name.split('.').slice(0,-1).join()
    const options = {
        folder,
        public_id: `${fileName} + ${Date.now()}`,
        resource_type: 'auto'
    }
    if(height){
        options.height = height
    }
    if(quality){
        options.quality = quality
    }
    return await cloudinary.uploader.upload(file.tempFilePath, options)
}