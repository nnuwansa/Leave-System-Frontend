import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import Login from "./Components/Logins/Login";

import AdminAddEmployee from "./Components/Admin/AdminAddEmployee";
import EmployeeAdmin from "./Components/Admin/EmployeeAdmin";
import AdminNavbar from "./Components/Navbar/AdminNavbar";
import DashboardAdmin from "./Components/Admin/DashboardAdmin";
import LeaveAdmin from "./Components/Admin/LeaveAdmin";
import DailyLeaveReport from "./Components/Admin/DailyLeaveReport";
import LeaveSummary from "./Components/Admin/LeaveSummary";
import AdminSidebar from "./Components/Navbar/AdminSidebar";
import AdminDashboard from "./Components/Admin/AdminDashboard";
import LeaveHistorySummary from "./Components/Admin/LeaveHistorySummary";
import EmergencyLeave from "./Components/Admin/EmergencyLeave";
import LateCoverageManagement from "./Components/Admin/LateCoverageManagement";
import AdminSettings from "./Components/Admin/AdminSettings";


// Employee components
import Dashboard from "./Components/Employee/Dashboard";
import SubmitLeaveRequest from "./Components/Employee/SubmitLeaveRequest";
import LeaveHistory from "./Components/Employee/LeaveHistory";
import Approvals from "./Components/Employee/Approvals";
import Settings from "./Components/Employee/Settings";

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Check if screen is mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      // Auto-close sidebar on mobile, keep it controlled on desktop
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false); // Keep closed on mobile by default
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleLogin = (username, password) => {
    if (username && password) {
      setIsLoggedIn(true);
    } else {
      alert("Please enter username and password!");
    }
  };

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const adminRoutes = [
    "/AdminAddEmployee",
    "/EmployeeAdmin",
    "/AdminDashboard",
    "/LeaveAdmin",
    "/LeaveSummary",
    "/DashboardAdmin",
    "/LeaveHistorySummary",
    "/AdminSettings",
    "/DailyReports",
    "/EmergencyLeave",
    "/LateCoverageManagement",
  ];

  // Routes that don't need admin layout (employee routes)
  const employeeRoutes = [
    "/Dashboard", // This is the employee dashboard
    "/SubmitLeaveRequest",
    "/LeaveHistory",
    "/Approvals",
    "/Settings",
  ];

  const showAdminLayout = adminRoutes.includes(location.pathname);
  const showEmployeeLayout = employeeRoutes.includes(location.pathname);

  return (
    <div className="app-container" style={{ height: "100vh" }}>
      {/* Show navbar for admin routes only */}
      {showAdminLayout && (
        <AdminNavbar
          onMenuToggle={handleMenuToggle}
          isSidebarOpen={isSidebarOpen}
        />
      )}

      <div
        style={{
          display: "flex",
          height: showAdminLayout ? "calc(100vh - 60px)" : "100vh",
        }}
      >
        {/* Show admin sidebar for admin routes only */}
        {showAdminLayout && (
          <AdminSidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
        )}

        <div
          style={{
            flex: 1,
            overflow: "auto",
            backgroundColor: "#f8f9fa",
          }}
        >
          <Routes>
            <Route path="/" element={<Login onLogin={handleLogin} />} />
            {/* ADMIN ROUTES */}
            <Route path="/DashboardAdmin" element={<DashboardAdmin />} />
            <Route path="/AdminAddEmployee" element={<AdminAddEmployee />} />
            <Route path="/EmployeeAdmin" element={<EmployeeAdmin />} />
            <Route path="/DailyReports" element={<DailyLeaveReport/>} />
            <Route path="/AdminDashboard" element={<AdminDashboard />} />
            <Route path="/LeaveAdmin" element={<LeaveAdmin />} />
            <Route path="/LeaveSummary" element={<LeaveSummary />} />
            <Route
              path="/LeaveHistorySummary"
              element={<LeaveHistorySummary />}
            />
            <Route path="/EmergencyLeave" element={<EmergencyLeave />} />
            <Route path="/LateCoverageManagement" element={<LateCoverageManagement />} />
            <Route path="/AdminSettings" element={<AdminSettings />} />
            {/* EMPLOYEE ROUTES */}
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route
              path="/SubmitLeaveRequest"
              element={<SubmitLeaveRequest />}
            />
            <Route path="/LeaveHistory" element={<LeaveHistory />} />
            <Route path="/Approvals" element={<Approvals />} />
            <Route path="/Settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default AppWrapper;
