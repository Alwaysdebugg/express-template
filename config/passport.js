import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import UserModel from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Ensure Google credentials exist
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️ Google OAuth credentials not found in environment variables. Google Login will not work.');
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder_secret',
    callbackURL: "/api/auth/google/callback",
    scope: ['profile', 'email']
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const name = profile.displayName;
      
      if (!email) {
        return cb(new Error('No email found in Google profile'));
      }
      
      // Check if user exists
      let user = await UserModel.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        // Note: We don't have a password for Google users
        user = await UserModel.createUser({
            name, 
            email
        });
      }
      
      return cb(null, user);
    } catch (err) {
      return cb(err);
    }
  }
));

export default passport;

