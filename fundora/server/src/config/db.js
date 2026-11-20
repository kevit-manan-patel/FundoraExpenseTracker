const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_username>') || uri.includes('<db_password>')) {
    console.error('\n✖ MONGODB_URI is not set up yet.');
    console.error('  Open server/.env and replace <db_username> and <db_password> with your Atlas database user.\n');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error('\n✖ JWT_SECRET is missing in server/.env\n');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { dbName: process.env.DB_NAME || 'ExpenseTracker', serverSelectionTimeoutMS: 12000 });
    console.log(`✔ MongoDB Atlas connected (database: ${mongoose.connection.name})`);
  } catch (err) {
    console.error('\n✖ Could not connect to MongoDB Atlas:', err.message);
    console.error('  Checklist:');
    console.error('  1. Username/password in MONGODB_URI are correct (database user, not Atlas login)');
    console.error('  2. Atlas > Network Access > add your IP (or 0.0.0.0/0 for development)');
    console.error('  3. Special characters in the password are URL-encoded\n');
    process.exit(1);
  }
};
