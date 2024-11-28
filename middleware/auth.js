const session = require('express-session');
const passport = require('passport');
const { sessionStore } = require('./../models/database'); // Import session store

module.exports = (app) => {
  app.use(
    session({
      secret: 'auth_model_secret', // Keep this secret secure
      resave: false,
      saveUninitialized: false,
      store: sessionStore, // Use the imported session store
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
};
