import React from "react";
import { Menu } from "lucide-react";
import "../CSS/EmployeeNavbar.css";
import Logo from "../../Assets/DCDLogo.png";

const Navbar = ({ setSidebarOpen }) => {
  return (
    <div className="header">
      <button
        className="mobile-menu-btn d-lg-none"
        onClick={() => setSidebarOpen && setSidebarOpen(true)}
        style={{
          position: "absolute",
          left: "15px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: "white",
          fontSize: "1.5rem",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "40px",
          minHeight: "40px",
          zIndex: 1031,
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "transparent";
        }}
      >
        <Menu size={24} />
      </button>

      {/* Logo */}
      <img
        src={Logo}
        alt="Left Logo"
        className="logo"
        style={{
          width: "40px",
          height: "auto",
          marginLeft: window.innerWidth < 992 ? "50px" : "0", // Add margin on mobile to avoid overlap with menu button
        }}
      />

      {/* Title and Subtitle */}
      <div className="header-text">
        <h1>Department of Cooperative Development - Sri Lanka</h1>
        <p>Central Province</p>
      </div>
    </div>
  );
};

export default Navbar;
