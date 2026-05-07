import React, { useEffect, useState } from "react";
import API from "../../API/axios";
import "../CSS/Admin.css";
import { FaEye, FaDownload } from "react-icons/fa";

// Loading
const LoadingDots = ({ message = "Loading..." }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "50px",
        minHeight: "300px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "15px",
              height: "15px",
              borderRadius: "50%",
              background: "linear-gradient(45deg, #185a9d 0%, #43cea2 100%)",
              animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <p
        style={{
          color: "#555",
          fontSize: "16px",
          fontWeight: "500",
          margin: 0,
        }}
      >
        {message}
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
  );
};

export default function LeaveAdmin() {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);

  // Maternity leave states
  const [maternityLeaves, setMaternityLeaves] = useState([]);
  const [selectedMaternityLeave, setSelectedMaternityLeave] = useState(null);
  const [isSettingEndDate, setIsSettingEndDate] = useState(false);
  const [endDateForm, setEndDateForm] = useState({
    endDate: "",
    comments: "",
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState({
    start: "",
    end: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [maternityLoading, setMaternityLoading] = useState(false);

  // Fetch all leaves
  const fetchAllLeaves = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/admin/leaves", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setLeaves(res.data);
      setFilteredLeaves(res.data);
    } catch (err) {
      console.error(
        "❌ Fetch leaves error:",
        err.response?.data || err.message
      );
      setError("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  // Debug function to check token
  const debugToken = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("Token payload:", payload);
        console.log("User roles:", payload.roles || "No roles found");
      } catch (e) {
        console.log("Could not decode token:", e);
      }
    }
  };

  // Fetch maternity leaves needing end date
  const fetchMaternityLeaves = async () => {
    setMaternityLoading(true);
    debugToken();
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/leaves/admin/maternity/pending-end-date", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Maternity leaves response:", res.data);
      setMaternityLeaves(res.data || []);
    } catch (err) {
      console.error(
        "❌ Fetch maternity leaves error:",
        err.response?.data || err.message
      );

      const maternityFromLeaves = leaves.filter((leave) => {
        const isMaternity = leave.leaveType === "MATERNITY";
        const isApproved = leave.status === "APPROVED";
        const noEndDate = !leave.endDate || leave.endDate === null;

        console.log(`Leave ${leave.id}:`, {
          type: leave.leaveType,
          status: leave.status,
          endDate: leave.endDate,
          shouldInclude: isMaternity && isApproved && noEndDate,
        });

        return isMaternity && isApproved && noEndDate;
      });

      console.log(
        "Filtered maternity leaves from main data:",
        maternityFromLeaves
      );
      setMaternityLeaves(maternityFromLeaves);
    } finally {
      setMaternityLoading(false);
    }
  };

  // Set maternity leave end date
  const setMaternityEndDate = async (leaveId) => {
    try {
      const token = localStorage.getItem("token");

      console.log("Attempting to set end date for leave:", leaveId);
      console.log("End date form:", endDateForm);

      const response = await API.post(
        `/leaves/admin/maternity/${leaveId}/set-end-date`,
        endDateForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("✅ " + response.data.replace("✅ ", ""));

      await fetchMaternityLeaves();
      await fetchAllLeaves();

      setEndDateForm({ endDate: "", comments: "" });
      setIsSettingEndDate(false);
      setSelectedMaternityLeave(null);
    } catch (err) {
      console.error("Set end date error:", err);

      if (err.response?.status === 403) {
        alert(`❌ Backend admin validation failed. 
        
Your token has ADMIN role but backend validation is not working properly.

Please:
1. Check your JwtUtil.extractRoles() method
2. Verify your User.getRoles() returns the correct format
3. Or temporarily disable admin role checking in LeaveController

Error: ${err.response?.data || err.message}`);
      } else {
        const errorMessage =
          err.response?.data?.replace?.("❌ ", "") ||
          err.message ||
          "Failed to set end date";
        alert("❌ " + errorMessage);
      }
    }
  };

  useEffect(() => {
    fetchAllLeaves();
  }, []);

  useEffect(() => {
    if (leaves.length > 0) {
      fetchMaternityLeaves();
    }
  }, [leaves]);

  // Apply filters
  useEffect(() => {
    let filtered = [...leaves];

    if (statusFilter) {
      filtered = filtered.filter((leave) => leave.status === statusFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter((leave) => leave.leaveType === typeFilter);
    }

    if (departmentFilter) {
      filtered = filtered.filter(
        (leave) => leave.department === departmentFilter
      );
    }

    if (employeeFilter) {
      filtered = filtered.filter(
        (leave) =>
          (leave.employeeName &&
            leave.employeeName
              .toLowerCase()
              .includes(employeeFilter.toLowerCase())) ||
          (leave.employeeEmail &&
            leave.employeeEmail
              .toLowerCase()
              .includes(employeeFilter.toLowerCase())) ||
          (leave.employeeFullName &&
            leave.employeeFullName
              .toLowerCase()
              .includes(employeeFilter.toLowerCase()))
      );
    }

    if (dateRangeFilter.start) {
      filtered = filtered.filter(
        (leave) => leave.startDate >= dateRangeFilter.start
      );
    }

    if (dateRangeFilter.end) {
      filtered = filtered.filter(
        (leave) => leave.endDate <= dateRangeFilter.end
      );
    }

    setFilteredLeaves(filtered);
    setCurrentPage(1);
  }, [
    statusFilter,
    typeFilter,
    departmentFilter,
    employeeFilter,
    dateRangeFilter,
    leaves,
  ]);

  // Get unique values for filters
  const uniqueStatuses = [...new Set(leaves.map((l) => l.status))];
  const uniqueTypes = [...new Set(leaves.map((l) => l.leaveType))];
  const uniqueDepartments = [
    ...new Set(leaves.map((l) => l.department).filter(Boolean)),
  ];

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredLeaves.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredLeaves.length / rowsPerPage);

  // Status styling
  const getStatusStyle = (status) => {
    const baseStyle = "px-2 py-1 text-xs font-bold rounded text-center";
    switch (status) {
      case "APPROVED":
        return `${baseStyle} bg-green-100 text-green-800`;
      case "PENDING_ACTING_OFFICER":
      case "PENDING_SUPERVISING_OFFICER":
      case "PENDING_APPROVAL_OFFICER":
        return `${baseStyle} bg-yellow-100 text-yellow-800`;
      case "REJECTED_BY_ACTING_OFFICER":
      case "REJECTED_BY_SUPERVISING_OFFICER":
      case "REJECTED_BY_APPROVAL_OFFICER":
        return `${baseStyle} bg-red-100 text-red-800`;
      case "CANCELLED_BY_EMPLOYEE":
        return `${baseStyle} bg-gray-100 text-gray-800`;
      default:
        return `${baseStyle} bg-blue-100 text-blue-800`;
    }
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  

  const calculateLeaveDays = (startDate, endDate, duration, workingDays) => {
    //  USE WORKING DAYS IF AVAILABLE
    if (workingDays !== undefined && workingDays !== null && workingDays > 0) {
      if (workingDays === 0.5) return "0.5 working day";
      if (workingDays === 1) return "1 working day";
      return `${workingDays} working days`;
    }

    if (duration) return duration;
    if (!startDate || !endDate) return "N/A";

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  };

  const exportToCSV = () => {
    const headers = [
      "Employee Name",
      "Email",
      "Section",
      "Leave Type",
      "Start Date",
      "End Date",
      "Days",
      "Status",
      "Reason",
      "Created At",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredLeaves.map((leave) =>
        [
          leave.employeeFullName || leave.employeeName,
          leave.employeeEmail,
          leave.department,
          leave.leaveType,
          leave.startDate,
          leave.endDate,
          calculateLeaveDays(
            leave.startDate,
            leave.endDate,
            leave.leaveDuration,
            leave.workingDays
          ),
          formatStatus(leave.status),
          `"${leave.reason || ""}"`,
          new Date(leave.createdAt).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave_requests_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const resetFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
    setDepartmentFilter("");
    setEmployeeFilter("");
    setDateRangeFilter({ start: "", end: "" });
  };

  // Leave Detail Modal Component
  const LeaveDetailModal = ({ leave, onClose }) => {
    if (!leave) return null;

    return (
      <div className="modal-overlay">
        <div className="modal" style={{ width: "800px", maxWidth: "90vw" }}>
          <div className="modal-header">
            <h2 style={{ color: "white", margin: 0 }}>Leave Request Details</h2>
            <button className="btn-close" onClick={onClose}>
              ✖
            </button>
          </div>

          <div style={{ padding: "20px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <div>
                <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>
                  Employee Information
                </h4>
                <p>
                  <strong>Name:</strong>{" "}
                  {leave.employeeFullName || leave.employeeName}
                </p>
                <p>
                  <strong>Email:</strong> {leave.employeeEmail}
                </p>
                <p>
                  <strong>Department:</strong> {leave.department}
                </p>
                <p>
                  <strong>Designation:</strong>{" "}
                  {leave.employeeDesignation || "N/A"}
                </p>
              </div>

              <div>
                <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>
                  Leave Details
                </h4>
                <p>
                  <strong>Type:</strong> {leave.leaveType?.replace("_", " ")}
                </p>
                <p>
                  <strong>Start Date:</strong> {leave.startDate}
                </p>
                <p>
                  <strong>End Date:</strong> {leave.endDate}
                </p>
                <p>
                  <strong>Duration:</strong>{" "}
                  {calculateLeaveDays(
                    leave.startDate,
                    leave.endDate,
                    leave.leaveDuration,
                    leave.workingDays // ADD THIS
                  )}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className={getStatusStyle(leave.status)}>
                    {formatStatus(leave.status)}
                  </span>
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>Reason</h4>
              <p
                style={{
                  background: "#f8f9fa",
                  padding: "10px",
                  borderRadius: "4px",
                }}
              >
                {leave.reason || "No reason provided"}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <div>
                <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>
                  Acting Officer
                </h4>
                <p>
                  <strong>Name:</strong> {leave.actingOfficerName || "N/A"}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {formatStatus(leave.actingOfficerStatus) || "Pending"}
                </p>
              </div>

              <div>
                <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>
                  Supervising Officer
                </h4>
                <p>
                  <strong>Name:</strong> {leave.supervisingOfficerName || "N/A"}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {formatStatus(leave.supervisingOfficerStatus) || "Pending"}
                </p>
              </div>

              <div>
                <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>
                  Approval Officer
                </h4>
                <p>
                  <strong>Name:</strong> {leave.approvalOfficerName || "N/A"}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {formatStatus(leave.approvalOfficerStatus) || "Pending"}
                </p>
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>
                Timeline
              </h4>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(leave.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div className="header-heading">
        <h3>Leave Requests Management</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="btn-add"
            onClick={exportToCSV}
            style={{
              background: "#28a745",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>

      <div className="dashboard-paragraph">
        <p>
          Monitor and manage all employee leave requests across the
          organization.
        </p>
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

      {/* Advanced Filters */}
      <div
        className="filters"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginBottom: "20px",
          padding: "20px",
          background: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Leave Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type === "SICK" ? "VACATION" : type?.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Section
          </label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Sections</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Employee
          </label>
          <input
            type="text"
            placeholder="Search by name or email"
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Start Date From
          </label>
          <input
            type="date"
            value={dateRangeFilter.start}
            onChange={(e) =>
              setDateRangeFilter((prev) => ({ ...prev, start: e.target.value }))
            }
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Start Date To
          </label>
          <input
            type="date"
            value={dateRangeFilter.end}
            onChange={(e) =>
              setDateRangeFilter((prev) => ({ ...prev, end: e.target.value }))
            }
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "end", gap: "10px" }}>
          <button className="btn-reset" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            background: "#e3f2fd",
            padding: "15px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h5
            style={{
              margin: "0 0 5px 0",
              color: "#1976d2",
            }}
          >
            TOTAL REQUESTS
          </h5>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            {filteredLeaves.length}
          </p>
        </div>
        <div
          style={{
            background: "#e8f5e8",
            padding: "15px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h5 style={{ margin: "0 0 5px 0", color: "#388e3c" }}>APPROVED</h5>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            {filteredLeaves.filter((l) => l.status === "APPROVED").length}
          </p>
        </div>
        <div
          style={{
            background: "#fff3e0",
            padding: "15px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h5 style={{ margin: "0 0 5px 0", color: "#f57c00" }}>PENDING</h5>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            {filteredLeaves.filter((l) => l.status?.includes("PENDING")).length}
          </p>
        </div>
        <div
          style={{
            background: "#ffebee",
            padding: "15px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h5 style={{ margin: "0 0 5px 0", color: "#d32f2f" }}>REJECTED</h5>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            {
              filteredLeaves.filter((l) => l.status?.includes("REJECTED"))
                .length
            }
          </p>
        </div>
      </div>

      {/* Table with Loading Dots */}
      {loading ? (
        <LoadingDots message="Loading leave requests..." />
      ) : (
        <>
          <table className="user-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length > 0 ? (
                currentRows.map((leave) => (
                  <tr key={leave.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: "bold" }}>
                          {leave.employeeFullName || leave.employeeName}
                        </div>
                        <div style={{ fontSize: "10px", color: "#666" }}>
                          {leave.employeeEmail}
                        </div>
                      </div>
                    </td>
                    <td>{leave.department}</td>
                    <td>
                      <span
                        style={{
                          background:
                            leave.leaveType === "CASUAL"
                              ? "#e3f2fd"
                              : leave.leaveType === "SICK"
                              ? "#ffebee"
                              : leave.leaveType === "MATERNITY"
                              ? "#e8f5e8"
                              : "#f3e5f5",
                          color:
                            leave.leaveType === "CASUAL"
                              ? "#1976d2"
                              : leave.leaveType === "SICK"
                              ? "#d32f2f"
                              : leave.leaveType === "MATERNITY"
                              ? "#388e3c"
                              : "#7b1fa2",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: "bold",
                        }}
                      >
                        {leave.leaveType === "SICK"
                          ? "VACATION"
                          : leave.leaveType?.replace("_", " ")}
                      </span>
                    </td>

                    <td>{leave.startDate}</td>
                    <td>{leave.endDate || "Not Set"}</td>
                    <td>
                      {calculateLeaveDays(
                        leave.startDate,
                        leave.endDate,
                        leave.leaveDuration,
                        leave.workingDays
                      )}
                    </td>
                    <td>
                      <span className={getStatusStyle(leave.status)}>
                        {formatStatus(leave.status)}
                      </span>
                    </td>
                    <td>{new Date(leave.createdAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <FaEye
                        className="icon-btn update-icon"
                        onClick={() => {
                          setSelectedLeave(leave);
                          setIsViewingDetails(true);
                        }}
                        title="View Details"
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-users">
                    No leave requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <label>
              Rows per page:{" "}
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
              </select>
            </label>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Leave Detail Modal */}
      {isViewingDetails && selectedLeave && (
        <LeaveDetailModal
          leave={selectedLeave}
          onClose={() => {
            setIsViewingDetails(false);
            setSelectedLeave(null);
          }}
        />
      )}
    </div>
  );
}
