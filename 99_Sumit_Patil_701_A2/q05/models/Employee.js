const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const employeeSchema = new mongoose.Schema({
  empid: { type: String, unique: true },
  name: String,
  email: { type: String, unique: true },
  basicSalary: Number,
  password: String // Encrypted
});

employeeSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);