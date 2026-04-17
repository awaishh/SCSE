import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { User } from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const oauthCallback = async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

    // Build search query safely
    const query = [];
    if (profile.provider === "google") query.push({ googleId: profile.id });
    if (profile.provider === "github") query.push({ githubId: profile.id });
    if (email) query.push({ email: email });

    if (query.length === 0) {
      return done(new Error("Insufficient profile information"), null);
    }

    let user = await User.findOne({ $or: query });

    if (!user) {
      // If user doesn't exist, we MUST have an email to create them
      if (!email) {
        return done(new Error("Email is required but not provided by social provider"), null);
      }

      user = await User.create({
        name: profile.displayName || profile.username || "Social User",
        email: email,
        googleId: profile.provider === "google" ? profile.id : undefined,
        githubId: profile.provider === "github" ? profile.id : undefined,
        avatar: profile.photos?.[0]?.value,
      });
    } else {
      // Update missing provider IDs to link accounts automatically
      let isModified = false;
      if (profile.provider === "google" && !user.googleId) {
        user.googleId = profile.id;
        isModified = true;
      }
      if (profile.provider === "github" && !user.githubId) {
        user.githubId = profile.id;
        isModified = true;
      }
      if (!user.avatar && profile.photos?.[0]?.value) {
        user.avatar = profile.photos[0].value;
        isModified = true;
      }

      if (isModified) {
        await user.save({ validateBeforeSave: false });
      }
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
      proxy: true,
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
      proxy: true,
    },
    oauthCallback
  )
);

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
