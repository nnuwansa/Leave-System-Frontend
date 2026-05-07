import React, { useState, useEffect } from "react";
import API from "../../API/axios";
import { FaBell, FaBars, FaTimes } from "react-icons/fa";
import "../CSS/Navbar.css";

import Logo from "../../Assets/DCDLogo.png";

export default function AdminNavbar({ onMenuToggle, isSidebarOpen }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const token = localStorage.getItem("token");

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!token) return;

    // fetch notifications
    API.get("/admin/notifications")
      .then((res) => {
        const notificationData = Array.isArray(res.data) ? res.data : [];

        const sortedNotifications = notificationData.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.timestamp || 0);
          const dateB = new Date(b.createdAt || b.timestamp || 0);
          return dateB - dateA;
        });
        setNotifications(sortedNotifications);
      })
      .catch((err) => {
        console.error("Notifications error:", err);
        setNotifications([]);
      });

    API.get("/employee/me")
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.error("User fetch error:", err);
      });
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".notification-wrapper")) {
        setShowNotifications(false);
      }
      if (!event.target.closest(".user-profile")) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const getTitle = () => {
    if (window.innerWidth <= 320) {
      return "DCD - SL";
    } else if (window.innerWidth <= 480) {
      return "Dept. of Cooperative Dev. - Sri Lanka";
    } else if (window.innerWidth <= 600) {
      return "Department of Cooperative Development";
    } else {
      return "Department of Cooperative Development - Sri Lanka";
    }
  };

  // Get appropriate subtitle based on screen size
  const getSubtitle = () => {
    if (window.innerWidth <= 320) {
      return "Central";
    } else {
      return "Central Province";
    }
  };

  const getInitials = (name) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0].toUpperCase())
      .join("")
      .slice(0, 2);
  };

  const handleNotificationClick = (e, notif) => {
    e.stopPropagation();
    setSelectedNotification(notif);
    setShowNotifications(false);
  };

  const handleNotificationToggle = (e) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
  };

  const handleUserMenuToggle = (e) => {
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="header">
      <div className="header-left">
        <button
          className="menu-button"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <FaTimes size={15} /> : <FaBars size={15} />}
        </button>

        <img src={Logo} alt="DCD Logo" className="logo" />
        <div className="header-text">
          <h1>{getTitle()}</h1>
          <p>{getSubtitle()}</p>
        </div>
      </div>

      <div className="header-right">
        <div
          className="notification-wrapper"
          onClick={handleNotificationToggle}
        >
          <FaBell size={isMobile ? 18 : 21} color="#ffffff" />
          {notifications.length > 0 && (
            <span className="notification-badge">{notifications.length}</span>
          )}

          {showNotifications && (
            <div className="notification-dropdown">
              {notifications.length === 0 ? (
                <p className="no-notifications">No notifications</p>
              ) : (
                notifications.map((notif, index) => (
                  <div
                    key={index}
                    className="notification-item"
                    onClick={(e) => handleNotificationClick(e, notif)}
                  >
                    <p>
                      <strong>{notif.email}</strong>
                    </p>
                    <p>{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedNotification && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedNotification(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedNotification(null)}
              className="close-btn"
              aria-label="Close modal"
            >
              ✖
            </button>
            <h3>Password Change Request</h3>
            <p>
              <strong>Email:</strong> {selectedNotification.email}
            </p>
            <p>
              <strong>Message:</strong> {selectedNotification.message}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {selectedNotification.createdAt || selectedNotification.timestamp
                ? new Date(
                    selectedNotification.createdAt ||
                      selectedNotification.timestamp
                  ).toLocaleString()
                : "N/A"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
