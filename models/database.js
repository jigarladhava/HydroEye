const { Sequelize, DataTypes } = require('sequelize');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// Initialize Sequelize
const sequelize = new Sequelize('user_management', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql',
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

// Sync Models
sequelize.sync();
