const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load env from one level up (backend/.env)
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/projetgb';
    console.log('Connecting to:', dbUri);
    
    await mongoose.connect(dbUri);
    console.log('DB Connected.');

    const adminExists = await User.findOne({ username: 'admin' });
    if (adminExists) {
      console.log('Admin already exists.');
      process.exit();
    }

    await User.create({
      username: 'admin',
      fullName: 'Administrateur ProjetGB',
      email: 'admin@projetgb.com',
      password: 'adminpassword123',
      role: 'admin',
      status: 'active'
    });

    console.log('SUCCESS: Admin created!');
    console.log('User: admin / Pass: adminpassword123');
    process.exit();
  } catch (err) {
    console.error('SEED ERROR:', err.message);
    process.exit(1);
  }
};

seedAdmin();
