// middlewares/rateLimiter.js

import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../utils/redis.js";

// Public APIs -> IP based
export const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,

  keyGenerator: (req) => ipKeyGenerator(req.ip),

  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: "public-api-limiter:",
  }),
});

// Private APIs -> User based
export const privateApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // limit each user to 200 requests per windowMs

  keyGenerator: (req) => req.user.email,

  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: "private-api-limiter:", // Prefix for Redis keys to avoid collisions
  }),
});

export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes

  max: 25, // limit each IP to 25 login requests per windowMs

  keyGenerator: (req) => {
    // Use the username or email from the request body as the key for rate limiting
    return req.body.email;
  },

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many login attempts. Try again after 10 minutes.",
  },

  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: "login-limiter:",
  }),
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour

  max: 10, // limit each IP to 10 signup requests per windowMs

  keyGenerator: (req) => {
    // Use the username or email from the request body as the key for rate limiting
    return req.body.email;
  },

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many signup attempts. Try again after 1 hour.",
  },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: "signup-limiter:",
  }),
});
