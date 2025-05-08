const express = require('express');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

// Import routes
const indexRoutes = require('./routes/index');
const templateRoutes = require('./routes/template');
const emailRoutes = require('./routes/email');
const authRoutes = require('./routes/auth'); // New auth routes

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'text/csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
});

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan('dev'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'bulk-email-sender-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Flash messages
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.isAuthenticated = !!req.session.emailCredentials;
  res.locals.userEmail = req.session.emailCredentials ? req.session.emailCredentials.email : null;
  next();
});

// Make multer available
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Routes
app.use('/', indexRoutes);
app.use('/template', templateRoutes);
app.use('/email', emailRoutes);
app.use('/auth', authRoutes); // Add auth routes

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error',
    message: err.message || 'Something went wrong!'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;