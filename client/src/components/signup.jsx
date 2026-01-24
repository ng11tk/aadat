import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();

  // 🔹 State variables
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false); // 🔥 loading state

  // 🔹 Handle form change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 🔹 Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true); // start loading

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false); // stop loading
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:3000/server/auth/signup",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        },
        { withCredentials: true }
      );
      setSuccess(res.data.message || "Account created successfully!");
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false); // stop loading after request
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Create Account
        </h2>
        {error && (
          <p className="mb-4 rounded bg-red-100 p-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {success && (
          <p className="mb-4 rounded bg-green-100 p-2 text-sm text-green-600">
            {success}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-700 focus:border-blue-500 focus:outline-none"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-700 focus:border-blue-500 focus:outline-none"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-700 focus:border-blue-500 focus:outline-none"
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-700 focus:border-blue-500 focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading} // disable while loading
            className={`w-full rounded-lg p-3 font-semibold text-white transition ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to={"/login"} className="text-blue-600 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
