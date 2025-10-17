const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Employee = require('./models/Employee');

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));

mongoose.connect('mongodb://localhost:27017/erp', { useNewUrlParser: true, useUnifiedTopology: true });

// Nodemailer transporter (replace with your credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'branstark302@gmail.com', pass: 'ttwh nlpk katn dueo' }
});

// Hardcoded admin
const admin = { username: 'admin', password: '12345' };

// Login
app.get('/admin/login', (req, res) => res.render('admin_login'));
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username == admin.username && password == admin.password) {
    req.session.admin = true;
    return res.redirect('/admin/dashboard');
  }
  res.send('Invalid');
});
// Dashboard (list employees)
app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  const employees = await Employee.find();
  res.render('admin_dashboard', { employees });
});

// Add employee
app.get('/admin/add', (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  res.render('admin_add');
});
app.post('/admin/add', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  const { name, email, basicSalary } = req.body;
  const count = await Employee.countDocuments();
  const empid = `EMP${String(count + 1).padStart(3, '0')}`;
  const password = Math.random().toString(36).slice(-8); // Generate random password

  const employee = new Employee({ empid, name, email, basicSalary: parseFloat(basicSalary), password });
  await employee.save();

  // Salary calculation
  const hra = basicSalary * 0.2;
  const da = basicSalary * 0.1;
  const totalSalary = basicSalary + hra + da;

  // Send email
  transporter.sendMail({
    from: 'your@gmail.com',
    to: email,
    subject: 'Welcome to ERP',
    text: `Your EmpID: ${empid}, Password: ${password}, Total Salary: ${totalSalary}`
  });

  res.redirect('/admin/dashboard');
});

// Edit employee
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

// Delete employee
app.get('/admin/delete/:id', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  await Employee.findByIdAndDelete(req.params.id);
  res.redirect('/admin/dashboard');
});

// Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

app.listen(3000, () => console.log('Server running on port 3000'));