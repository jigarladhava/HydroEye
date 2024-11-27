app.use(
    session({
      secret: 'auth_model_secret',
      resave: false,
      saveUninitialized: false,
      store: new SequelizeStore({ db: sequelize }),
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());