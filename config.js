const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

// ✅ Enhanced Google Strategy Configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            // Update existing user's Google-specific information
            user.googleId = profile.id;
            user.verified = true;
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
        }

        // Create new user if doesn't exist
        user = new User({
            googleId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            verified: true,
            profilePicture: profile.photos?.[0]?.value,
            password: null,
            lastLogin: new Date()
        });

        await user.save();
        return done(null, user);

    } catch (error) {
        console.error('Google Strategy Error:', error);
        return done(error, null);
    }
}));

// ✅ Enhanced Session Handling
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('-password');
        done(null, user);
    } catch (error) {
        console.error('Deserialize User Error:', error);
        done(error, null);
    }
});

module.exports = passport;
