import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/apiUtils";
import "../CSS/Login.css";

const Login = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await API.post("/auth/login", credentials);

      // Handle response - check if data is nested or direct
      const responseData = response.data || response;
      const { token, roles } = responseData;

      localStorage.clear();
      localStorage.setItem("token", token);
      localStorage.setItem("roles", JSON.stringify(roles));
      localStorage.setItem("email", credentials.email);

      if (roles.includes("ADMIN")) navigate("/DashboardAdmin");
      else if (roles.includes("EMPLOYEE")) navigate("/Dashboard");
      else navigate("/");
    } catch (err) {
      console.error("Login error:", err);

      // Handle different error cases
      if (err.response) {
        const status = err.response.status;
        const errorMessage = err.response.data;

        // Check for authentication errors (401, 403, or specific error messages)
        if (
          status === 401 ||
          status === 403 ||
          errorMessage?.toLowerCase().includes("user not found") ||
          errorMessage?.toLowerCase().includes("invalid") ||
          errorMessage?.toLowerCase().includes("incorrect")
        ) {
          setError("❌ Invalid email or password");
        } else {
          setError(
            errorMessage || "❌ Something went wrong. Please try again."
          );
        }
      } else if (err.request) {
        setError("❌ Network error. Please check your connection.");
      } else {
        setError(err.message || "❌ Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {showSplash ? (
        <div className="splash-screen">
          <div>
            <h1 className="splash-line1">
              Department of Cooperative Development
            </h1>
            <p className="splash-line2">Central Province</p>
          </div>
        </div>
      ) : (
        <div className="login-container login-fade-in">
          <div className="floating-shapes">
            <div className="shape shape1"></div>
            <div className="shape shape2"></div>
            <div className="shape shape3"></div>
          </div>

          <div className="login-card">
            <div className="login-header">
              <img src="/logo.png" alt="Logo" className="login-logo" />
              <h1 className="login-title1">Leave Management System</h1>
              <h2 className="login-title">Welcome Back !</h2>
              <p className="login-subtitle">
                Sign In To Continue To Your Account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="Enter Your Email"
                  value={credentials.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group password-group">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="Enter Your Password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i
                    className={`fas ${
                      showPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>

              <div className="options-row">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <a href="#" className="forgot-password">
                  Forgot Password?
                </a>
              </div>

              {error && <div className="error-alert">{error}</div>}

              <button type="submit" disabled={loading} className="gradient-btn">
                {loading ? "Signing In..." : "LOGIN"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
