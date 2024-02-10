const sharp = require("sharp");
const fs = require("fs");

module.exports = {
  crop: async (req) => {
    console.log("call comes to prodImageCrop");
    if (req.files && req.files.length > 0) {
      // Check if req.files is defined and has elements
      for (let i = 0; i < req.files.length; i++) {
        const inputFilePath = req.files[i].path;

        try {
          const processedImageBuffer = await sharp(inputFilePath)
            .resize(800, 800, {
              // Set your desired HD dimensions
              kernel: sharp.kernel.lanczos3, // Use a high-quality resampling algorithm
              fit: "inside", // Maintain the aspect ratio and fit inside the specified dimensions
              position: "right top",
            })
            .toBuffer();

          fs.writeFileSync(inputFilePath, processedImageBuffer);

          console.log(
            "In prodImageCrop::Image cropped and saved successfully to ",
            inputFilePath
          );
        } catch (error) {
          console.log(
            "Error while cropping and saving the image in prodImageCrop:",
            error
          );
        }
      }
    } else {
      console.log("No files to process in prodImageCrop");
    }
  },
};
