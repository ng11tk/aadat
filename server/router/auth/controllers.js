import { compare, hash } from "bcrypt";
import validate from "validator";
import { gqlClient } from "../../lib/graphql.js";
import {
  INSERT_LOGIN_TOKEN,
  INSERT_USER,
  REVOKE_ALL_USER_TOKENS,
  REVOKE_TOKEN,
  REVOKE_TOKEN_LOGOUT,
} from "../../graphql/mutation.js";
import { GET_LOGIN_TOKENS, GET_USER_BY_EMAIL } from "../../graphql/query.js";
import { promiseResolver } from "../../utils/promiseResolver.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateAccessToken = (existingUser) => {
  return jwt.sign(
    { id: existingUser.id, email: existingUser.email },
    process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
    {
      expiresIn: "15m",
    },
  );
};
const generateRefreshToken = (existingUser) => {
  return jwt.sign(
    { id: existingUser.id, email: existingUser.email },
    process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
    {
      expiresIn: "7d",
    },
  );
};
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, match your JWT exp
const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
const MAX_PASSWORD_LENGTH = 72; // bcrypt ignores bytes beyond this anyway
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 min, match your JWT exp
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_TOKEN_MAX_AGE_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const normalizeEmail = (email) => email.trim().toLowerCase();

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
};

