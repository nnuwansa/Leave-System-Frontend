import React, { useState } from "react";
import { FaBaby, FaSave, FaTimes } from "react-icons/fa";
import API from "../../API/axios";

const MaternityLeaveCard = ({ leave, onDataChange, showDebugInfo = false }) => {
  const [isSettingEndDate, setIsSettingEndDate] = useState(false);
  const [endDateForm, setEndDateForm] = useState({
    endDate: "",
    comments: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  

  // Calculate days since approval
  const calculateDaysSinceApproval = (leave) => {
    if (!leave.createdAt && !leave.approvedAt) return 0;

    const approvalDate = leave.approvedAt
      ? new Date(leave.approvedAt)
      : new Date(leave.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - approvalDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceApproval = calculateDaysSinceApproval(leave);
  const isUrgent = daysSinceApproval > 7;

  // Set maternity leave end date
  const handleSetEndDate = async () => {
    if (!endDateForm.endDate) {
      alert("Please select an end date");
      return;
    }

    if (new Date(endDateForm.endDate) < new Date(leave.startDate)) {
      alert("End date cannot be before start date");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      const response = await API.post(
        `/leaves/admin/maternity/${leave.id}/set-end-date`,
        {
          endDate: endDateForm.endDate,
          comments: endDateForm.comments.trim() || "End date set by admin",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Maternity leave end date set successfully!");
      setEndDateForm({ endDate: "", comments: "" });
      setIsSettingEndDate(false);

      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Error setting end date:", error);

      let errorMessage = "Failed to set end date";
      if (error.response?.status === 403) {
        errorMessage = "Access denied. Admin role validation failed.";
      } else if (error.response?.status === 404) {
        errorMessage =
          "Leave request not found or not eligible for end date setting";
      } else if (error.response?.data) {
        errorMessage =
          error.response.data.replace?.("❌ ", "") || error.response.data;
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartSetEndDate = () => {
    setIsSettingEndDate(true);
    setEndDateForm({
      endDate: "",
      comments: `End date set for ${
        leave.employeeFullName || leave.employeeName
      }`,
    });
  };

  const handleCancelSetEndDate = () => {
    setIsSettingEndDate(false);
    setEndDateForm({ endDate: "", comments: "" });
  };

  const getEmployeeName = () => {
    return (
      leave.employeeFullName ||
      leave.employeeName ||
      leave.employeeEmail?.split("@")[0] ||
      "Unknown Employee"
    );
  };

  const getLeaveTypeDisplay = () => {
    // Fixed: Check for the actual property name (not a method)
    const maternityType =
      leave.maternityLeaveType || // Fixed: removed 'get' prefix
      leave.maternity_leave_type ||
      leave.maternityType;

    if (maternityType) {
      return maternityType.replace(/_/g, " ");
    }

    // If it's a maternity leave but no specific type, show the leave type
    if (leave.isMaternityLeave || leave.leaveType === "MATERNITY") {
      return "MATERNITY";
    }

    return leave.leaveType?.replace(/_/g, " ") || "MATERNITY";
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength - 3) + "..."
      : text;
  };

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #fefefe 0%, #f8f9fa 100%)",
        border: `1px solid ${isUrgent ? "#d6336c" : "#8e9aaf"}`,
        borderRadius: "12px",
        padding: "16px",
        position: "relative",
        fontSize: "13px",
        minHeight: "240px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        transition: "all 0.3s ease",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Priority Badge */}
      {isUrgent && (
        <div
          style={{
            position: "absolute",
            top: "-6px",
            right: "12px",
            background: "#d6336c",
            color: "white",
            padding: "4px 10px",
            borderRadius: "16px",
            fontSize: "10px",
            fontWeight: "600",
            letterSpacing: "0.5px",
            boxShadow: "0 2px 6px rgba(214, 51, 108, 0.3)",
          }}
        >
          PRIORITY
        </div>
      )}

      {/* Header Section - Single Line Layout */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {/* Baby Icon */}
          <div
            style={{
              background: "linear-gradient(135deg, #59ba9b 0%, #1c9d74 100%)",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FaBaby color="white" size={12} />
          </div>

          {/* Employee Name */}
          <div style={{ minWidth: "0", flex: "1 1 120px" }}>
            <h3
              style={{
                margin: "0",
                color: "#2c3e50",
                fontSize: "18px",
                fontWeight: "600",
                lineHeight: "1.2",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {truncateText(getEmployeeName(), 20)}
            </h3>
          </div>

          {/* Department Badge */}
          <div
            style={{
              background: "#e9ecef",
              color: "#495057",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "500",
              border: "1px solid #dee2e6",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {truncateText(leave.department || "No Dept", 12)}
          </div>

          {/* Maternity Leave Type Badge */}
          <div
            style={{
              background: "#e8f5e8",
              color: "#28a745",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "600",
              border: "1px solid #c3e6c3",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {getLeaveTypeDisplay()}
          </div>

          {/* Email (if space allows) */}
          <div
            style={{
              color: "#6c757d",
              fontSize: "12px",
              fontWeight: "400",
              minWidth: "0",
              flex: "0 1 auto",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {truncateText(leave.employeeEmail || "", 20)}
          </div>
        </div>
      </div>

      {/* Leave Details Section - Horizontal Layout */}
      <div style={{ marginBottom: "16px", flex: 1 }}>
        {/* Leave Type Badge */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "10px",
            marginBottom: "12px",
            padding: "8px",
            background: "#f8f9fa",
            borderRadius: "6px",
            border: "1px solid #e9ecef",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                margin: "0 0 2px 0",
                fontSize: "11px",
                color: "#6c757d",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              START DATE
            </p>
            <p
              style={{
                margin: "0",
                fontSize: "14px",
                color: "#2c3e50",
                fontWeight: "600",
              }}
            >
              {leave.startDate || "Not set"}
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <p
              style={{
                margin: "0 0 2px 0",
                fontSize: "11px",
                color: "#6c757d",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              END DATE
            </p>
            <p
              style={{
                margin: "0",
                fontSize: "12px",
                color: leave.endDate ? "#2c3e50" : "#dc3545",
                fontWeight: "600",
              }}
            >
              {leave.endDate || "NOT SET"}
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <p
              style={{
                margin: "0 0 2px 0",
                fontSize: "11px",
                color: "#6c757d",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              WAITING
            </p>
            <p style={{ margin: "0", fontSize: "13px", fontWeight: "600" }}>
              <span style={{ color: isUrgent ? "#d6336c" : "#6c757d" }}>
                {daysSinceApproval}d
              </span>
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <p
              style={{
                margin: "0 0 2px 0",
                fontSize: "11px",
                color: "#6c757d",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              REASON
            </p>
            <p
              style={{
                margin: "0 auto",
                fontSize: "12px",
                color: "#495057",
                fontWeight: "500",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100px",
              }}
              title={leave.reason || "No reason provided"}
            >
              {truncateText(leave.reason || "No reason provided", 30)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div style={{ marginTop: "auto" }}>
        {isSettingEndDate ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Form Fields - Horizontal Layout */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 3fr",
                gap: "8px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "9px",
                    fontWeight: "600",
                    marginBottom: "3px",
                    color: "#495057",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  value={endDateForm.endDate}
                  onChange={(e) =>
                    setEndDateForm((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  min={leave.startDate}
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "10px",
                    backgroundColor: "#ffffff",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "9px",
                    fontWeight: "600",
                    marginBottom: "3px",
                    color: "#495057",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Comments
                </label>
                <textarea
                  placeholder="Optional comments..."
                  value={endDateForm.comments}
                  onChange={(e) =>
                    setEndDateForm((prev) => ({
                      ...prev,
                      comments: e.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "9px",
                    resize: "none",
                    height: "32px",
                    backgroundColor: "#ffffff",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={handleSetEndDate}
                disabled={!endDateForm.endDate || isSubmitting}
                style={{
                  flex: 1,
                  background:
                    endDateForm.endDate && !isSubmitting
                      ? "linear-gradient(135deg, #28a745 0%, #20c997 100%)"
                      : "#adb5bd",
                  color: "white",
                  border: "none",
                  padding: "8px 6px",
                  borderRadius: "5px",
                  fontSize: "9px",
                  fontWeight: "600",
                  cursor:
                    endDateForm.endDate && !isSubmitting
                      ? "pointer"
                      : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  boxShadow:
                    endDateForm.endDate && !isSubmitting
                      ? "0 2px 4px rgba(40, 167, 69, 0.2)"
                      : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <FaSave size={8} />
                {isSubmitting ? "SAVING..." : "SAVE"}
              </button>
              <button
                onClick={handleCancelSetEndDate}
                disabled={isSubmitting}
                style={{
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "8px 10px",
                  borderRadius: "5px",
                  fontSize: "9px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <FaTimes size={8} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleStartSetEndDate}
            disabled={isSubmitting}
            style={{
              display: "block",
              margin: "6px auto 0",
              width: "40%",
              background: isUrgent
                ? "linear-gradient(135deg, #d6336c 0%, #f093fb 100%)"
                : "linear-gradient(135deg, #7ecab2 0%, #31dda6 100%)",
              color: "white",
              border: "none",
              padding: "10px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: "600",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              boxShadow: isUrgent
                ? "0 3px 8px rgba(214, 51, 108, 0.3)"
                : "0 3px 8px rgba(102, 126, 234, 0.3)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = isUrgent
                ? "0 4px 12px rgba(214, 51, 108, 0.4)"
                : "0 4px 12px rgba(102, 126, 234, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = isUrgent
                ? "0 3px 8px rgba(214, 51, 108, 0.3)"
                : "0 3px 8px rgba(102, 126, 234, 0.3)";
            }}
          >
            SET END DATE
          </button>
        )}
      </div>
    </div>
  );
};

export default MaternityLeaveCard;
