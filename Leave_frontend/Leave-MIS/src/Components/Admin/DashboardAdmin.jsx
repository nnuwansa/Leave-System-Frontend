import React, { useState, useEffect } from "react";
import API from "../../API/axios";
import "../CSS/Admin.css";
import { FaBaby, FaUsers, FaCalendarCheck, FaChartLine } from "react-icons/fa";
import MaternityLeaveCard from "./MaternityLeaveCard";

const DashboardAdmin = () => {
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    maternityLeaves: [],
    recentLeaves: [],
  });
  const [loadingStates, setLoadingStates] = useState({
    leaves: true,
    employees: true,
    maternity: true,
  });
  const [error, setError] = useState("");

  
  useEffect(() => {
   
    setLoadingStates({ leaves: true, employees: true, maternity: true });

    
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const token = localStorage.getItem("token");

    try {
      
      const leavesPromise = API.get("/admin/leaves", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          const leaves = response.data || [];

          
          const totalLeaves = leaves.length;
          const pendingLeaves = leaves.filter((l) =>
            l.status?.includes("PENDING")
          ).length;
          const approvedLeaves = leaves.filter(
            (l) => l.status === "APPROVED"
          ).length;

         
          const maternityLeaves = leaves.filter(
            (l) =>
              l.leaveType === "MATERNITY" &&
              l.status === "APPROVED" &&
              (!l.endDate || l.endDate === null)
          );

          // Get recent leaves
          const recentLeaves = leaves
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

          setDashboardData((prev) => ({
            ...prev,
            totalLeaves,
            pendingLeaves,
            approvedLeaves,
            maternityLeaves,
            recentLeaves,
          }));

          setLoadingStates((prev) => ({
            ...prev,
            leaves: false,
            maternity: false,
          }));

          return leaves;
        })
        .catch((err) => {
          console.error("Leaves fetch error:", err);
          setError("Failed to fetch leave data");
          setLoadingStates((prev) => ({ ...prev, leaves: false }));
          return [];
        });

      // Load employees data separately (less critical)
      const employeesPromise = API.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          const employees = response.data || [];
          setDashboardData((prev) => ({
            ...prev,
            totalEmployees: employees.length,
          }));
          setLoadingStates((prev) => ({ ...prev, employees: false }));
        })
        .catch((err) => {
          console.warn("Employees endpoint not available:", err.message);
          setLoadingStates((prev) => ({ ...prev, employees: false }));
        });

      // Wait for both to complete
      await Promise.all([leavesPromise, employeesPromise]);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to fetch dashboard data");
      setLoadingStates({ leaves: false, employees: false, maternity: false });
    }
  };

  // Handle maternity leave data changes
  const handleMaternityDataChange = () => {
    
    loadDashboardData();
  };

  // Loading skeleton component
  const StatCardSkeleton = ({ children }) => (
    <div
      style={{
        background:
          "linear-gradient(90deg, #f0f0f0 25%, transparent 50%, #f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation: loadingStates.leaves ? "shimmer 1.5s infinite" : "none",
        padding: "20px",
        borderRadius: "10px",
        textAlign: "center",
        minHeight: "120px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {children}
    </div>
  );

  return (
    <div className="dashboard">
      {/* Add keyframe animation for skeleton */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {/* Header - Show immediately */}
      <div className="header-heading">
        <h3>Admin Dashboard</h3>
      </div>
      <div>
        <div className="dashboard-paragraph">
          <p>Welcome back! Here's what's happening with your organization.</p>
        </div>
      </div>
      {error && (
        <div
          style={{
            background: "#ffe6e6",
            color: "#c0392b",
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", // smaller cards
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        {/* Employees Card */}
        {loadingStates.employees ? (
          <StatCardSkeleton>
            <FaUsers size={20} style={{ marginBottom: "8px", color: "#ddd" }} />
            <div
              style={{
                background: "#ddd",
                height: "26px",
                width: "50px",
                borderRadius: "4px",
                margin: "0 auto 4px",
              }}
            ></div>
            <div
              style={{
                background: "#ddd",
                height: "12px",
                width: "80px",
                borderRadius: "4px",
                margin: "0 auto",
              }}
            ></div>
          </StatCardSkeleton>
        ) : (
          <div
            style={{
              background: "linear-gradient(135deg, #a7d8f0 0%, #65b9df 100%)",
              color: "white",
              padding: "12px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <FaUsers size={24} style={{ marginBottom: "6px" }} />
            <h2 style={{ margin: "0", fontSize: "24px" }}>
              {dashboardData.totalEmployees}
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
              Total Employees
            </p>
          </div>
        )}

        {/* Total Leaves Card */}
        {loadingStates.leaves ? (
          <StatCardSkeleton>
            <FaCalendarCheck
              size={24}
              style={{ marginBottom: "8px", color: "#ddd" }}
            />
            <div
              style={{
                background: "#ddd",
                height: "26px",
                width: "50px",
                borderRadius: "4px",
                margin: "0 auto 4px",
              }}
            ></div>
            <div
              style={{
                background: "#ddd",
                height: "12px",
                width: "90px",
                borderRadius: "4px",
                margin: "0 auto",
              }}
            ></div>
          </StatCardSkeleton>
        ) : (
          <div
            style={{
              background: "linear-gradient(165deg, #6ebaa2 0%, #6fceae 100%)",
              color: "white",
              padding: "12px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <FaCalendarCheck size={24} style={{ marginBottom: "6px" }} />
            <h2 style={{ margin: "0", fontSize: "24px" }}>
              {dashboardData.totalLeaves}
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
              Total Leave Requests
            </p>
          </div>
        )}

        {/* Pending Leaves Card */}
        {loadingStates.leaves ? (
          <StatCardSkeleton>
            <FaChartLine
              size={24}
              style={{ marginBottom: "8px", color: "#ddd" }}
            />
            <div
              style={{
                background: "#ddd",
                height: "26px",
                width: "50px",
                borderRadius: "4px",
                margin: "0 auto 4px",
              }}
            ></div>
            <div
              style={{
                background: "#ddd",
                height: "12px",
                width: "90px",
                borderRadius: "4px",
                margin: "0 auto",
              }}
            ></div>
          </StatCardSkeleton>
        ) : (
          <div
            style={{
              background: "linear-gradient(135deg, #92e0c8 0%, #4ba7ab 100%)",
              color: "white",
              padding: "12px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <FaChartLine size={24} style={{ marginBottom: "6px" }} />
            <h2 style={{ margin: "0", fontSize: "24px" }}>
              {dashboardData.pendingLeaves}
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
              Pending Approvals
            </p>
          </div>
        )}

        {/* Maternity Leaves Card */}
        {loadingStates.maternity ? (
          <StatCardSkeleton>
            <FaBaby size={24} style={{ marginBottom: "8px", color: "#ddd" }} />
            <div
              style={{
                background: "#ddd",
                height: "26px",
                width: "50px",
                borderRadius: "4px",
                margin: "0 auto 4px",
              }}
            ></div>
            <div
              style={{
                background: "#ddd",
                height: "12px",
                width: "100px",
                borderRadius: "4px",
                margin: "0 auto",
              }}
            ></div>
          </StatCardSkeleton>
        ) : (
          <div
            style={{
              background: "linear-gradient(135deg, #c8e6c9 0%, #5ac782 100%)",
              color: "white",
              padding: "12px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <FaBaby size={24} style={{ marginBottom: "6px" }} />
            <h2 style={{ margin: "0", fontSize: "24px" }}>
              {dashboardData.maternityLeaves.length}
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
              Maternity Leaves Pending
            </p>
          </div>
        )}
      </div>

      {/* Maternity Leaves Section - Show as soon as data is available */}
      {!loadingStates.maternity && dashboardData.maternityLeaves.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
              padding: "15px",

              background: "linear-gradient(135deg, #59ba9b 0%, #185a9d 100%)",
              borderRadius: "8px",
              color: "white",
            }}
          >
            <FaBaby size={24} />
            <h5 style={{ margin: 0 }}>
              Maternity Leaves Awaiting End Date (
              {dashboardData.maternityLeaves.length})
            </h5>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "15px",
            }}
          >
            {dashboardData.maternityLeaves.map((leave) => (
              <MaternityLeaveCard
                key={leave.id}
                leave={leave}
                onDataChange={handleMaternityDataChange}
                showDebugInfo={false}
              />
            ))}
          </div>
        </div>
      )}

     
      {loadingStates.leaves && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #185a9d 0%, #43cea2 100%)",
                  animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <p
            style={{
              marginTop: "10px",
              color: "#666",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Loading recent leave requests...
          </p>

          <style>{`
      @keyframes bounce {
        0%, 80%, 100% { 
          transform: scale(0);
          opacity: 0.5;
        }
        40% { 
          transform: scale(1);
          opacity: 1;
        }
      }
    `}</style>
        </div>
      )}

      {!loadingStates.leaves && dashboardData.recentLeaves.length > 0 && (
  <div style={{ marginTop: "30px" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "20px",
        padding: "15px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "8px",
        color: "white",
      }}
    >
      <FaCalendarCheck size={22} />
      <h5 style={{ margin: 0 }}>
        Recent Leave Requests ({dashboardData.recentLeaves.length})
      </h5>
    </div>

    <div style={{ display: "grid", gap: "12px" }}>
      {dashboardData.recentLeaves.map((leave) => {
        // Status badge colors
        const statusColors = {
          APPROVED: { bg: "#e6f7ed", text: "#1e8e4f", border: "#a3e6be" },
          PENDING: { bg: "#fff8e1", text: "#b8860b", border: "#f5deb3" },
          PENDING_ACTING: { bg: "#fff8e1", text: "#b8860b", border: "#f5deb3" },
          PENDING_APPROVAL: { bg: "#fff8e1", text: "#b8860b", border: "#f5deb3" },
          REJECTED: { bg: "#fde8e8", text: "#c0392b", border: "#f5b7b1" },
          CANCELLED: { bg: "#f0f0f0", text: "#777", border: "#ddd" },
        };
        const statusStyle =
          statusColors[leave.status] ||
          { bg: "#eef2f7", text: "#555", border: "#ddd" };

        // Leave type colors/labels
        const leaveTypeLabels = {
          MATERNITY: "🤱 Maternity",
          HALF_DAY: "🕐 Half Day",
          CASUAL: "🌴 Casual",
          SICK: "🤒 Sick",
          ANNUAL: "📅 Annual",
        };
        const leaveTypeLabel =
          leaveTypeLabels[leave.leaveType] || leave.leaveType;

        return (
          <div
            key={leave.id}
            style={{
              padding: "16px 20px",
              background: "white",
              border: "1px solid #ececec",
              borderRadius: "10px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "box-shadow 0.2s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              {/* Left: employee info */}
              <div style={{ flex: "1", minWidth: "200px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <strong style={{ fontSize: "15px", color: "#222" }}>
                    {leave.employeeFullName || leave.employeeName}
                  </strong>
                  {leave.isCancelled && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#c0392b",
                        fontWeight: 600,
                      }}
                    >
                      (Cancelled)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "13px", color: "#777" }}>
                  {leave.employeeDesignation}
                  {leave.department ? ` • ${leave.department}` : ""}
                </div>
              </div>

              {/* Right: status badge */}
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: statusStyle.bg,
                  color: statusStyle.text,
                  border: `1px solid ${statusStyle.border}`,
                  whiteSpace: "nowrap",
                }}
              >
                {leave.status}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #f2f2f2",
                fontSize: "13px",
                color: "#555",
              }}
            >
              <div>
                <span style={{ color: "#999" }}>Type: </span>
                {leaveTypeLabel}
              </div>

              {leave.leaveDuration && (
                <div>
                  <span style={{ color: "#999" }}>Duration: </span>
                  {leave.leaveDuration}
                </div>
              )}

              {leave.endDate && (
                <div>
                  <span style={{ color: "#999" }}>End Date: </span>
                  {new Date(leave.endDate).toLocaleDateString()}
                </div>
              )}

              <div>
                <span style={{ color: "#999" }}>Requested: </span>
                {new Date(leave.createdAt).toLocaleDateString()}
              </div>
            </div>

            {leave.reason && (
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "13px",
                  color: "#444",
                  background: "#fafafa",
                  padding: "8px 12px",
                  borderRadius: "6px",
                }}
              >
                <span style={{ color: "#999" }}>Reason: </span>
                {leave.reason}
              </div>
            )}

            {(leave.actingOfficerName || leave.approvalOfficerName) && (
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  fontSize: "12px",
                  color: "#888",
                }}
              >
                {leave.actingOfficerName && (
                  <div>
                    Acting Officer: <strong>{leave.actingOfficerName}</strong>{" "}
                    ({leave.actingOfficerStatus})
                  </div>
                )}
                {leave.approvalOfficerName && (
                  <div>
                    Approval Officer:{" "}
                    <strong>{leave.approvalOfficerName}</strong> (
                    {leave.approvalOfficerStatus})
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
    </div>
  );
};

export default DashboardAdmin;
