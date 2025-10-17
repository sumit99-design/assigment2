const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({
  store: new FileStore({ path: './sessions' }), // Stores sessions in ./sessions directory
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false
}));

// Hardcoded user for demo
const users = { admin: 'password123' };

// Login page
app.get('/login', (req, res) => res.render('login'));

// Login post
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    req.session.user = username;
    return res.redirect('/dashboard');
  }
  res.send('Invalid credentials');
});

// Dashboard (protected)
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('dashboard', { user: req.session.user });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.listen(8000, () => console.log('Server running on port 8000'));