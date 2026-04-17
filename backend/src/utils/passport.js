import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { User } from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const oauthCallback = async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({
      $or: [{ googleId: profile.id }, { githubId: profile.id }, { email: profile.emails[0].value }],
    });

    if (!user) {
      user = await User.create({
        name: profile.displayName || profile.username,
        email: profile.emails[0].value,
        googleId: profile.provider === "google" ? profile.id : undefined,
        githubId: profile.provider === "github" ? profile.id : undefined,
        avatar: profile.photos[0]?.value,
      });
    } else {
      // Update ID if not present (in case user previously registered with email or another provider)
      if (profile.provider === "google" && !user.googleId) user.googleId = profile.id;
      if (profile.provider === "github" && !user.githubId) user.githubId = profile.id;
      if (!user.avatar) user.avatar = profile.photos[0]?.value;
      await user.save();
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    oauthCallback
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
      scope: ["user:email"],
    },
    oauthCallback
  )
);

// Serialize/Deserialize not strictly needed for JWT strategy but Passport requires them if using sessions
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
