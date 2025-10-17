const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const Employee = require('./models/Employee');
const Leave = require('./models/Leave');

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // For JSON API requests
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(express.static('public')); // Serve frontend files

mongoose.connect('mongodb://localhost:27017/erp', { useNewUrlParser: true, useUnifiedTopology: true });

// Nodemailer transporter (replace with your credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'branstark302@gmail.com', pass: 'ttwh nlpk katn dueo' }
});

// Hardcoded admin
const admin = { username: 'admin', password: 'adminpass' };

// Admin Login
app.get('/admin/login', (req, res) => res.render('admin_login'));
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === admin.username && password === admin.password) {
    req.session.admin = true;
    return res.redirect('/admin/dashboard');
  }
  res.send('Invalid');
});

// Admin Dashboard (list employees)
app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  const employees = await Employee.find();
  res.render('admin_dashboard', { employees });
});

// Add Employee
app.get('/admin/add', (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  res.render('admin_add');
});
app.post('/admin/add', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  try {
    const { name, email, basicSalary } = req.body;
    const count = await Employee.countDocuments();
    const empid = `EMP${String(count + 1).padStart(3, '0')}`;
    const password = Math.random().toString(36).slice(-8);

    const employee = new Employee({ empid, name, email, basicSalary: parseFloat(basicSalary), password });
    await employee.save();

    const hra = basicSalary * 0.2;
    const da = basicSalary * 0.1;
    const totalSalary = basicSalary + hra + da;

    transporter.sendMail({
      from: 'your@gmail.com',
      to: email,
      subject: 'Welcome to ERP',
      text: `Your EmpID: ${empid}, Password: ${password}, Total Salary: ${totalSalary}`
    }, (err) => {
      if (err) console.error('Email error:', err);
    });

    res.redirect('/admin/dashboard');
  } catch (err) {
    res.send('Error: ' + err.message);
  }
});

// Edit Employee
app.get('/admin/edit/:id', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  const employee = await Employee.findById(req.params.id);
  res.render('admin_edit', { employee });
});
app.post('/admin/edit/:id', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  await Employee.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/admin/dashboard');
});

// Delete Employee
app.get('/admin/delete/:id', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  await Employee.findByIdAndDelete(req.params.id);
  res.redirect('/admin/dashboard');
});

// Admin Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// Employee Login API
const secret = 'jwt-secret';
app.post('/api/login', async (req, res) => {
  const { empid, password } = req.body;
  const employee = await Employee.findOne({ empid });
  if (employee && await bcrypt.compare(password, employee.password)) {
    const token = jwt.sign({ empid: employee.empid }, secret, { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Profile API
app.get('/api/profile', verifyToken, async (req, res) => {
  const employee = await Employee.findOne({ empid: req.user.empid });
  res.json(employee);
});

// Add Leave
app.post('/api/leave', verifyToken, async (req, res) => {
  const leave = new Leave({ ...req.body, empid: req.user.empid });
  await leave.save();
  res.json({ success: true });
});

// List Leaves
app.get('/api/leaves', verifyToken, async (req, res) => {
  const leaves = await Leave.find({ empid: req.user.empid });
  res.json(leaves);
});

app.listen(3000, () => console.log('Server running on port 3000'));