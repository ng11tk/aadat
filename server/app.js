import express, { json, urlencoded } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { serverPrivateRouter, serverPublicRouter } from "./router/index.js";
import { authRouter } from "./router/auth/route.js";
import pool from "./config/db.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

// create a express app
const app = express();

// CORS configuration - support both development and production origins
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// middlewares
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(json());
app.use(urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/server/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "api",
    timestamp: new Date().toISOString(),
  });
});

// use routers
app.use("/server", serverPublicRouter);
app.use("/server", serverPrivateRouter);

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown: close HTTP server and DB pool
const shutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(async (err) => {
    if (err) {
      console.error("Error closing server:", err);
      process.exit(1);
    }
    try {
      await pool.end();
      console.log("Database pool has been closed.");
      process.exit(0);
    } catch (e) {
      console.error("Error while closing DB pool:", e);
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown("uncaughtException");
});
