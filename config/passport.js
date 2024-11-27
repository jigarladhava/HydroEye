const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

module.exports = function (passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            // Replace with your actual user fetching logic
            const user = { id: 1, email: 'test@test.com', password: '$2b$10$...' }; // Example user
            
            if (!user) {
                return done(null, false, { message: 'No user found' });
            }

            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            });
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        // Replace with your actual user finding logic
        const user = { id: 1, email: 'test@test.com' }; // Example user
        done(null, user);
    });
};
