import { compare, hash } from "bcrypt";
import validate from "validator";
import { gqlClient } from "../../lib/graphql.js";
import {
  DELETE_LOGIN_TOKEN,
  INSERT_LOGIN_TOKEN,
  INSERT_USER,
} from "../../graphql/mutation.js";
import { GET_LOGIN_TOKENS, GET_USER_BY_EMAIL } from "../../graphql/query.js";
import { promiseResolver } from "../../utils/promisResolver.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateAccessToken = (existingUser) => {
  return jwt.sign(
    { id: existingUser.id, email: existingUser.email },
    process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
    {
      expiresIn: "15m",
    }
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

export const signup = async (req, res) => {
  try {
    const saltRounds = 10;

    // Destructure email and password from request body
    const { name, email, password } = req.body;
    const userInputPassword = password;

    // validate user credentials
    if (!validate.isEmail(req.body.email)) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!userInputPassword || userInputPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
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
    const pwdHash = await hash(userInputPassword, saltRounds);

    // store the user in the database
    const insertData = {
      email: email,
      password: pwdHash,
      name: name,
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
    res.status(200).json({
      message: "User signed up successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    // validate user data
    if (!validate.isEmail(email)) {
      return res.status(401).json({ message: "Email is not valid!" });
    }

    // check user in database
    const [{ users_user_by_pk: existingUser = {} }, existingUserError] =
      await promiseResolver(gqlClient.request(GET_USER_BY_EMAIL, { email }));

    if (existingUserError) {
      console.error("Error checking existing user:", existingUserError);
      return res.status(500).json({ message: "Internal server error" });
    }

    // verify user password
    const pwdCompare = await compare(password, existingUser.password);
    if (!pwdCompare) {
      return res.status(400).json({ message: "Incorrect password!" });
    }

    // create access and refresh token
    const accessToken = generateAccessToken(existingUser);
    const refreshToken = generateRefreshToken(existingUser);

    // add the token to the cookies
    const cookieOptions = {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    };

    // store refresh token in database
    const [data, error] = await promiseResolver(
      gqlClient.request(INSERT_LOGIN_TOKEN, {
        objects: [
          {
            type: "REFRESH_TOKEN",
            token: refreshToken,
            user_id: existingUser.id,
          },
        ],
      }),
    );
    if (error) {
      console.error("refresh token insert faild!", error);
      return res.status(500).json({ message: "Internal server error" });
    }

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(200).json({ message: "login successful" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Something went wrong!" });
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

  try {
    const decoded = jwt.verify(
      oldRefreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
    );

    // fetch token from db
    const [tokenData, tokenError] = await promiseResolver(
      gqlClient.request(GET_LOGIN_TOKENS, {
        where: { user_id: { _eq: decoded.id } },
        order_by: [{ created_at: "desc" }],
        limit: 1,
      }),
    );

    if (tokenError) {
      console.error("Error fetching login token:", tokenError);
      return res.status(500).json({ message: "Internal server error" });
    }

    const user_login_token = tokenData?.users_refresh_tokens;

    const storedToken = user_login_token?.[0]?.token; // latest token in DB

    if (!storedToken || storedToken !== oldRefreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Issue new tokens
    const newAccessToken = generateAccessToken(decoded);
    const newRefreshToken = generateRefreshToken(decoded);

    // store new refresh token in db
    const [data, error] = await promiseResolver(
      gqlClient.request(INSERT_LOGIN_TOKEN, {
        objects: [
          {
            type: "REFRESH_TOKEN",
            token: newRefreshToken,
            user_id: decoded.id,
          },
        ],
      }),
    );
    if (error) {
      console.error("refresh token insert failed!", error);
      return res.status(500).json({ message: "Internal server error" });
    }
    // add the token to the cookies
    const cookieOptions = {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    };

    res.cookie("accessToken", newAccessToken, cookieOptions);
    res.cookie("refreshToken", newRefreshToken, cookieOptions);

    return res.json({ message: "Token refreshed" });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
};

export const logout = async (req, res) => {
  try {
    // fetch user details from taken from cookies
    const authToken = req.cookies.refreshToken;

    if (!validate.isJWT(authToken)) {
      return res.status(400).send("Token is not valid!");
    }
    const decodedObj = jwt.verify(
      authToken,
      process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
    );

    // verify the user
    // check user in database
    //? do we need this check
    const [{ users_user_by_pk: existingUser = {} }, existingUserError] =
      await promiseResolver(
        gqlClient.request(GET_USER_BY_EMAIL, { email: decodedObj.email }),
      );
    if (existingUserError) {
      console.error("Error checking existing user:", existingUserError);
      return res.status(500).json({ message: "Internal server error" });
    }
    req.user = existingUser;
    // make sure to send via authmiddleware

    // delete refresh token
    const [insertResult, insertError] = await promiseResolver(
      gqlClient.request(DELETE_LOGIN_TOKEN, {
        where: { user_id: { _eq: decodedObj.id } },
      }),
    );

    if (insertError) {
      console.error("Error deleting refresh token:", insertError);
      return res.status(500).json({ message: "Internal server error" });
    }

    // add the token to the cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({ message: "Logout successfully" });
  } catch (error) {
    console.error(error);
    if (error.name === "TokenExpiredError") {
      return res.status(400).send("Session Expired!");
    }
    return res.status(400).send("Something went worng!");
  }
};
