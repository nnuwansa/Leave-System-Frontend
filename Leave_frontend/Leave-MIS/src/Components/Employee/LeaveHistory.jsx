import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Calendar,
  User,
  Award,
  FileText,
  Users,
  Send,
  UserCheck,
  ArrowRight,
  Check,
  X,
  UserCog,
  Ban,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Menu,
  Filter,
  Edit2,
} from "lucide-react";
import Navbar from "../Navbar/Navbar";
import EmployeeSidebar from "../Navbar/EmployeeSidebar";
import EditLeaveDatesModal from "../Models/EditLeaveDatesModal";
import "../CSS/EmployeeDashboard.css";
import EmployeeDashboard from "./EmployeeDashboard";
import API from "../../utils/apiUtils";

// ---------------- Status Badge Component ----------------
const StatusBadge = ({ status }) => {
  const statusMap = {
    PENDING: { class: "bg-warning text-dark", icon: Clock },
    APPROVED: { class: "bg-success", icon: CheckCircle },
    REJECTED: { class: "bg-danger", icon: XCircle },
    REJECTED_BY_APPROVAL_OFFICER: { class: "bg-danger", icon: XCircle },
    REJECTED_BY_ACTING_OFFICER: { class: "bg-danger", icon: XCircle },
    REJECTED_BY_SUPERVISING_OFFICER: { class: "bg-danger", icon: XCircle },
    PENDING_ACTING_OFFICER: { class: "bg-warning text-white", icon: Clock },
    PENDING_SUPERVISING_OFFICER: { class: "bg-warning text-white", icon: Clock },
    PENDING_APPROVAL_OFFICER: { class: "bg-warning text-white", icon: Clock },
    CANCELLED_BY_EMPLOYEE: { class: "bg-secondary text-white", icon: Ban },
    CANCELLED_ADMIN: { class: "bg-secondary text-white", icon: Ban },
  };

  const config = statusMap[status] || { class: "bg-secondary", icon: AlertCircle };
  const Icon = config.icon;

  const getDisplayStatus = (status) => {
    switch (status) {
      case "PENDING_ACTING_OFFICER":        return "PENDING ACTING";
      case "PENDING_SUPERVISING_OFFICER":   return "PENDING SUPERVISING";
      case "PENDING_APPROVAL_OFFICER":      return "PENDING APPROVAL";
      case "REJECTED_BY_ACTING_OFFICER":    return "REJECTED BY ACTING";
      case "REJECTED_BY_SUPERVISING_OFFICER": return "REJECTED BY SUPERVISING";
      case "REJECTED_BY_APPROVAL_OFFICER":  return "REJECTED BY APPROVAL";
      case "CANCELLED_BY_EMPLOYEE":         return "CANCELLED";
      case "CANCELLED_ADMIN":               return "CANCELLED (ADMIN)";
      default:                              return status;
    }
  };

  return (
    <span
      className={`badge ${config.class} px-2 py-1 rounded-pill fw-semibold d-inline-flex align-items-center`}
      style={{ fontSize: "0.65rem" }}
    >
      <Icon size={12} className="me-1" />
      <span className="d-none d-sm-inline">{getDisplayStatus(status)}</span>
      <span className="d-sm-none">{status.split("_")[0]}</span>
    </span>
  );
};

// ---------------- Action Button Component ----------------
// FIX 1: Added onEditDatesClick and canEditDates props
const ActionButton = ({ leave, onCancelClick, onEditDatesClick, canEditDates }) => {
  const canCancel = () => {
    if (leave.isCancelled || leave.status?.includes("CANCELLED")) return false;
    if (leave.status?.includes("REJECTED")) return false;
    const startDate = new Date(leave.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return startDate > today;
  };

  const cancelable = canCancel();
  // const editable =
  // canEditDates === true &&
  // !leave.isShortLeave &&
  // !leave.status?.includes("CANCELLED") &&
  // !leave.status?.includes("REJECTED") &&
  // leave.status !== "APPROVED";

  const editable =
  canEditDates === true &&
  !leave.status?.includes("CANCELLED") &&
  !leave.status?.includes("REJECTED") &&
  leave.status !== "APPROVED";   // keep or relax depending on whether approved short/half-day should be editable

  if (!cancelable && !editable) {
    let message = "Cannot cancel";
    if (leave.isCancelled || leave.status?.includes("CANCELLED")) message = "Cancelled";
    else if (leave.status?.includes("REJECTED"))                  message = "Cannot cancel";
    else                                                           message = "Past due";
    return <span className="text-muted small d-none d-md-inline">{message}</span>;
  }

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      {/* Edit Dates button */}
      {editable && (
        <button
          className="btn btn-outline-primary btn-sm d-flex align-items-center"
          onClick={() => onEditDatesClick(leave)}
          title="Edit leave dates"
          style={{ fontSize: "0.75rem" }}
        >
          <Edit2 size={12} className="me-1 d-none d-sm-inline" />
          <span className="d-none d-sm-inline">Edit Dates</span>
          <Edit2 size={14} className="d-sm-none" />
        </button>
      )}
      {/* Cancel button */}
      {cancelable && (
        <button
          className="btn btn-outline-danger btn-sm d-flex align-items-center"
          onClick={() => onCancelClick(leave)}
          title="Cancel this leave request"
          style={{ fontSize: "0.75rem" }}
        >
          <Ban size={12} className="me-1 d-none d-sm-inline" />
          <span className="d-none d-sm-inline">Cancel</span>
          <Ban size={14} className="d-sm-none" />
        </button>
      )}
    </div>
  );
};

