import express, { json, urlencoded } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { serverPrivateRouter, serverPublicRouter } from "./router/index.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

// create a express app
const app = express();

// CORS configuration - support both development and production origins
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
