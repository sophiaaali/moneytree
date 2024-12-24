import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h1 className="logo-text">MoneyTree</h1>
        <span className="logo-icon" role="img" aria-label="sprout">
          🌱
        </span>
      </div>
      <div className="navbar-links">
        <NavLink
          to="/garden"
          className={({ isActive }) =>
            isActive ? "nav-button active" : "nav-button"
          }
        >
          Garden
        </NavLink>
        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            isActive ? "nav-button active" : "nav-button"
          }
        >
          Budgets
        </NavLink>
        <NavLink
          to="/insights"
          className={({ isActive }) =>
            isActive ? "nav-button active" : "nav-button"
          }
        >
          Insights
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
