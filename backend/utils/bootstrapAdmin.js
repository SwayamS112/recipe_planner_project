// backend/utils/bootstrapAdmin.js
const User = require('../models/User');
const { hashPassword } = require('./hash');

async function bootstrap() {
  const email = process.env.MAIN_ADMIN_EMAIL;
  const password = process.env.MAIN_ADMIN_PASSWORD;
  const name = process.env.MAIN_ADMIN_NAME || 'Main Admin';

  if (!email || !password) {
    console.log('MAIN_ADMIN_EMAIL or MAIN_ADMIN_PASSWORD not set — skipping bootstrap.');
    return;
  }

  const exists = await User.findOne({ email });
  if (exists) {
    console.log('Main admin already exists:', email);
    return;
  }

  const { salt, hash } = hashPassword(password);
  const admin = await User.create({
    name,
    email,
    passwordHash: hash,
    salt,
    role: 'superadmin',
    isBlocked: false
  });
  console.log('Created main superadmin:', email);
}

module.exports = bootstrap;
