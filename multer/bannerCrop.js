const sharp = require('sharp');

const cropBannerImage = async (inputFilePath, outputFilePath) => {
  try {
    await sharp(inputFilePath)
      .resize(2000, 1000)
      .toFile(outputFilePath);
  } catch (error) {
    throw error;
  }
};

module.exports = { cropBannerImage };
