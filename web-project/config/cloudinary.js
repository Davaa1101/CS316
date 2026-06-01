const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createStorage = (folder) => new CloudinaryStorage({
  cloudinary,
  params: {
    folder: `barter-platform/${folder}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const createUpload = (folder) => multer({ storage: createStorage(folder) });

module.exports = { createUpload };