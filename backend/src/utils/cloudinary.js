const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: 'dyvtslk6u',
  api_key: '128863751431449',
  api_secret: 'JLHqJ8jlx2uOCxDqF6L4aS35ukE'
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'homelyserv/payments',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto'
  }
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };