import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUserTie,
  FaCalendarCheck,
  FaPlaneDeparture,
  FaSignOutAlt,
  FaShieldAlt,
  FaClipboardList,
  FaHistory,
  FaExclamationTriangle,
} from "react-icons/fa";
import "../CSS/Navbar.css";

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/DashboardAdmin", icon: <FaHome /> },
    { name: "Employee", path: "/EmployeeAdmin", icon: <FaUserTie /> },
    {
      name: "Leave Requests",
      path: "/LeaveAdmin",
      icon: <FaPlaneDeparture />,
      badge: 2,
    },
    { name: "Daily Reports", path: "/DailyReports", icon: <FaClipboardList /> },
    { name: "Leave Summary", path: "/LeaveSummary", icon: <FaCalendarCheck /> },
    {
      name: "Leave Records",
      path: "/LeaveHistorySummary",
      icon: <FaHistory />,
    },

    {
      name: "Late Coverage Management",
      path: "/LateCoverageManagement",
      icon: <FaHistory />,
    },
    {
      name: "Emergency Leave Requests",
      path: "/EmergencyLeave",
      icon: <FaExclamationTriangle />,
    },
    { name: "Settings", path: "/AdminSettings", icon: <FaShieldAlt /> },
  ];

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth <= 768 && onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <div className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
        {/* User Profile Section */}
        <div className="sidebar-user">
          <div className="user-avatar">
            <span>A</span>
          </div>
          <div className="user-info">
            <h3>Admin</h3>
            <p>Administrator</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${
                location.pathname === item.path ? "nav-item-active" : ""
              }`}
              onClick={handleLinkClick}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.name}</span>
              {/* {item.badge && <span className="nav-badge">{item.badge}</span>} */}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
