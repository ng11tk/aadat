import express, { json } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { serverRouter } from "./router/index.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

// create a express app
const app = express();

// middleware
app.use(
  cors({
    origin: "http://localhost:5173", // ✅ your React/Vite frontend
    credentials: true, // ✅ allow cookies
  })
);
app.use(cookieParser());
app.use(json());

// Define a simple route
app.use("/server", serverRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
