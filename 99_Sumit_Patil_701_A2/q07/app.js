const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Category = require('./models/Category');
const Product = require('./models/Product');

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/shop', { useNewUrlParser: true, useUnifiedTopology: true });

// Hardcoded admin
const admin = { username: 'admin', password: 'pass' };

// Admin Login
app.get('/admin/login', (req, res) => res.render('admin_login', { error: null }));
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === admin.username && password === admin.password) {
    req.session.admin = true;
    return res.redirect('/admin/dashboard');
  }
  res.render('admin_login', { error: 'Invalid credentials' });
});

// Admin Dashboard
app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  const categories = await Category.find().populate('parentId');
  const products = await Product.find().populate('categoryId');
  res.render('admin_dashboard', { categories, products, error: null });
});

// Add Category
app.post('/admin/category/add', [
  body('name').notEmpty().withMessage('Category name is required')
], async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const categories = await Category.find().populate('parentId');
    const products = await Product.find().populate('categoryId');
    return res.render('admin_dashboard', { categories, products, error: errors.array()[0].msg });
  }
  const { name, parentId } = req.body;
  await new Category({ name, parentId: parentId || null }).save();
  res.redirect('/admin/dashboard');
});

// Add Product
app.post('/admin/product/add', [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categoryId').notEmpty().withMessage('Category is required')
], async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const categories = await Category.find().populate('parentId');
    const products = await Product.find().populate('categoryId');
    return res.render('admin_dashboard', { categories, products, error: errors.array()[0].msg });
  }
  await new Product(req.body).save();
  res.redirect('/admin/dashboard');
});

// User Home (Browse Categories)
app.get('/', async (req, res) => {
  const parents = await Category.find({ parentId: null });
  res.render('user_home', { parents });
});

// Subcategories and Products
app.get('/category/:id', async (req, res) => {
  const subs = await Category.find({ parentId: req.params.id });
  const products = await Product.find({ categoryId: req.params.id });
  res.render('user_category', { subs, products, categoryId: req.params.id });
});

// Add to Cart
app.post('/cart/add', (req, res) => {
  if (!req.session.cart) req.session.cart = [];
  req.session.cart.push(req.body.productId);
  res.redirect('back');
});

// View Cart
app.get('/cart', async (req, res) => {
  const cartIds = req.session.cart || [];
  const products = await Product.find({ _id: { $in: cartIds } }).populate('categoryId');
  res.render('user_cart', { products });
});
app.get('/cart/back', (req, res) => {
  const referer = req.get('Referer') || '/';
  res.redirect(referer);
});
// Admin Logout
app.get('/admin/logout', (req, res) => {
  req.session.admin = false; 
  
  res.redirect('/admin/login');
});

app.listen(3000, () => console.log('Server running on port 3000'));