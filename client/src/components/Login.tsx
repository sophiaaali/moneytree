import React from "react";
import "../styles/Login.css";

const Login: React.FC = () => {
  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-header">Welcome to MoneyTree 🌱</h2>
        <form>
          <label className="form-group">
            Email
            <input
              type="email"
              placeholder="Your email address"
              className="form-input"
            />
          </label>
          <label className="form-group">
            Password
            <input
              type="password"
              placeholder="Your password"
              className="form-input"
            />
          </label>
          <button type="submit" className="submit-button">
            Sign In/Register
          </button>
        </form>
        <div className="link-container">
          <a href="#" className="link">
            Forgot password?
          </a>
          <br />
          <a href="#" className="link">
            Start a family account instead
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;