import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../utils/apiUtils";
import {
  User,
  Building,
  CheckCircle,
  FileText,
  Clock,
  Settings,
  LayoutDashboard,
  LogOut,
  X,
} from "lucide-react";

const EmployeeSidebar = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [approvalCounts, setApprovalCounts] = useState({
    acting: 0,
    supervising: 0,
    approval: 0,
    total: 0,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  // Get credentials
  const token = localStorage.getItem("token");
  const email =
    localStorage.getItem("email") || localStorage.getItem("userEmail");

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      // Auto-close sidebar on mobile when screen gets larger
      if (window.innerWidth >= 992 && sidebarOpen) {
        setSidebarOpen?.(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarOpen, setSidebarOpen]);

  // Function to get first letter of user's name
  const getUserInitial = (name) => {
    if (!name || typeof name !== "string") return "U";
    return name.charAt(0).toUpperCase();
  };

  // Function to generate background color based on name
  const getProfileBackgroundColor = (name) => {
    if (!name) return "rgba(255, 255, 255, 0.2)";

    const colors = [
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#7fed9c",
      "#DDA0DD",
      "#98D8C8",
      "#BB8FCE",
      "#85C1E9",
      "#82E0AA",
      "#8cede6",
      "#85C1E9",
      "#D2B4DE",
      "#AED6F1",
      "#A3E4D7",
      "#D5DBDB",
      "#e8c2bf",
      "#c7f4ea",
      "#dec6e7",
      "#bbd7ec",
      "#dcc0eb",
    ];

    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Fetch current user details
  const fetchCurrentUser = async () => {
    if (!email) return;

    try {
      console.log("Fetching user details for:", email);
      const user = await API.get(`/admin/users/${email}`);
      console.log("User details fetched:", user);
      setCurrentUser(user);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  // Fetch approval counts
  const fetchApprovalCounts = async () => {
    if (!token) return;

    try {
      console.log("Fetching approval counts...");

      let actingCount = 0;
      let supervisingCount = 0;
      let approvalCount = 0;

      // Method 1: Try dashboard counts API
      try {
        const dashboardCounts = await API.get("/leaves/dashboard/counts");
        console.log("Dashboard counts response:", dashboardCounts);

        if (dashboardCounts) {
          actingCount =
            dashboardCounts.pendingAsActingOfficer ||
            dashboardCounts.acting ||
            dashboardCounts.pendingActing ||
            0;
          supervisingCount =
            dashboardCounts.pendingAsSupervisingOfficer ||
            dashboardCounts.supervising ||
            dashboardCounts.pendingSupervising ||
            0;
          approvalCount =
            dashboardCounts.pendingAsApprovalOfficer ||
            dashboardCounts.approval ||
            dashboardCounts.pendingApproval ||
            0;
        }
      } catch (err) {
        console.log(
          "Dashboard counts API failed, trying direct leave fetching..."
        );
      }

      // Method 2: Direct API calls if dashboard failed
      if (actingCount === 0 && supervisingCount === 0 && approvalCount === 0) {
        try {
          const [actingLeaves, supervisingLeaves, approvalLeaves] =
            await Promise.all([
              API.get("/leaves/pending/acting").catch(() => []),
              API.get("/leaves/pending/supervising").catch(() => []),
              API.get("/leaves/pending/approval").catch(() => []),
            ]);

          console.log("Direct fetch - Acting leaves:", actingLeaves);
          console.log("Direct fetch - Supervising leaves:", supervisingLeaves);
          console.log("Direct fetch - Approval leaves:", approvalLeaves);

          actingCount = Array.isArray(actingLeaves) ? actingLeaves.length : 0;
          supervisingCount = Array.isArray(supervisingLeaves)
            ? supervisingLeaves.length
            : 0;
          approvalCount = Array.isArray(approvalLeaves)
            ? approvalLeaves.length
            : 0;
        } catch (err) {
          console.error("Direct leave fetching also failed:", err);
        }
      }

      const total = actingCount + supervisingCount + approvalCount;

      const counts = {
        acting: actingCount,
        supervising: supervisingCount,
        approval: approvalCount,
        total: total,
      };

      console.log("Final approval counts:", counts);
      setApprovalCounts(counts);
      return counts;
    } catch (err) {
      console.error("Error fetching approval counts:", err);
      return { acting: 0, supervising: 0, approval: 0, total: 0 };
    }
  };

  // Logout function
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
      sessionStorage.clear();

      console.log("User logged out successfully");
      navigate("/");

      if (setSidebarOpen) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error during logout:", error);
      navigate("/");
    }
  };

  // Navigation handler
  const handleNavigation = (item) => {
    try {
      console.log("Navigating to:", item.route);

      if (setActiveTab) {
        setActiveTab(item.id);
      }

      navigate(item.route);

      // Close mobile sidebar after navigation
      if (isMobile && setSidebarOpen) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error("Navigation error:", error);
      navigate(item.route);
    }
  };

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    if (isMobile && setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // Effects
  useEffect(() => {
    if (token && email) {
      console.log("Initializing sidebar...");
      fetchCurrentUser();
      fetchApprovalCounts();

      const interval = setInterval(() => {
        fetchApprovalCounts();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [token, email]);

  useEffect(() => {
    if (activeTab === "approvals") {
      console.log("Navigated to approvals, refreshing counts...");
      fetchApprovalCounts();
    }
  }, [activeTab]);

  // Enhanced menu items
  const menuItems = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "DASHBOARD",
      route: "/Dashboard",
      badge: null,
    },
    {
      id: "submit",
      icon: FileText,
      label: "SUBMIT LEAVE",
      route: "/SubmitLeaveRequest",
      badge: null,
    },
    {
      id: "history",
      icon: Clock,
      label: "LEAVE HISTORY",
      route: "/LeaveHistory",
      badge: null,
    },
    {
      id: "approvals",
      icon: CheckCircle,
      label: "APPROVALS",
      route: "/Approvals",
      badge: approvalCounts.total > 0 ? approvalCounts.total : null,
    },
    {
      id: "settings",
      icon: Settings,
      label: "SETTINGS",
      route: "/Settings",
      badge: null,
    },
  ];

  // Get user name for display
  const userName = currentUser?.name || "Employee Name";
  const userInitial = getUserInitial(userName);
  const profileBgColor = getProfileBackgroundColor(userName);

  // Don't render sidebar on mobile unless it's open
  if (isMobile && !sidebarOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="position-fixed w-100 h-100 bg-dark bg-opacity-50"
          style={{
            zIndex: 1040,
            top: 0,
            left: 0,
          }}
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <div
        className={`position-fixed d-flex flex-column sidebar-container ${
          isMobile
            ? sidebarOpen
              ? "sidebar-mobile-open"
              : "sidebar-mobile-closed"
            : "sidebar-desktop"
        }`}
        style={{
          width: "280px",
          top: isMobile ? "0" : "60px",
          left: 0,
          zIndex: 1050,
          background: "linear-gradient(180deg, #59ba9b 0%, #185a9d 100%)",
          height: isMobile ? "100vh" : "calc(100vh - 60px)",
        }}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <div className="d-flex justify-content-end p-3">
            <button
              className="btn btn-link text-white p-1"
              onClick={handleOverlayClick}
              style={{ fontSize: "1.5rem" }}
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Profile Section */}
        <div className="p-4" style={{ paddingTop: isMobile ? "1rem" : "2rem" }}>
          <div
            className="d-flex align-items-center cursor-pointer"
            onClick={() => setShowProfileDetails(!showProfileDetails)}
            style={{ cursor: "pointer" }}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                background: profileBgColor,
                width: "35px",
                height: "35px",
                marginRight: "20px",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              <span
                className="text-white fw-bold"
                style={{
                  fontSize: "20px",
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                }}
              >
                {userInitial}
              </span>
            </div>
            <div>
              <div className="text-white fw-bold fs-6 mb-0">{userName}</div>
              <div
                className="text-white mb-3"
                style={{ fontSize: "14px", opacity: 0.9 }}
              >
                {currentUser?.designation || "Designation"}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          {showProfileDetails && currentUser && (
            <div className="mt-3">
              {currentUser.department && (
                <div className="d-flex align-items-center mb-2 p-2">
                  <Building
                    size={16}
                    className="me-2 text-white"
                    style={{ opacity: 0.8 }}
                  />
                  <span className="text-white small">
                    <strong>Section:</strong> {currentUser.department}
                  </span>
                </div>
              )}
              <div className="d-flex align-items-center p-2">
                <User
                  size={16}
                  className="me-2 text-white"
                  style={{ opacity: 0.8 }}
                />
                <span className="text-white small">
                  <strong>Email:</strong> {currentUser.email || "Not available"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-grow-1 px-0" style={{ overflowY: "auto" }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id || location.pathname === item.route;

            return (
              <div
                key={item.id}
                className="d-flex align-items-center justify-content-between position-relative sidebar-item"
                onClick={() => handleNavigation(item)}
                style={{
                  cursor: "pointer",
                  backgroundColor: isActive
                    ? "rgba(255, 255, 255, 0.1)"
                    : "transparent",
                  borderLeft: isActive
                    ? "6px solid #ffffffe1"
                    : "4px solid transparent",
                  transition: "all 0.2s ease",
                  padding: "16px 16px",
                  marginBottom: "8px",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <div className="d-flex align-items-center">
                  <Icon size={20} className="text-white me-3" />
                  <span
                    className="text-white fw-semibold"
                    style={{ fontSize: "15px", letterSpacing: "0.5px" }}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Notification Badge */}
                {item.badge && (
                  <span
                    className="badge bg-danger rounded-pill notification-badge position-absolute"
                    style={{
                      width: "30px",
                      height: "30px",
                      fontSize: "14px",
                      border: "2px solid transparent",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      top: "8px",
                      right: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Logout Button - Fixed positioning */}
        <div
          className="logout-section"
          style={{
            marginTop: "auto",
            padding: "16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            backgroundColor: "rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            className="d-flex align-items-center position-relative sidebar-item"
            onClick={handleLogout}
            style={{
              cursor: "pointer",
              padding: "12px 8px",
              borderRadius: "8px",
              transition: "all 0.2s ease",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.transform = "translateX(3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <LogOut size={20} className="text-white me-3" />
            <span
              className="text-white fw-semibold"
              style={{
                fontSize: "15px",
                letterSpacing: "0.5px",
                color: "#fff !important",
              }}
            >
              LOGOUT
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeSidebar;
