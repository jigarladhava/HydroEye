const { Sequelize, DataTypes } = require('sequelize');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// Initialize Sequelize instance
const sequelize = new Sequelize('user_management', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false, // Disable SQL logging in console (optional)
});

// Define User Model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Initialize session store
const sessionStore = new SequelizeStore({ db: sequelize });

// Sync database and session store
(async () => {
  try {
    await sequelize.authenticate(); // Ensure DB connection is valid
    console.log('Database connected successfully.');

    await sequelize.sync(); // Sync models with DB
    console.log('Models synced successfully.');

    await sessionStore.sync(); // Sync session table
    console.log('Session store synced successfully.');
  } catch (error) {
    console.error('Error initializing database or session store:', error);
  }
})();

// Export Sequelize instance, session store, and models
module.exports = {
  sequelize,
  sessionStore,
  User,
};
