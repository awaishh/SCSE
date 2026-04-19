import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

// ... existing helper functions (generateAccessAndRefereshTokens, cookieOptions) ...

// POST /auth/setup-2fa
export const setup2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const secret = speakeasy.generateSecret({
    name: `SCSE:${user.email}`,
  });

  user.twoFactorSecret = secret.base32;
  await user.save({ validateBeforeSave: false });

  const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url, {
    color: {
      dark: "#FFFFFF",
      light: "#13121B"
    }
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { qrCode: qrCodeDataURL, secret: secret.base32 }, "2FA setup initiated"));
});

// POST /auth/verify-2fa
export const verify2FA = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const user = await User.findById(req.user._id);

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!verified) {
    throw new ApiError(400, "Invalid verification code");
  }

  user.isTwoFactorEnabled = true;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "2FA enabled successfully"));
});

// POST /auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Generic response to prevent email harvesting
  const response = new ApiResponse(200, {}, "If an account exists with 2FA enabled, you can proceed with reset.");

  const user = await User.findOne({ email });

  if (!user || !user.isTwoFactorEnabled) {
    return res.status(200).json(response);
  }

  return res.status(200).json(response);
});

// POST /auth/verify-reset-code
export const verifyResetCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email });

  if (!user || !user.isTwoFactorEnabled) {
    throw new ApiError(404, "Invalid request");
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!verified) {
    throw new ApiError(400, "Invalid 2FA code");
  }

  const resetToken = user.generateResetPasswordToken();

  return res
    .status(200)
    .json(new ApiResponse(200, { resetToken }, "Reset code verified. You can now reset your password."));
});

// POST /auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    throw new ApiError(400, "Reset token and new password are required");
  }

  try {
    const decoded = jwt.verify(resetToken, process.env.RESET_TOKEN_SECRET || "reset_secret");

    const user = await User.findById(decoded._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    user.password = newPassword;
    user.refreshToken = undefined; // Invalidate current session
    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"));
  } catch (error) {
    throw new ApiError(401, "Invalid or expired reset token");
  }
});

// Helper: generate both tokens and save refresh token to DB
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

// Cookie options — cross-site auth from Vercel to Render requires SameSite=None and Secure=true in production
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

// POST /auth/register
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check all fields are present
  if ([name, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Check for duplicate email
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  // Create user (password hashed by pre-save hook)
  const user = await User.create({ name, email, password });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// POST /auth/login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // If 2FA is enabled, signal the frontend to ask for the code
  if (user.isTwoFactorEnabled) {
    return res
      .status(200)
      .json(new ApiResponse(200, { requires2FA: true }, "2FA verification required"));
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully")
    );
});

// POST /auth/login/2fa — complete login with 2FA code
export const loginWith2FA = asyncHandler(async (req, res) => {
  const { email, password, code } = req.body;

  if (!email || !password || !code) {
    throw new ApiError(400, "Email, password, and 2FA code are required");
  }

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User does not exist");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
    throw new ApiError(400, "2FA is not enabled for this account");
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!verified) throw new ApiError(401, "Invalid 2FA code");

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Login successful")
    );
});

// POST /auth/logout
export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// POST /auth/refresh
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }

  const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(
      new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken: newRefreshToken }, "Access token refreshed")
    );
});

// GET /auth/me — return current authenticated user
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken");
  if (!user) throw new ApiError(404, "User not found");
  return res.status(200).json(new ApiResponse(200, { user }, "User fetched successfully"));
});

// OAuth success redirect (Google / GitHub)
export const oauthSuccess = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(req.user._id);

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);

  // Redirect to dashboard. AuthContext will detect cookies on mount.
  res.redirect(`${process.env.CLIENT_URL}/dashboard`);
});
