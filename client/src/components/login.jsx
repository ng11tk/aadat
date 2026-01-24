import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  // 🔹 State variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:3000/server/auth/login",
        {
          email,
          password,
          remember,
        },
        { withCredentials: true } // ✅ send & receive cookies
      );

      console.log("✅ Login Success:", res.data);
      navigate("/");
    } catch (err) {
      console.error("❌ Login Error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-w-screen min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-6 bg-white rounded-2xl shadow-lg">
        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-800">Login</h2>
        <p className="mt-1 text-sm text-center text-gray-500">
          Welcome back! Please sign in
        </p>

        {/* Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              required
              placeholder="Enter your email"
              className="w-full px-4 py-2 mt-1 text-gray-700 bg-gray-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 mt-1 text-gray-700 bg-gray-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>

          {/* Error message */}
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-sm text-center text-gray-600">
          Don’t have an account?{" "}
          <Link to={"/signup"} className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
