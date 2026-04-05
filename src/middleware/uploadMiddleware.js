const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sarroz/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(file.mimetype);
  
  if (extname) {
    return cb(null, true);
  }
  
  cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: fileFilter
});

// Middleware for single image upload
const uploadSingleImage = upload.single('image');

// Middleware for multiple images upload (max 5)
const uploadMultipleImages = upload.array('images', 5);

module.exports = {
  uploadSingleImage,
  uploadMultipleImages
};
