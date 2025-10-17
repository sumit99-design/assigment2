const express = require('express');
const { body, validationResult, check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('uploads')); // Serve uploaded files statically

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per file
});

// Registration route (GET)
app.get('/register', (req, res) => {
  res.render('register', { errors: null, values: null });
});

// Registration route (POST)
app.post('/register', upload.fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'otherPics', maxCount: 5 }
]), [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
  body('email').isEmail().withMessage('Invalid email'),
  body('gender').notEmpty().withMessage('Gender is required'),
  check('hobbies').isArray({ min: 1 }).withMessage('At least one hobby is required'),
  check('profilePic').custom((value, { req }) => {
    if (!req.files || !req.files.profilePic) throw new Error('Profile picture is required');
    return true;
  })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('register', { errors: errors.array(), values: req.body });
  }

  const data = req.body;
  data.profilePic = req.files.profilePic ? req.files.profilePic[0].filename : '';
  data.otherPics = req.files.otherPics ? req.files.otherPics.map(f => f.filename) : [];
  data.hobbies = Array.isArray(data.hobbies) ? data.hobbies.join(', ') : data.hobbies;

  // Render success page with data
  res.render('success', { data });
});

// Download route for uploaded files
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));