const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { User } = require('./../models/database'); // Import User model

module.exports = function (passport) {
    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const user = await User.findOne({ where: { username } });
                if (!user) {
                    return done(null, false, { message: 'No user found' });
                }

                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                   // console.log(user);
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            } catch (error) {
                return done(error);
            }
        })
    );

    passport.serializeUser((user, done) => {
        console.log('Serializing user:', user); // Debugging
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findByPk(id);
            console.log('Deserializing user:', user); // Debugging
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
};
