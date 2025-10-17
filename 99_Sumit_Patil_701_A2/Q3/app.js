const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

// Initialize Redis client
const redis = new Redis({
  host: 'localhost',
  port: 6379
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure session store
app.use(session({
  store: new RedisStore({ client: redis }),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

// Simple in-memory user store (replace with database in production)
const users = [
  { id: 1, username: 'testuser', password: '$2b$10$7Qz1W6z3Y7Qz1W6z3Y7Qz1W6z3Y7Qz1W6z3Y7Qz1W6z3Y7Qz1W6z' } // Password: test123
];

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Login App</h1>
    <form action="/login" method="POST">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
    <a href="/protected">Protected Route</a>
  `);
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  req.session.userId = user.id;
  res.json({ message: 'Login successful' });
});

app.get('/protected', isAuthenticated, (req, res) => {
  res.json({ message: 'This is a protected route', userId: req.session.userId });
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});