export const signup = async (req, res) => {
  try {
    const saltRounds = 10;

    // Destructure email and password from request body
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email || "");

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    // validate user credentials
    if (!validate.isEmail(email)) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at most ${MAX_PASSWORD_LENGTH} characters long`,
      });
    }

    // check if user already exists
    const [existingUser, existingUserError] = await promiseResolver(
      gqlClient.request(GET_USER_BY_EMAIL, { email }),
    );

    if (existingUserError) {
      console.error("Error checking existing user:", existingUserError);
      return res.status(500).json({ message: "Internal server error 0" });
    }

    // If user already exists, return an error
    if (existingUser.users_user_by_pk) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const pwdHash = await hash(password, saltRounds);

    // store the user in the database
    const insertData = {
      email,
      password: pwdHash,
      name: name.trim(),
      surname: req.body.surname || "",
      gender: req.body.gender || "",
    };

    // Insert the new user into the database
    const [insertResult, insertError] = await promiseResolver(
      gqlClient.request(INSERT_USER, { object: insertData }),
    );

    if (insertError) {
      console.error("Error inserting user:", insertError);
      return res.status(500).json({ message: "Internal server error" });
    }

    // If the insertion was successful, you can send a success response
    res.status(201).json({
      message: "User signed up successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { password, remember } = req.body;
    const email = normalizeEmail(req.body.email || "");

    // validate user data
    if (!validate.isEmail(email)) {
      return res.status(401).json({ message: "Invalid email or password!" });
    }

    // check user in database
    const [{ users_user_by_pk: existingUser = {} }, existingUserError] =
      await promiseResolver(gqlClient.request(GET_USER_BY_EMAIL, { email }));

    if (existingUserError) {
      console.error("Error checking existing user:", existingUserError);
      return res.status(500).json({ message: "Internal server error" });
    }

    // Same generic message whether the user doesn't exist or the
    // password is wrong — don't let this endpoint be used to enumerate
    // registered emails.
    if (!existingUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // verify user password
    const pwdCompare = await compare(password, existingUser.password);
    if (!pwdCompare) {
      return res.status(401).json({ message: "Incorrect password!" });
    }

    // create access and refresh token
    const accessToken = generateAccessToken(existingUser);
    const refreshToken = generateRefreshToken(existingUser);

    const refreshTtlMs = remember
      ? REFRESH_TOKEN_MAX_AGE_REMEMBER_MS
      : REFRESH_TOKEN_MAX_AGE_MS;
    const newExpiresAt = new Date(Date.now() + refreshTtlMs);

    // store refresh token in database
    const [data, error] = await promiseResolver(
      gqlClient.request(INSERT_LOGIN_TOKEN, {
        objects: [
          {
            type: "REFRESH_TOKEN",
            token: refreshToken,
            user_id: existingUser.id,
            expires_at: newExpiresAt.toISOString(),
          },
        ],
      }),
    );
    if (error) {
      console.error("refresh token insert failed!", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    // add the token to the cookies
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: refreshTtlMs,
    });

    return res.status(200).json({ message: "login successful" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const check = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET_KEY);
    return res.json({ message: "Authenticated", user: decoded });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// 🔹 Refresh Token (Rotation with DB)
export const refreshToken = async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken)
    return res.status(401).json({ message: "No refresh token" });

  let decoded;
  try {
    decoded = jwt.verify(
      oldRefreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
    );
  } catch (err) {
    // distinguish expired vs invalid so the client can react correctly
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token expired" });
    }
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  try {
    // fetch token from db
    const [tokenData, tokenError] = await promiseResolver(
      gqlClient.request(GET_LOGIN_TOKENS, {
        where: {
          user_id: { _eq: decoded.id },
          token: { _eq: oldRefreshToken },
        },
      }),
    );

    if (tokenError) {
      console.error("Error fetching login token:", tokenError);
      return res.status(500).json({ message: "Internal server error" });
    }

    const tokenRow = tokenData?.users_refresh_tokens?.[0];

    if (!tokenRow) {
      await promiseResolver(
        gqlClient.request(REVOKE_ALL_USER_TOKENS, {
          where: { user_id: { _eq: decoded.id } },
          _set: { revoked_at: new Date().toISOString() },
        }),
      );
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Already revoked (used once already, or logged out)
    if (tokenRow.revoked_at) {
      return res.status(401).json({ message: "Refresh token revoked" });
    }

    // DB-level expiry check (independent of JWT exp — lets you shorten
    // a session server-side without waiting for the JWT to expire)
    if (new Date(tokenRow.expires_at) <= new Date()) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    // Issue new tokens
    const newAccessToken = generateAccessToken(decoded);
    const newRefreshToken = generateRefreshToken(decoded);

    // Rotate: revoke the old row and insert the new one.
    // (Do this as a single Hasura mutation if your client supports
    // multiple mutation fields in one request, so it's atomic.)
    const [, revokeError] = await promiseResolver(
      gqlClient.request(REVOKE_TOKEN, {
        where: { id: { _eq: tokenRow.id } },
        _set: { revoked_at: new Date().toISOString() },
      }),
    );
    if (revokeError) {
      console.error("Failed to revoke old refresh token:", revokeError);
      return res.status(500).json({ message: "Internal server error" });
    }

    // store new refresh token in db
    const [data, error] = await promiseResolver(
      gqlClient.request(INSERT_LOGIN_TOKEN, {
        objects: [
          {
            type: "REFRESH_TOKEN",
            token: newRefreshToken,
            user_id: decoded.id,
            expires_at: newExpiresAt.toISOString(),
          },
        ],
      }),
    );
    if (error) {
      console.error("refresh token insert failed!", error);
      return res.status(500).json({ message: "Internal server error" });
    }
    // add the token to the cookies
    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE_MS, // match your access token TTL
    });
    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_TTL_MS,
    });

    return res.json({ message: "Token refreshed" });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

  const clearAuthCookies = (res) => {
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
  };

  // fetch user details from taken from cookies
  const authToken = req.cookies.refreshToken;

  // No token at all — nothing to revoke, but still clear cookies and
  // treat it as a successful logout (idempotent).
  if (!authToken) {
    clearAuthCookies(res);
    return res.status(200).json({ message: "Logged out successfully" });
  }

  let decoded;
  try {
    decoded = jwt.verify(authToken, process.env.JWT_REFRESH_TOKEN_SECRET_KEY);
  } catch (error) {
    // Even if the refresh token is expired or malformed, logout should
    // still succeed client-side — there's nothing left server-side worth
    // protecting for a dead token, and the user's intent is just "log me out."
    clearAuthCookies(res);
    if (error.name === "TokenExpiredError") {
      return res
        .status(200)
        .json({ message: "Session already expired, logged out" });
    }
    return res.status(200).json({ message: "Logged out successfully" });
  }

  try {
    // Revoke only THIS session's token, not every device the user is
    // logged in on. Use RevokeAllUserTokens instead if you want
    // "log out everywhere" behavior here.
    const [, revokeError] = await promiseResolver(
      gqlClient.request(REVOKE_TOKEN_LOGOUT, {
        where: {
          user_id: { _eq: decoded.id },
          token: { _eq: authToken },
        },
        _set: { revoked_at: new Date().toISOString() },
      }),
    );
    if (revokeError) {
      console.error("Error revoking refresh token:", revokeError);
      // Don't block logout on a DB error — the cookies are the user-facing
      // session, and we still want them cleared. Log it and move on;
      // the token will die on its own at expires_at even if revoke failed.
    }
    clearAuthCookies(res);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    clearAuthCookies(res);
    return res.status(200).json({ message: "Logged out successfully" });
  }
};
