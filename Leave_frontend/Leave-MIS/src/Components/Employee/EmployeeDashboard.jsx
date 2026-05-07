import React, { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  AlertCircle,
  User,
  Award,
  Send,
  Bell,
  ClipboardCheck,
  Settings as SettingsIcon,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../CSS/EmployeeDashboard.css";
import API from "../../utils/apiUtils";

// ---------------- Main Component ----------------
const EmployeeDashboard = () => {
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboardCounts, setDashboardCounts] = useState({
    pendingAsActingOfficer: 0,
    pendingAsApprovalOfficer: 0,
  });

  // ---------------- Utility Functions ----------------
  const showMessage = (message, isError = false) => {
    if (isError) {
      setError(message);
      setSuccess("");
    } else {
      setSuccess(message);
      setError("");
    }
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
  };

  // ---------------- Fetch Functions ----------------
  const fetchCurrentUser = async () => {
    try {
      const user = await API.get(`/admin/users/${email}`);
      setCurrentUser(user);
    } catch (err) {
      showMessage("Failed to fetch user", true);
      console.error(err);
    }
  };

  const fetchDashboardCounts = async () => {
    try {
      const counts = await API.get("/leaves/dashboard/counts");
      console.log("Dashboard counts received:", counts);
      setDashboardCounts(
        counts || {
          pendingAsActingOfficer: 0,
          pendingAsSupervisingOfficer: 0,
          pendingAsApprovalOfficer: 0,
        }
      );
    } catch (err) {
      console.error("Error fetching dashboard counts:", err);
    }
  };

  // ---------------- Effects ----------------
  useEffect(() => {
    if (!token || !email) {
      showMessage("Please log in to access the dashboard", true);
      return;
    }

    console.log("Initializing dashboard for user:", email);
    fetchCurrentUser();
    fetchDashboardCounts();
  }, [email, token]);

  if (!token || !email) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-warning d-flex align-items-center shadow-lg border-0 rounded-4">
              <AlertCircle size={20} className="me-3 text-warning" />
              <div>
                <h6 className="mb-1 fw-semibold">Authentication Required</h6>
                <p className="mb-0">
                  Please log in to access the employee dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container-fluid px-3 py-2"
      style={{
        minHeight: "auto",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Alert Messages */}
      {error && (
        <div
          className="alert alert-danger border-0 rounded-4 shadow-lg mb-4 slide-in"
          role="alert"
        >
          <div className="d-flex align-items-center">
            <XCircle size={20} className="me-3" />
            <div>
              <strong>Error!</strong> {error}
            </div>
          </div>
        </div>
      )}
      {success && (
        <div
          className="alert alert-success border-0 rounded-4 shadow-lg mb-4 slide-in"
          role="alert"
        >
          <div className="d-flex align-items-center">
            <CheckCircle size={20} className="me-3" />
            <div>
              <strong>Success!</strong> {success}
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="glass-card rounded-4 mb-4 mt-2">
        <div className="p-3">
          <div className="d-flex align-items-center">
            <div
              className="rounded-circle p-2 me-3 d-flex align-items-center justify-content-center"
              style={{
                background: "linear-gradient(135deg, #537bb3 0%, #2a487c 100%)",
                boxShadow: "0 10px 25px rgba(38, 54, 75, 0.3)",
                minWidth: "48px",
                height: "48px",
              }}
            >
              <User size={20} className="text-white" />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-1 fw-bold text-dark">
                LEAVE MANAGEMENT SYSTEM
              </h5>
              <p className="mb-1 text-muted small">
                Streamline your leave management experience
              </p>
              <h6 className="mb-0 fw-bold" style={{ color: "#3772d6" }}>
                WELCOME BACK, {currentUser?.name || "Employee"}!
              </h6>
            </div>
            <div className="d-none d-md-flex align-items-center">
              <div className="text-end me-3">
                <div className="text-muted small">Today</div>
                <div className="fw-semibold text-dark small">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
              <Bell size={20} className="text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Stats Cards */}
      {(dashboardCounts.pendingAsActingOfficer > 0 ||
        dashboardCounts.pendingAsApprovalOfficer > 0) && (
        <div className="row g-3 mb-4">
          <div className="col-lg-4">
            <div
              className="card border-0 shadow-lg rounded-4 dashboard-card"
              style={{
                background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                transform: "translateY(0)",
                transition: "all 0.3s ease-in-out",
                animation: "slideInLeft 0.6s ease-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle p-2 me-3 d-flex align-items-center justify-content-center icon-container"
                      style={{
                        background: "rgba(83, 123, 179, 0.15)",
                        transition: "all 0.3s ease",
                        animation: "pulse 2s infinite",
                        minWidth: "40px",
                        height: "40px",
                      }}
                    >
                      <Users size={20} className="text-primary" />
                    </div>
                    <div>
                      <h6
                        className="fw-bold text-dark mb-1"
                        style={{ fontSize: "0.8rem" }}
                      >
                        AS ACTING OFFICER
                      </h6>
                      <p
                        className="text-muted mb-0"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Pending your review
                      </p>
                    </div>
                  </div>
                  <div className="position-relative">
                    <span
                      className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center count-badge"
                      style={{
                        width: "35px",
                        height: "35px",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                      }}
                    >
                      {dashboardCounts.pendingAsActingOfficer}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div
              className="card border-0 shadow-lg rounded-4 dashboard-card"
              style={{
                background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                transform: "translateY(0)",
                transition: "all 0.3s ease-in-out",
                animation: "slideInRight 0.6s ease-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle p-2 me-3 d-flex align-items-center justify-content-center icon-container"
                      style={{
                        background: "rgba(40, 167, 69, 0.15)",
                        transition: "all 0.3s ease",
                        animation: "pulse 2s infinite",
                        minWidth: "40px",
                        height: "40px",
                      }}
                    >
                      <ClipboardCheck size={20} className="text-success" />
                    </div>
                    <div>
                      <h6
                        className="fw-bold text-dark mb-1"
                        style={{ fontSize: "0.8rem" }}
                      >
                        AS SUPERVISING OFFICER
                      </h6>
                      <p
                        className="text-muted mb-0"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Pending Supervisor Approval
                      </p>
                    </div>
                  </div>
                  <div className="position-relative">
                    <span
                      className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center count-badge"
                      style={{
                        width: "35px",
                        height: "35px",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                      }}
                    >
                      {dashboardCounts.pendingAsSupervisingOfficer}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div
              className="card border-0 shadow-lg rounded-4 dashboard-card"
              style={{
                background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                transform: "translateY(0)",
                transition: "all 0.3s ease-in-out",
                animation: "slideInRight 0.6s ease-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle p-2 me-3 d-flex align-items-center justify-content-center icon-container"
                      style={{
                        background: "rgba(40, 167, 69, 0.15)",
                        transition: "all 0.3s ease",
                        animation: "pulse 2s infinite",
                        minWidth: "40px",
                        height: "40px",
                      }}
                    >
                      <CheckCircle size={20} className="text-success" />
                    </div>
                    <div>
                      <h6
                        className="fw-bold text-dark mb-1"
                        style={{ fontSize: "0.8rem" }}
                      >
                        AS APPROVAL OFFICER
                      </h6>
                      <p
                        className="text-muted mb-0"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Awaiting final approval
                      </p>
                    </div>
                  </div>
                  <div className="position-relative">
                    <span
                      className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center count-badge"
                      style={{
                        width: "35px",
                        height: "35px",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                      }}
                    >
                      {dashboardCounts.pendingAsApprovalOfficer}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
