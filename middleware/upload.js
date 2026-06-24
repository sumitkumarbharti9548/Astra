// middleware/upload.js — handles file uploads using multer
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Make sure the uploads folder exists on startup
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created uploads folder at public/uploads');
}

// Store files on disk with unique names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // e.g. 1716900000000-492831-notes.pdf
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Only allow these file types
const fileFilter = (req, file, cb) => {
  const allowed = /\.(pdf|jpg|jpeg|png|gif|webp|mp4|webm)$/i;
  if (allowed.test(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Use PDF, Image, or Video files.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024 // default 50 MB
  }
});

module.exports = upload;