// ---------------- Enhanced Cancel Leave Modal Component ----------------
const CancelLeaveModal = ({ show, onHide, leave, onCancel }) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for cancellation");
      return;
    }
    setIsSubmitting(true);
    try {
      await onCancel(leave.id, reason);
      setReason("");
      onHide();
    } catch (error) {
      console.error("Error cancelling leave:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 1050, backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white rounded-4 shadow-lg w-100" style={{ maxWidth: "500px", maxHeight: "90vh", overflow: "auto" }}>
        <div className="d-flex align-items-center justify-content-between p-3 p-md-4 border-bottom">
          <div className="d-flex align-items-center">
            <div className="rounded-circle p-2 me-3" style={{ backgroundColor: "rgba(220, 53, 69, 0.1)" }}>
              <Ban size={20} className="text-danger" />
            </div>
            <h5 className="mb-0 fw-bold text-dark fs-6 fs-md-5">Cancel Leave Request</h5>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary rounded-circle p-2"
            onClick={onHide} disabled={isSubmitting} style={{ width: "36px", height: "36px" }}>
            <X size={16} />
          </button>
        </div>
        <div className="p-3 p-md-4">
          <div className="alert alert-warning border-0 rounded-3 mb-4" style={{ backgroundColor: "#fff3cd" }}>
            <div className="d-flex align-items-start">
              <AlertTriangle size={20} className="text-warning me-3 mt-1 flex-shrink-0" />
              <div>
                <h6 className="mb-1 fw-semibold text-warning-emphasis fs-6">Confirm Cancellation</h6>
                <p className="mb-0 small text-warning-emphasis">
                  Are you sure you want to cancel this leave request? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="card border-0 mb-4" style={{ backgroundColor: "#f8f9fa" }}>
            <div className="card-body p-3">
              <h6 className="card-title mb-3 fw-semibold text-dark fs-6">Leave Details</h6>
              <div className="row g-2">
                <div className="col-12 col-sm-4">
                  <span className="small text-muted d-block">Type</span>
                  <span className="fw-semibold text-dark small">{leave?.leaveType}</span>
                </div>
                <div className="col-12 col-sm-4">
                  <span className="small text-muted d-block">Duration</span>
                  <span className="fw-semibold text-dark small">{leave?.startDate} to {leave?.endDate}</span>
                </div>
                <div className="col-12 col-sm-4">
                  <span className="small text-muted d-block">Status</span>
                  <StatusBadge status={leave?.status} />
                </div>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold text-dark mb-2 small">
              Reason for Cancellation <span className="text-danger">*</span>
            </label>
            <textarea className="form-control border-2 rounded-3" rows={3} value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed reason for cancelling this leave request..."
              disabled={isSubmitting} style={{ borderColor: "#dee2e6", fontSize: "0.9rem" }} />
            <div className="small text-muted mt-1">Please provide a clear reason for cancellation</div>
          </div>
          <div className="alert alert-info border-0 rounded-3" style={{ backgroundColor: "#cff4fc" }}>
            <div className="d-flex align-items-start">
              <AlertCircle size={18} className="text-info me-3 mt-1 flex-shrink-0" />
              <div>
                <h6 className="mb-1 fw-semibold text-info-emphasis fs-6">Important Note</h6>
                <p className="mb-0 small text-info-emphasis">
                  If this leave was already approved, your leave entitlement will be restored automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-end gap-2 gap-sm-3 p-3 p-md-4 border-top">
          <button type="button" className="btn btn-outline-secondary px-4 py-2 rounded-3 order-2 order-sm-1"
            onClick={onHide} disabled={isSubmitting}>Keep Leave</button>
          <button type="button" className="btn btn-danger px-4 py-2 rounded-3 fw-semibold order-1 order-sm-2"
            onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting ? (
              <><div className="spinner-border spinner-border-sm me-2" role="status"></div>Cancelling...</>
            ) : (
              <><Ban size={16} className="me-2" />Cancel Leave</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------- Approval Flow Component ----------------
const ApprovalFlow = ({ leave, employeeDetails, isCompact = false }) => {
  const getTitle = (gender, maritalStatus) => {
    if (!gender) return "";
    const genderUpper = gender.toString().toUpperCase();
    if (genderUpper === "MALE") return "Mr.";
    else if (genderUpper === "FEMALE") {
      const maritalStatusUpper = maritalStatus ? maritalStatus.toString().toUpperCase() : "";
      return maritalStatusUpper === "MARRIED" ? "Mrs." : "Miss.";
    }
    return "";
  };

  const formatOfficerName = (officerName) => {
    if (!officerName) return "Not Selected";
    const employeeData = employeeDetails[officerName];
    if (employeeData && employeeData.gender) {
      const title = getTitle(employeeData.gender, employeeData.maritalStatus);
      return title ? `${title} ${officerName}` : officerName;
    }
    return officerName;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return null;
    const date = new Date(dateTime);
    return { date: date.toLocaleDateString(), time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
  };

  const getStatusIcon = (status, isApproved, approvedAt, isCancelled = false, hasOfficer = true) => {
    if (!hasOfficer)             return <Ban size={10} className="text-muted" />;
    if (isCancelled)             return <Ban size={10} className="text-secondary" />;
    if (isApproved && approvedAt) return <Check size={10} className="text-success" />;
    else if (status === "REJECTED") return <X size={10} className="text-danger" />;
    else if (status === "PENDING")  return <Clock size={10} className="text-primary" />;
    return <Clock size={10} className="text-muted" />;
  };

  const getStatusColor = (status, isApproved, approvedAt, isCancelled = false, hasOfficer = true) => {
    if (!hasOfficer)             return "text-muted";
    if (isCancelled)             return "text-secondary";
    if (isApproved && approvedAt) return "text-success";
    else if (status === "REJECTED") return "text-danger";
    else if (status === "PENDING")  return "text-primary";
    return "text-muted";
  };

  const hasActingOfficer     = leave.actingOfficerEmail && leave.actingOfficerEmail !== "NONE" && leave.actingOfficerName;
  const hasSupervisingOfficer = leave.supervisingOfficerEmail && leave.supervisingOfficerEmail !== "NONE" && leave.supervisingOfficerName;
  const hasApprovalOfficer   = leave.approvalOfficerEmail && leave.approvalOfficerEmail !== "NONE" && leave.approvalOfficerName;
  const isCancelled = leave.isCancelled || leave.status?.includes("CANCELLED");

  const actingOfficerApproved      = leave.actingOfficerStatus === "APPROVED";
  const supervisingOfficerApproved = leave.supervisingOfficerStatus === "APPROVED";
  const approvalOfficerApproved    = leave.approvalOfficerStatus === "APPROVED";

  const actingApprovedDateTime      = formatDateTime(leave.actingOfficerApprovedAt);
  const supervisingApprovedDateTime = formatDateTime(leave.supervisingOfficerApprovedAt);
  const approvalApprovedDateTime    = formatDateTime(leave.approvalOfficerApprovedAt);

  const officersToShow = [
    {
      type: "acting", icon: User, title: "Acting",
      name: hasActingOfficer ? formatOfficerName(leave.actingOfficerName) : "Not Assigned",
      status: hasActingOfficer ? leave.actingOfficerStatus : "NOT_ASSIGNED",
      approved: hasActingOfficer ? actingOfficerApproved : false,
      approvedAt: hasActingOfficer ? leave.actingOfficerApprovedAt : null,
      dateTime: hasActingOfficer ? actingApprovedDateTime : null,
      hasOfficer: hasActingOfficer,
    },
    {
      type: "supervising", icon: UserCog, title: "Supervising",
      name: hasSupervisingOfficer ? formatOfficerName(leave.supervisingOfficerName) : "Not Assigned",
      status: hasSupervisingOfficer ? leave.supervisingOfficerStatus : "NOT_ASSIGNED",
      approved: hasSupervisingOfficer ? supervisingOfficerApproved : false,
      approvedAt: hasSupervisingOfficer ? leave.supervisingOfficerApprovedAt : null,
      dateTime: hasSupervisingOfficer ? supervisingApprovedDateTime : null,
      hasOfficer: hasSupervisingOfficer,
    },
    {
      type: "approval", icon: UserCheck, title: "Approval",
      name: hasApprovalOfficer ? formatOfficerName(leave.approvalOfficerName) : "Not Assigned",
      status: hasApprovalOfficer ? leave.approvalOfficerStatus : "NOT_ASSIGNED",
      approved: hasApprovalOfficer ? approvalOfficerApproved : false,
      approvedAt: hasApprovalOfficer ? leave.approvalOfficerApprovedAt : null,
      dateTime: hasApprovalOfficer ? approvalApprovedDateTime : null,
      hasOfficer: hasApprovalOfficer,
    },
  ];

  return (
    <div className="approval-flow-horizontal d-flex align-items-start justify-content-center">
      {officersToShow.map((officer, index) => {
        const IconComponent = officer.icon;
        const isLast = index === officersToShow.length - 1;
        return (
          <React.Fragment key={officer.type}>
            <div className="officer-container text-center" style={{ width: "60px", minHeight: "50px" }}>
              <div className="d-flex align-items-center justify-content-center mb-1" style={{ minHeight: "16px" }}>
                <div className="me-2">
                  {getStatusIcon(officer.status, officer.approved, officer.approvedAt, isCancelled, officer.hasOfficer)}
                </div>
                <IconComponent size={10} className="me-1" />
              </div>
              <div className="mb-1" style={{ minHeight: "10px" }}>
                <div className="small text-muted" style={{ fontSize: "0.65rem", lineHeight: "1" }}>{officer.title}</div>
              </div>
              <div
                className={`fw-semibold text-center ${getStatusColor(officer.status, officer.approved, officer.approvedAt, isCancelled, officer.hasOfficer)}`}
                style={{ fontSize: "0.7rem", lineHeight: "1.1", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}
                title={officer.name}
              >
                {officer.name.length > 15 ? officer.name.substring(0, 15) + "..." : officer.name}
              </div>
              <div className="text-center mt-1" style={{ minHeight: "15px" }}>
                {!officer.hasOfficer ? (
                  <div className="small text-muted" style={{ fontSize: "0.7rem" }}>N/A</div>
                ) : isCancelled ? (
                  <div className="small text-secondary" style={{ fontSize: "0.5rem" }}>Cancelled</div>
                ) : (
                  <>
                    {officer.dateTime && (
                      <div className="small text-success" style={{ fontSize: "0.5rem" }}>
                        <div>{officer.dateTime.date}</div>
                      </div>
                    )}
                    {officer.status === "REJECTED" && (
                      <div className="small text-danger" style={{ fontSize: "0.5rem" }}>Rejected</div>
                    )}
                    {officer.status === "PENDING" && !officer.approved && (
                      <div className="small text-primary" style={{ fontSize: "0.5rem" }}>Pending</div>
                    )}
                  </>
                )}
              </div>
            </div>
            {!isLast && (
              <div className="d-flex align-items-center justify-content-center mx-4" style={{ minHeight: "40px" }}>
                <ArrowRight size={15} className={isCancelled ? "text-secondary" : officer.approved ? "text-success" : "text-muted"} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------------- Pagination Component ----------------
const Pagination = ({ currentPage, totalPages, onPageChange, showPageNumbers = true, maxVisiblePages = 3 }) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const delta = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    if (end - start + 1 < maxVisiblePages) start = Math.max(1, end - maxVisiblePages + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  return (
    <nav aria-label="Leave history pagination">
      <ul className="pagination pagination-sm mb-0 justify-content-center">
        <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
          <button className="page-link border-0 rounded-start-3 p-2" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}
            style={{ backgroundColor: currentPage <= 1 ? "#f8f9fa" : "white", color: currentPage <= 1 ? "#6c757d" : "#495057" }}>
            <ChevronLeft size={14} />
          </button>
        </li>
        <li className="page-item d-sm-none">
          <span className="page-link border-0 px-3" style={{ backgroundColor: "white" }}>{currentPage} / {totalPages}</span>
        </li>
        <div className="d-none d-sm-flex">
          {showPageNumbers && visiblePages[0] > 1 && (
            <>
              <li className="page-item">
                <button className="page-link border-0" onClick={() => onPageChange(1)} style={{ backgroundColor: "white", color: "#495057" }}>1</button>
              </li>
              {visiblePages[0] > 2 && <li className="page-item disabled"><span className="page-link border-0" style={{ backgroundColor: "white" }}>...</span></li>}
            </>
          )}
          {showPageNumbers && visiblePages.map((page) => (
            <li key={page} className={`page-item ${page === currentPage ? "active" : ""}`}>
              <button className="page-link border-0" onClick={() => onPageChange(page)}
                style={{ backgroundColor: page === currentPage ? "#0d6efd" : "white", color: page === currentPage ? "white" : "#495057", fontWeight: page === currentPage ? "600" : "400" }}>
                {page}
              </button>
            </li>
          ))}
          {showPageNumbers && visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <li className="page-item disabled"><span className="page-link border-0" style={{ backgroundColor: "white" }}>...</span></li>
              )}
              <li className="page-item">
                <button className="page-link border-0" onClick={() => onPageChange(totalPages)} style={{ backgroundColor: "white", color: "#495057" }}>{totalPages}</button>
              </li>
            </>
          )}
        </div>
        <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
          <button className="page-link border-0 rounded-end-3 p-2" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}
            style={{ backgroundColor: currentPage >= totalPages ? "#f8f9fa" : "white", color: currentPage >= totalPages ? "#6c757d" : "#495057" }}>
            <ChevronRight size={14} />
          </button>
        </li>
      </ul>
    </nav>
  );
};

// ---------------- Mobile Card Component for Leave Item ----------------
// FIX 2: Added onEditDatesClick and canEditDates as props (not captured from closure)
const MobileLeaveCard = ({
  leave, employeeDetails, onCancelClick, onEditDatesClick, canEditDates,
  formatEmployeeName, getLeaveTypeDisplayName, calculateDuration,
}) => {
  return (
    <div className="card border-0 shadow-sm mb-3 leave-card-mobile">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <div className="fw-bold text-dark mb-1" style={{ fontSize: "0.9rem" }}>{formatEmployeeName(leave)}</div>
            <div className="small text-muted">
              {leave.requestDate
                ? new Date(leave.requestDate).toLocaleDateString()
                : new Date(leave.createdAt || leave.dateSubmitted).toLocaleDateString()}
            </div>
          </div>
          <StatusBadge status={leave.status} />
        </div>
        <div className="mb-2">
          <span className="badge px-2 py-1 rounded-pill fw-semibold me-2"
            style={{ backgroundColor: "#e9ecef", color: "#495057", fontSize: "0.75rem" }}>
            {getLeaveTypeDisplayName(leave.leaveType)}
          </span>
          {leave.leaveType === "MATERNITY" && leave.maternityLeaveType && (
            <span className="badge px-2 py-1 rounded-pill fw-semibold"
              style={{ backgroundColor: "rgba(236, 72, 153, 0.1)", color: "#be185d", fontSize: "0.7rem" }}>
              {leave.maternityLeaveType.replace(/_/g, " ")}
            </span>
          )}
        </div>
        <div className="mb-2">
          <div className="small text-muted mb-1">Duration:</div>
          <div className="fw-semibold text-dark small">
            {leave.leaveType === "SHORT" || leave.leaveType === "SHORT_LEAVE" ? (
              <>{leave.startDate ? new Date(leave.startDate).toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" }) : ""} ({leave.halfDayPeriod || "MORNING"} period)</>
            ) : (
              <>{leave.startDate ? new Date(leave.startDate).toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" }) : ""} → {leave.endDate ? new Date(leave.endDate).toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" }) : ""}</>
            )}
          </div>
          <div className="small text-muted">
            <Clock size={12} className="me-1" />
            {calculateDuration(leave.leaveType, leave.startDate, leave.endDate, leave.shortLeaveStartTime, leave.shortLeaveEndTime, leave.halfDayPeriod, leave.workingDays,leave.halfDayStartTime, leave.halfDayEndTime )}
          </div>
        </div>
        {leave.reason && (
          <div className="mb-2">
            <div className="small text-muted mb-1">Reason:</div>
            <div className="small text-dark">{leave.reason}</div>
          </div>
        )}
        <div className="mb-2">
          <div className="small text-muted mb-2">Approval Status:</div>
          <ApprovalFlow leave={leave} employeeDetails={employeeDetails} isCompact={true} />
        </div>
        {/* FIX 2: Pass props explicitly */}
        <div className="d-flex justify-content-end">
          <ActionButton
            leave={leave}
            onCancelClick={onCancelClick}
            onEditDatesClick={onEditDatesClick}
            canEditDates={canEditDates}
          />
        </div>
        {leave.isCancelled && leave.cancelledAt && (
          <div className="mt-2 pt-2 border-top">
            <div className="small text-muted">Cancelled on {new Date(leave.cancelledAt).toLocaleDateString()}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------- Main Leave History Component ----------------
const LeaveHistory = () => {
  let email, token;
  try {
    email = localStorage?.getItem("email") || "demo@example.com";
    token = localStorage?.getItem("token") || "demo-token";
  } catch (e) {
    email = "demo@example.com";
    token = "demo-token";
  }

  const [loading, setLoading]               = useState(false);
  const [leaveRequests, setLeaveRequests]   = useState([]);
  const [searchTerm, setSearchTerm]         = useState("");
  const [filterStatus, setFilterStatus]     = useState("all");
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [loadingEmployeeData, setLoadingEmployeeData] = useState(false);
  const [currentUser, setCurrentUser]       = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedLeave, setSelectedLeave]   = useState(null);
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [isMobile, setIsMobile]             = useState(window.innerWidth < 992);

  // Edit dates state
  const [showEditDatesModal, setShowEditDatesModal] = useState(false);
  const [editingLeave, setEditingLeave]             = useState(null);
  const [editEligibility, setEditEligibility]       = useState({});

  // Pagination states
  const [currentPage, setCurrentPage]     = useState(1);
  const [itemsPerPage, setItemsPerPage]   = useState(10);

  const staticEmployeeData = {
    Nadini: { gender: "FEMALE", maritalStatus: "MARRIED" },
    subashi: { gender: "MALE", maritalStatus: "SINGLE" },
    Nilushi: { gender: "FEMALE", maritalStatus: "MARRIED" },
    John: { gender: "MALE", maritalStatus: "MARRIED" },
    Sarah: { gender: "FEMALE", maritalStatus: "SINGLE" },
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // FIX 3: fetchEditEligibility defined here so it's in scope
  const fetchEditEligibility = async (leavesList) => {
    if (!leavesList || leavesList.length === 0) return;
    const results = {};
    await Promise.all(
      leavesList.map(async (leave) => {
        try {
          const resp = await API.get(`/leaves/${leave.id}/can-edit-dates`);
          results[leave.id] = resp?.canEdit === true;
        } catch {
          results[leave.id] = false;
        }
      })
    );
    setEditEligibility(results);
  };

  const handleEditDatesClick = (leave) => {
    setEditingLeave(leave);
    setShowEditDatesModal(true);
  };

  const handleSaveEditedDates = async (leaveId, payload) => {
    await API.put(`/leaves/${leaveId}/edit-dates`, payload);
    await fetchMyLeaves();
  };

  const triggerDashboardRefresh = () => {
    const event = new CustomEvent("refreshLeaveData");
    window.dispatchEvent(event);
    if (typeof window.refreshDashboardData === "function") window.refreshDashboardData();
    try {
      const tempKey = "leaveDataUpdated_" + Date.now();
      localStorage.setItem(tempKey, "refresh");
      localStorage.removeItem(tempKey);
    } catch (e) {}
  };

  const fetchCurrentUser = async () => {
    try {
      const user = await API.get(`/admin/users/${email}`);
      setCurrentUser(user);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const fetchEmployeeDetails = async () => {
    try {
      setLoadingEmployeeData(true);
      const response = await API.get("/admin/users");
      if (Array.isArray(response)) {
        const employeeMap = {};
        response.forEach((employee) => {
          const nameFields = [employee.name, employee.fullName, employee.employeeName, employee.empName].filter(Boolean);
          const employeeInfo = { gender: employee.gender, maritalStatus: employee.maritalStatus };
          nameFields.forEach((nameField) => { if (nameField) employeeMap[nameField] = employeeInfo; });
        });
        setEmployeeDetails({ ...staticEmployeeData, ...employeeMap });
      }
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
      setEmployeeDetails(staticEmployeeData);
    } finally {
      setLoadingEmployeeData(false);
    }
  };

  // FIX 3: fetchMyLeaves now calls fetchEditEligibility after loading leaves
  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const res = await API.get("/leaves/my-leaves");
      const leavesArray = Array.isArray(res) ? res : [];
      setLeaveRequests(leavesArray);
      // ✅ KEY FIX: call fetchEditEligibility right after setting leaves
      await fetchEditEligibility(leavesArray);
    } catch (err) {
      console.error("Error fetching my leaves:", err);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLeave = async (leaveId, reason) => {
    try {
      const result = await API.post(`/leaves/${leaveId}/cancel`, { reason });
      if (typeof result === "string" && result.includes("successfully")) {
        await fetchMyLeaves();
        triggerDashboardRefresh();
        alert("Leave cancelled successfully. Your entitlements have been updated.");
      } else {
        throw new Error(result || "Failed to cancel leave");
      }
    } catch (error) {
      console.error("Error cancelling leave:", error);
      alert("Failed to cancel leave: " + error.message);
      throw error;
    }
  };

  const handleCancelClick = (leave) => {
    setSelectedLeave(leave);
    setShowCancelModal(true);
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setSelectedLeave(null);
  };

  const getSearchableLeaveTypes = (leaveType) => {
    const searchTerms = {
      SICK: ["sick", "medical", "medical leave", "vacation", "vacation leave"],
      CASUAL: ["casual", "casual leave"],
      DUTY: ["duty", "duty leave"],
      MATERNITY: ["maternity", "maternity leave"],
      SHORT: ["short", "short leave"],
      HALF_DAY: ["half day", "half-day", "half day leave"],
    };
    return searchTerms[leaveType] || [leaveType.toLowerCase()];
  };

  const getTitle = (gender, maritalStatus) => {
    if (!gender) return "";
    const genderUpper = gender.toString().toUpperCase();
    if (genderUpper === "MALE") return "Mr.";
    else if (genderUpper === "FEMALE") {
      const maritalStatusUpper = maritalStatus ? maritalStatus.toString().toUpperCase() : "";
      return maritalStatusUpper === "MARRIED" ? "Mrs." : "Miss.";
    }
    return "";
  };

  const formatEmployeeName = (leave) => {
    if (!leave.employeeName) return "";
    let employeeData = null;
    if (leave.employeeGender || leave.gender) {
      employeeData = { gender: leave.employeeGender || leave.gender, maritalStatus: leave.employeeMaritalStatus || leave.maritalStatus };
    }
    if (!employeeData && employeeDetails[leave.employeeName]) employeeData = employeeDetails[leave.employeeName];
    if (!employeeData) {
      const matchingKey = Object.keys(employeeDetails).find((key) => key.toLowerCase() === leave.employeeName.toLowerCase());
      if (matchingKey) employeeData = employeeDetails[matchingKey];
    }
    if (employeeData && employeeData.gender) {
      const title = getTitle(employeeData.gender, employeeData.maritalStatus);
      return title ? `${title} ${leave.employeeName}` : leave.employeeName;
    }
    return leave.employeeName;
  };

  const getLeaveTypeDisplayName = (leaveType) => {
    const displayNames = {
      CASUAL: "CASUAL LEAVE", SICK: "VACATION LEAVE", DUTY: "DUTY LEAVE",
      MATERNITY: "MATERNITY LEAVE", SHORT: "SHORT LEAVE", HALF_DAY: "HALF DAY",
    };
    return displayNames[leaveType] || leaveType.replace("_", " ");
  };

  // const calculateDuration = (leaveType, startDate, endDate, shortLeaveStartTime, shortLeaveEndTime, halfDayPeriod, workingDays) => {
  //   if (leaveType === "HALF_DAY") return `0.5 day (${halfDayPeriod || "MORNING"} period)`;
  //   else if (leaveType === "SHORT" || leaveType === "SHORT_LEAVE") {
  //     if (shortLeaveStartTime && shortLeaveEndTime) {
  //       const start = new Date(`${startDate}T${shortLeaveStartTime}`);
  //       const end = new Date(`${startDate}T${shortLeaveEndTime}`);
  //       const diffHours = (end - start) / (1000 * 60 * 60);
  //       const options = { hour: "2-digit", minute: "2-digit" };
  //       return `${diffHours.toFixed(2)} hours (${start.toLocaleTimeString([], options)} - ${end.toLocaleTimeString([], options)})`;
  //     }
  //     return "Short duration";
  //   } else {
  //     if (workingDays !== undefined && workingDays !== null && workingDays > 0) {
  //       if (workingDays === 0.5) return "0.5 working day";
  //       if (workingDays === 1)   return "1 working day";
  //       return `${workingDays} working days`;
  //     }
  //     if (!endDate || endDate === "Invalid Date" || endDate === null) return "Pending end date from admin";
  //     const start = new Date(startDate);
  //     const end = new Date(endDate);
  //     if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Invalid date";
  //     const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  //     if (days < 0 || days > 1000) return "Pending end date";
  //     if (days === 0.5) return "0.5 day";
  //     if (days === 1)   return "1 day";
  //     return `${days} days`;
  //   }
  // };

  const formatTimeDisplay = (time) => {
  if (!time) return null;
  const [h, m] = time.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const calculateDuration = (
  leaveType, startDate, endDate,
  shortLeaveStartTime, shortLeaveEndTime,
  halfDayPeriod, workingDays,
  halfDayStartTime, halfDayEndTime   // ← NEW params
) => {
  if (leaveType === "HALF_DAY") {
    const period = halfDayPeriod || "MORNING";
    if (halfDayStartTime && halfDayEndTime) {
      const start = formatTimeDisplay(halfDayStartTime);
      const end = formatTimeDisplay(halfDayEndTime);
      return `0.5 day (${period} · ${start} - ${end})`;
    }
    return `0.5 day (${period} period)`;
  }
  else if (leaveType === "SHORT" || leaveType === "SHORT_LEAVE") {
    if (shortLeaveStartTime && shortLeaveEndTime) {
      const start = new Date(`${startDate}T${shortLeaveStartTime}`);
      const end = new Date(`${startDate}T${shortLeaveEndTime}`);
      const diffHours = (end - start) / (1000 * 60 * 60);
      const options = { hour: "2-digit", minute: "2-digit" };
      return `${diffHours.toFixed(2)} hours (${start.toLocaleTimeString([], options)} - ${end.toLocaleTimeString([], options)})`;
    }
    return "Short duration";
  } else {
    if (workingDays !== undefined && workingDays !== null && workingDays > 0) {
      if (workingDays === 0.5) return "0.5 working day";
      if (workingDays === 1)   return "1 working day";
      return `${workingDays} working days`;
    }
    if (!endDate || endDate === "Invalid Date" || endDate === null) return "Pending end date from admin";
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Invalid date";
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (days < 0 || days > 1000) return "Pending end date";
    if (days === 0.5) return "0.5 day";
    if (days === 1)   return "1 day";
    return `${days} days`;
  }
};

  const getFilteredRequests = () => {
    return leaveRequests.filter((leave) => {
      const search = searchTerm.toLowerCase();
      const employeeName = leave.employeeName?.toLowerCase() || "";
      const leaveTypeSearchTerms = getSearchableLeaveTypes(leave.leaveType);
      const matchesSearch =
        employeeName.includes(search) ||
        leaveTypeSearchTerms.some((term) => term.includes(search) || search.includes(term));
      const status = leave.status?.toLowerCase() || "";
      const filter = filterStatus.toLowerCase();
      const matchesStatus =
        filter === "all" ||
        (filter === "pending" && (status.includes("pending") || status === "pending_acting_officer" || status === "pending_supervising_officer" || status === "pending_approval_officer")) ||
        (filter === "rejected" && (status.includes("rejected") || status === "rejected_by_acting_officer" || status === "rejected_by_supervising_officer" || status === "rejected_by_approval_officer")) ||
        (filter === "cancelled" && (status.includes("cancelled") || leave.isCancelled)) ||
        status === filter || status.includes(filter);
      return matchesSearch && matchesStatus;
    });
  };

  const getPaginatedData = () => {
    const filteredData = getFilteredRequests();
    const totalItems = filteredData.length;
    const effectiveItemsPerPage = itemsPerPage === 100 ? totalItems : itemsPerPage;
    const totalPages = Math.ceil(totalItems / effectiveItemsPerPage);
    const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
    const startIndex = (validCurrentPage - 1) * effectiveItemsPerPage;
    const endIndex = startIndex + effectiveItemsPerPage;
    return {
      items: filteredData.slice(startIndex, endIndex),
      totalItems, totalPages, currentPage: validCurrentPage,
      startIndex: startIndex + 1, endIndex: Math.min(endIndex, totalItems), effectiveItemsPerPage,
    };
  };

  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage) => { setItemsPerPage(newItemsPerPage); setCurrentPage(1); };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

  useEffect(() => {
    if (!token || !email) return;
    fetchCurrentUser();
    fetchEmployeeDetails();
    fetchMyLeaves(); // ✅ fetchEditEligibility is called inside fetchMyLeaves
  }, [email, token]);

  useEffect(() => {
    if (leaveRequests && leaveRequests.length > 0 && Object.keys(employeeDetails).length === 0) {
      fetchEmployeeDetails();
    }
  }, [leaveRequests]);

  if (!token || !email) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-warning d-flex align-items-center shadow-lg border-0 rounded-4">
              <AlertCircle size={20} className="me-3 text-warning" />
              <div>
                <h6 className="mb-1 fw-semibold">Authentication Required</h6>
                <p className="mb-0">Please log in to access your leave history.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const paginationData = getPaginatedData();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #88b3df 0%, #b5cce7 50%, #75e3c0 100%)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1030 }}>
        <Navbar setSidebarOpen={setSidebarOpen} />
      </div>
      <div className="d-none d-lg-block position-fixed" style={{ top: "60px", left: 0, bottom: 0, width: "280px", zIndex: 1020 }}>
        <EmployeeSidebar sidebarOpen={true} setSidebarOpen={setSidebarOpen} />
      </div>
      {sidebarOpen && isMobile && (
        <>
          <div className="position-fixed w-100 h-100 bg-dark bg-opacity-50 d-lg-none" style={{ zIndex: 1040, top: "60px" }} onClick={() => setSidebarOpen(false)} />
          <div className="position-fixed d-lg-none" style={{ top: "60px", left: sidebarOpen ? 0 : "-280px", bottom: 0, width: "280px", zIndex: 1050, transition: "left 0.3s ease" }}>
            <EmployeeSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          </div>
        </>
      )}

      <div className="main-content" style={{ marginLeft: isMobile ? "0" : "280px", marginTop: "60px", minHeight: "calc(100vh - 60px)", padding: isMobile ? "15px 10px" : "20px" }}>
        <div style={{ position: "relative", zIndex: 1, marginBottom: "20px" }}>
          <EmployeeDashboard />
        </div>

        <div className="glass-card rounded-4 shadow-sm">
          {loadingEmployeeData && (
            <div className="d-flex align-items-center p-3 mb-3 rounded bg-light">
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              <span className="text-muted">Loading employee details...</span>
            </div>
          )}

          {/* Header */}
          <div className="border-bottom p-3 p-md-4">
            <div className="row align-items-center">
              <div className="col-12 col-md-6">
                <div className="d-flex align-items-center mb-3 mb-md-0">
                  <div className="rounded-circle p-2 me-3" style={{ background: "rgba(42, 61, 87, 0.1)" }}>
                    <Clock size={20} style={{ color: "#1f2937" }} />
                  </div>
                  <h5 className="mb-0 fw-bold text-dark">LEAVE HISTORY</h5>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="d-flex flex-column flex-sm-row gap-2">
                  <div className="input-group flex-grow-1">
                    <span className="input-group-text bg-white border-2 rounded-start-3" style={{ borderColor: "#e5e7eb" }}>
                      <Search size={16} className="text-muted" />
                    </span>
                    <input type="text"
                      placeholder={isMobile ? "Search leaves..." : "Search your leaves... (try 'casual', 'vacation', etc.)"}
                      className="form-control border-2 rounded-end-3"
                      style={{ borderColor: "#e5e7eb", fontSize: isMobile ? "0.9rem" : "1rem" }}
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Filter size={16} className="text-muted d-sm-none" />
                    <select className="form-select border-2 rounded-3 fw-semibold"
                      style={{ minWidth: "140px", borderColor: "#e5e7eb", fontSize: isMobile ? "0.9rem" : "1rem" }}
                      value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {paginationData.totalItems > 0 && !isMobile && (
              <div className="row align-items-center mt-3 pt-3 border-top">
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center">
                      <span className="text-muted me-2 small">Show:</span>
                      <select className="form-select form-select-sm border-2 rounded-3" style={{ width: "80px", borderColor: "#e5e7eb" }}
                        value={itemsPerPage} onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>All</option>
                      </select>
                      <span className="text-muted ms-2 small">entries</span>
                    </div>
                    <div className="text-muted small">
                      Showing {paginationData.startIndex} to {paginationData.endIndex} of {paginationData.totalItems} entries
                      {(searchTerm || filterStatus !== "all") && <span className="text-primary ms-1">(filtered)</span>}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  {paginationData.totalPages > 1 && itemsPerPage !== 100 && (
                    <div className="d-flex justify-content-end">
                      <Pagination currentPage={paginationData.currentPage} totalPages={paginationData.totalPages} onPageChange={handlePageChange} maxVisiblePages={5} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {paginationData.totalItems > 0 && isMobile && (
              <div className="mt-3 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="text-muted small">
                    {paginationData.startIndex}-{paginationData.endIndex} of {paginationData.totalItems}
                    {(searchTerm || filterStatus !== "all") && <span className="text-primary ms-1">(filtered)</span>}
                  </div>
                  <select className="form-select form-select-sm border-2 rounded-3" style={{ width: "100px", borderColor: "#e5e7eb" }}
                    value={itemsPerPage} onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}>
                    <option value={5}>Show 5</option>
                    <option value={10}>Show 10</option>
                    <option value={25}>Show 25</option>
                    <option value={100}>Show All</option>
                  </select>
                </div>
                {paginationData.totalPages > 1 && itemsPerPage !== 100 && (
                  <div className="d-flex justify-content-center">
                    <Pagination currentPage={paginationData.currentPage} totalPages={paginationData.totalPages} onPageChange={handlePageChange} maxVisiblePages={3} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-dark" role="status"><span className="visually-hidden">Loading...</span></div>
                <p className="mt-3 text-muted">Loading your leave history...</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                {isMobile ? (
                  <div className="p-3">
                    {paginationData.items.length === 0 ? (
                      <div className="text-center py-5">
                        <div className="text-muted">
                          <FileText size={48} className="mb-3 opacity-50" />
                          <p className="mb-0 fw-semibold">No leave records found</p>
                          <small>{searchTerm || filterStatus !== "all" ? "No results for current filters" : "Submit your first leave request to get started"}</small>
                        </div>
                      </div>
                    ) : (
                      paginationData.items.map((leave) => (
                        <MobileLeaveCard
                          key={leave.id}
                          leave={leave}
                          employeeDetails={employeeDetails}
                          onCancelClick={handleCancelClick}
                          onEditDatesClick={handleEditDatesClick}
                          canEditDates={editEligibility[leave.id]}
                          formatEmployeeName={formatEmployeeName}
                          getLeaveTypeDisplayName={getLeaveTypeDisplayName}
                          calculateDuration={calculateDuration}
                        />
                      ))
                    )}
                  </div>
                ) : (
                  /* Desktop Table View */
                  <div className="table-responsive">
                    <table className="table table-hover mb-0" style={{ fontSize: "0.75rem" }}>
                      <thead style={{ background: "rgba(211, 225, 240, 0.8)" }}>
                        <tr>
                          <th className="border-0 py-3 px-1 fw-semibold text-dark">
                            <div className="d-flex align-items-center justify-content-center text-center">
                              <div>
                                <div className="d-flex align-items-center justify-content-center mb-1"><Send size={14} className="me-1" /></div>
                                <div style={{ fontSize: "0.75rem", lineHeight: "1.1" }}><div>DATE</div><div>SUBMITTED</div></div>
                              </div>
                            </div>
                          </th>
                          <th className="border-0 py-3 px-1 fw-semibold text-dark">
                            <div className="d-flex align-items-center"><User size={16} className="me-2" />EMPLOYEE</div>
                          </th>
                          <th className="border-0 py-3 px-3 fw-semibold text-dark">
                            <div className="d-flex align-items-center justify-content-center text-center">
                              <div>
                                <div className="d-flex align-items-center justify-content-center mb-1"><FileText size={14} className="me-1" /></div>
                                <div style={{ fontSize: "0.75rem", lineHeight: "1.1" }}><div>LEAVE</div><div>DETAILS</div></div>
                              </div>
                            </div>
                          </th>
                          <th className="border-0 py-3 px-1 fw-semibold text-dark">
                            <div className="d-flex align-items-center"><Calendar size={16} className="me-2" />DURATION</div>
                          </th>
                          <th className="border-0 py-3 px-3 fw-semibold text-dark">
                            <div className="d-flex align-items-center"><Award size={16} className="me-2" />STATUS</div>
                          </th>
                          <th className="border-0 py-3 px-3 fw-semibold text-dark">
                            <div className="d-flex align-items-center justify-content-center text-center">
                              <div>
                                <div className="d-flex align-items-center justify-content-center mb-1"><Users size={14} className="me-1" /></div>
                                <div style={{ fontSize: "0.75rem", lineHeight: "1.1" }}><div>APPROVAL</div><div>CHAIN</div></div>
                              </div>
                            </div>
                          </th>
                          <th className="border-0 py-3 px-3 fw-semibold text-dark">
                            <div className="d-flex align-items-center"><Ban size={16} className="me-2" />ACTIONS</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginationData.items.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-5">
                              <div className="text-muted">
                                <FileText size={48} className="mb-3 opacity-50" />
                                <p className="mb-0 fw-semibold">No leave records found</p>
                                <small>{searchTerm || filterStatus !== "all" ? "No results for current filters" : "Submit your first leave request to get started"}</small>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginationData.items.map((leave) => (
                            <tr key={leave.id}>
                              <td className="py-3 px-3">
                                <div className="fw-semibold text-dark mb-1">
                                  {leave.requestDate
                                    ? new Date(leave.requestDate).toLocaleDateString()
                                    : new Date(leave.createdAt || leave.dateSubmitted).toLocaleDateString()}
                                </div>
                                <div className="small text-muted">
                                  {leave.requestDate
                                    ? new Date(leave.requestDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                    : new Date(leave.createdAt || leave.dateSubmitted).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                              </td>
                              <td className="py-3 px-0">
                                <div className="fw-semibold text-dark">{formatEmployeeName(leave)}</div>
                              </td>
                              <td className="py-3 px-1">
                                <div className="mb-2">
                                  <span className="badge px-3 py-2 rounded-pill fw-semibold" style={{ backgroundColor: "#e9ecef", color: "#495057" }}>
                                    {getLeaveTypeDisplayName(leave.leaveType)}
                                  </span>
                                </div>
                                {leave.leaveType === "MATERNITY" && leave.maternityLeaveType && (
                                  <div className="mb-2">
                                    <span className="badge px-3 py-1 mx-2 rounded-pill fw-semibold" style={{ backgroundColor: "rgba(236, 72, 153, 0.1)", color: "#be185d" }}>
                                      {leave.maternityLeaveType.replace(/_/g, " ")}
                                    </span>
                                  </div>
                                )}
                                <div className="small text-muted mx-3">{leave.reason || "No reason provided"}</div>
                              </td>
                              <td className="py-3 px-1">
                                <div className="fw-semibold text-dark mb-1">
                                  {leave.leaveType === "SHORT" || leave.leaveType === "SHORT_LEAVE" ? (
                                    <>{leave.startDate ? new Date(leave.startDate).toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" }) : ""} ({leave.halfDayPeriod || "MORNING"} period)</>
                                  ) : (
                                    <>{leave.startDate ? new Date(leave.startDate).toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" }) : ""} → {leave.endDate ? new Date(leave.endDate).toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" }) : ""}</>
                                  )}
                                </div>
                                <div className="small text-muted">
                                  <Clock size={12} className="me-1" />
                                  {calculateDuration(leave.leaveType, leave.startDate, leave.endDate, leave.shortLeaveStartTime, leave.shortLeaveEndTime, leave.halfDayPeriod, leave.workingDays, leave.halfDayStartTime, leave.halfDayEndTime )}
                                </div>
                              </td>
                              <td className="py-2">
                                <StatusBadge status={leave.status} />
                                {leave.isCancelled && leave.cancelledAt && (
                                  <div className="small text-muted mt-1">Cancelled on {new Date(leave.cancelledAt).toLocaleDateString()}</div>
                                )}
                              </td>
                              <td className="py-3 px-1">
                                <ApprovalFlow leave={leave} employeeDetails={employeeDetails} />
                              </td>
                              {/* FIX 1: Pass all required props to ActionButton */}
                              <td className="py-3 px-2">
                                <ActionButton
                                  leave={leave}
                                  onCancelClick={handleCancelClick}
                                  onEditDatesClick={handleEditDatesClick}
                                  canEditDates={editEligibility[leave.id]}
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Pagination Desktop */}
          {paginationData.totalItems > 0 && paginationData.totalPages > 1 && itemsPerPage !== 100 && !isMobile && (
            <div className="border-top p-4">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <div className="text-muted small">Showing {paginationData.startIndex} to {paginationData.endIndex} of {paginationData.totalItems} entries</div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-end">
                    <Pagination currentPage={paginationData.currentPage} totalPages={paginationData.totalPages} onPageChange={handlePageChange} maxVisiblePages={5} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Pagination Mobile */}
          {paginationData.totalItems > 0 && paginationData.totalPages > 1 && itemsPerPage !== 100 && isMobile && (
            <div className="border-top p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="text-muted small">{paginationData.startIndex}-{paginationData.endIndex} of {paginationData.totalItems}</div>
              </div>
              <div className="d-flex justify-content-center">
                <Pagination currentPage={paginationData.currentPage} totalPages={paginationData.totalPages} onPageChange={handlePageChange} maxVisiblePages={3} />
              </div>
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        <CancelLeaveModal show={showCancelModal} onHide={handleCloseCancelModal} leave={selectedLeave} onCancel={handleCancelLeave} />

        {/* Edit Dates Modal */}
        <EditLeaveDatesModal
          show={showEditDatesModal}
          onHide={() => { setShowEditDatesModal(false); setEditingLeave(null); }}
          leave={editingLeave}
          onSave={handleSaveEditedDates}
        />
      </div>

      <style jsx>{`
        .glass-card { background: #bccee4f2; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
        .leave-card-mobile { transition: all 0.2s ease; }
        .leave-card-mobile:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important; }
        .table-responsive::-webkit-scrollbar { height: 6px; }
        .table-responsive::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .table-responsive::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
        .table-responsive::-webkit-scrollbar-thumb:hover { background: #555; }
        .pagination .page-link { transition: all 0.2s ease-in-out; }
        .pagination .page-link:hover { transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .pagination .page-item.active .page-link { box-shadow: 0 2px 8px rgba(13,110,253,0.3); }
        @media (max-width: 991.98px) {
          .main-content { margin-left: 0 !important; }
          .glass-card { border-radius: 1rem !important; }
          .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
        }
        @media (max-width: 576px) {
          .pagination .page-link { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
          .badge { font-size: 0.7rem !important; }
        }
        .spinner-border { animation: spinner-border 0.75s linear infinite; }
        @keyframes spinner-border { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LeaveHistory;