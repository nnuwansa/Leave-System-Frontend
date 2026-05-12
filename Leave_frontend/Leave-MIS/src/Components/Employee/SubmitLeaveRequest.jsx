import React, { useState, useEffect } from "react";
import { Send, Calendar, AlertCircle, Info } from "lucide-react";
import Navbar from "../Navbar/Navbar";
import EmployeeSidebar from "../Navbar/EmployeeSidebar";
import "../CSS/EmployeeDashboard.css";
import Header from "./EmployeeDashboard";
import API from "../../utils/apiUtils";

const getLeaveTypeDisplayName = (leaveType) => {
  const displayNames = {
    CASUAL: "Casual Leave",
    SICK: "Vacation Leave",
    DUTY: "Duty Leave",
    MATERNITY: "Maternity Leave",
    SHORT: "Short Leave",
    HALF_DAY: "Half Day ",
  };
  return displayNames[leaveType] || leaveType.replace("_", " ");
};

const getTitle = (gender, maritalStatus) => {
  if (gender === "MALE") return "Mr.";
  if (gender === "FEMALE") return maritalStatus === "MARRIED" ? "Mrs." : "Miss.";
  return "";
};

const formatOfficerName = (officer) => {
  const title = getTitle(officer.gender, officer.maritalStatus);
  return `${title} ${officer.name} - ${officer.designation}`;
};

const leaveTypes = ["CASUAL", "SICK", "DUTY", "MATERNITY", "HALF_DAY", "SHORT"];

const maternityPaymentOptions = [
  { value: "FULL_PAY", label: "Full Pay - 84 Days" },
  { value: "HALF_PAY", label: "Half Pay - 84 Days" },
  { value: "NO_PAY",   label: "No Pay - 84 Days" },
];

const SubmitLeaveRequest = ({
  showMessage: propShowMessage,
  refreshData = () => {},
}) => {
  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  const [currentUser, setCurrentUser] = useState(null);
  const [actingOfficers, setActingOfficers] = useState([]);
  const [supervisingOfficers, setSupervisingOfficers] = useState([]);
  const [approvalOfficers, setApprovalOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [workingDaysInfo, setWorkingDaysInfo] = useState(null);

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "",
    actingOfficerEmail: "",
    supervisingOfficerEmail: "",
    approvalOfficerEmail: "",
    startDate: "",
    endDate: "",
    startTime: "",        
    endTime: "",          
    halfDayStartTime: "", 
    halfDayEndTime: "",   
    reason: "",
    maternityLeaveType: "FULL_PAY",
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showMessage = (message, isError = false) => {
    if (propShowMessage) {
      propShowMessage(message, isError);
    } else {
      if (isError) { setError(message); setSuccess(""); }
      else { setSuccess(message); setError(""); }
      setTimeout(() => { setError(""); setSuccess(""); }, 5000);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const user = await API.get(`/employee/me`);
      setCurrentUser(user);
      if (user.department) fetchDepartmentOfficers(user.department, user.email);
    } catch (err) {
      showMessage("Failed to fetch user", true);
    }
  };

    const fetchDepartmentOfficers = async (department, currentUserEmail) => {
    try {
     

      // Make both API calls in parallel
      const [departmentResponse, allDepartmentsResponse] = await Promise.all([
        // fetch same-department officers (for acting/supervising)
        API.get(
          `/leaves/employee/officers/department/${encodeURIComponent(
            department,
          )}/exclude/${encodeURIComponent(currentUserEmail)}`,
        ),
        // fetch ALL Sections officers (for approval)
        API.get(
          `/leaves/employee/officers/department/ALL/exclude/${encodeURIComponent(
            currentUserEmail,
          )}`,
        ),
      ]);

      // Handle both wrapped and unwrapped responses
      const data = departmentResponse.acting
        ? departmentResponse
        : departmentResponse.data || departmentResponse;

      const allData = allDepartmentsResponse.acting
        ? allDepartmentsResponse
        : allDepartmentsResponse.data || allDepartmentsResponse;

      // ✅ Acting & Supervising: same department only
      const actingList = Array.isArray(data.acting)
        ? data.acting.sort((a, b) => a.name.localeCompare(b.name))
        : [];

      setActingOfficers(actingList);
      setSupervisingOfficers(actingList);

      // ✅ Approval: ALL departments officers
      const approvalList = Array.isArray(allData.approval)
        ? allData.approval
            .filter(
              (officer, index, self) =>
                index === self.findIndex((o) => o.email === officer.email),
            )
            .sort((a, b) => a.name.localeCompare(b.name))
        : [];

      setApprovalOfficers(approvalList);

      
    } catch (err) {
      console.error("Error fetching department officers:", err);
      showMessage("Failed to fetch department officers", true);
      setActingOfficers([]);
      setSupervisingOfficers([]);
      setApprovalOfficers([]);
    }
  };


  const calculateWorkingDays = async (startDate, endDate) => {
    if (!startDate || !endDate) { setWorkingDaysInfo(null); return; }
    try {
      const response = await API.post("/leaves/calculate-working-days", { startDate, endDate });
      setWorkingDaysInfo(response);
    } catch {
      setWorkingDaysInfo(null);
    }
  };

  useEffect(() => {
    if (
      leaveForm.startDate && leaveForm.endDate && leaveForm.leaveType &&
      leaveForm.leaveType !== "SHORT" &&
      leaveForm.leaveType !== "HALF_DAY" &&
      leaveForm.leaveType !== "MATERNITY"
    ) {
      calculateWorkingDays(leaveForm.startDate, leaveForm.endDate);
    } else {
      setWorkingDaysInfo(null);
    }
  }, [leaveForm.startDate, leaveForm.endDate, leaveForm.leaveType]);

  const handleSubmitLeave = async () => {
    // Basic validation
    if (!leaveForm.leaveType || !leaveForm.approvalOfficerEmail || !leaveForm.startDate) {
      showMessage("Please fill all required fields (Leave Type, Approval Officer, Start Date)!", true);
      return;
    }

    // Half day validation — only times, no period
    if (leaveForm.leaveType === "HALF_DAY") {
      if (!leaveForm.halfDayStartTime || !leaveForm.halfDayEndTime) {
        showMessage("Please provide start and end time for half day leave!", true);
        return;
      }
      if (leaveForm.halfDayStartTime >= leaveForm.halfDayEndTime) {
        showMessage("End time must be after start time!", true);
        return;
      }
    } else if (leaveForm.leaveType === "SHORT") {
      if (!leaveForm.startTime || !leaveForm.endTime) {
        showMessage("Please provide start and end time for short leave!", true);
        return;
      }
      if (leaveForm.startTime >= leaveForm.endTime) {
        showMessage("End time must be after start time!", true);
        return;
      }
    } else if (leaveForm.leaveType === "MATERNITY") {
      if (!leaveForm.maternityLeaveType) {
        showMessage("Please select payment type for maternity leave!", true);
        return;
      }
    } else {
      if (!leaveForm.endDate) {
        showMessage("Please provide end date!", true);
        return;
      }
      if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) {
        showMessage("End date cannot be before start date!", true);
        return;
      }
    }

    // Officer uniqueness
    const selectedOfficers = [
      leaveForm.actingOfficerEmail,
      leaveForm.supervisingOfficerEmail,
      leaveForm.approvalOfficerEmail,
    ].filter((e) => e && e !== "" && e !== "NONE");
    if (selectedOfficers.length !== new Set(selectedOfficers).size) {
      showMessage("Please select different officers for each role!", true);
      return;
    }

    try {
      setLoading(true);

      let requestData = {
        leaveType: leaveForm.leaveType,
        actingOfficerEmail:
          leaveForm.actingOfficerEmail === "NONE" ? null : leaveForm.actingOfficerEmail,
        supervisingOfficerEmail:
          leaveForm.supervisingOfficerEmail === "NONE" ? null : leaveForm.supervisingOfficerEmail,
        approvalOfficerEmail: leaveForm.approvalOfficerEmail,
        startDate: leaveForm.startDate,
        reason: leaveForm.reason || "",
      };

      if (leaveForm.leaveType === "HALF_DAY") {
        requestData.endDate   = leaveForm.startDate;
        requestData.startTime = leaveForm.halfDayStartTime; // sent as startTime
        requestData.endTime   = leaveForm.halfDayEndTime;   // sent as endTime
        requestData.isHalfDay = true;
      } else if (leaveForm.leaveType === "SHORT") {
        requestData.endDate   = leaveForm.startDate;
        requestData.startTime = leaveForm.startTime;
        requestData.endTime   = leaveForm.endTime;
      } else if (leaveForm.leaveType === "MATERNITY") {
        requestData.maternityLeaveType = leaveForm.maternityLeaveType;
      } else {
        requestData.endDate = leaveForm.endDate;
      }

      // Validation call
      try {
        let validation;
        if (leaveForm.leaveType === "SHORT") {
          validation = await API.post("/leaves/validate-short-leave", {
            date: leaveForm.startDate,
          });
        } else if (leaveForm.leaveType === "HALF_DAY") {
          validation = await API.post("/leaves/validate-half-day", {
            date: leaveForm.startDate,
          });
        } else if (leaveForm.leaveType === "MATERNITY") {
          validation = await API.post("/leaves/validate-maternity", {
            startDate: leaveForm.startDate,
            maternityLeaveType: leaveForm.maternityLeaveType,
          });
        } else {
          validation = await API.post("/leaves/validate", {
            leaveType: leaveForm.leaveType,
            startDate: leaveForm.startDate,
            endDate: leaveForm.endDate,
            isHalfDay: false,
          });
        }
        if (!validation.valid) {
          showMessage(validation.message, true);
          return;
        }
      } catch (validationError) {
        showMessage(validationError.message || "Leave validation failed", true);
        return;
      }

      const response = await API.post("/leaves/submit", requestData);
      showMessage(
        typeof response === "string"
          ? response.replace("✅ ", "")
          : "Leave submitted successfully"
      );

      // Reset form
      setLeaveForm({
        leaveType: "",
        actingOfficerEmail: "",
        supervisingOfficerEmail: "",
        approvalOfficerEmail: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        halfDayStartTime: "",
        halfDayEndTime: "",
        reason: "",
        maternityLeaveType: "FULL_PAY",
      });
      setWorkingDaysInfo(null);
      refreshData();
    } catch (err) {
      showMessage(err.message || "Failed to submit leave request", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !email) return;
    fetchCurrentUser();
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
                <p className="mb-0">Please log in to submit a leave request.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #88b3df 0%, #b5cce7 50%, #75e3c0 100%)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1030 }}>
        <Navbar setSidebarOpen={setSidebarOpen} />
      </div>

      <div
        className="d-none d-lg-block position-fixed"
        style={{ top: "60px", left: 0, bottom: 0, width: "280px", zIndex: 1020 }}
      >
        <EmployeeSidebar sidebarOpen={true} setSidebarOpen={setSidebarOpen} />
      </div>

      {isMobile && (
        <EmployeeSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      )}

      <div
        className="main-content"
        style={{
          marginLeft: isMobile ? "0" : "280px",
          marginTop: "60px",
          minHeight: "calc(100vh - 60px)",
          padding: isMobile ? "15px" : "20px",
        }}
      >
        <Header />

        <div className={`container-fluid ${isMobile ? "px-0" : "px-4"} py-4`}>
          {success && (
            <div className="alert alert-success shadow-lg border-0 rounded-4 mb-4">
              <strong>Success!</strong> {success}
            </div>
          )}
          {error && (
            <div className="alert alert-danger d-flex align-items-center shadow-lg border-0 rounded-4 mb-4">
              <AlertCircle size={20} className="me-3" />
              <div><strong>Error!</strong> {error}</div>
            </div>
          )}

          <div className="glass-card rounded-4 mb-4">
            <div className={`p-${isMobile ? "3" : "4"}`}>
              <div className={`d-flex align-items-center mb-4 ${isMobile ? "flex-column text-center" : ""}`}>
                <Send size={isMobile ? 20 : 24} className="text-primary me-3" />
                <h5
                  className={`mb-0 fw-bold text-dark ${isMobile ? "mt-2" : ""}`}
                  style={{ fontSize: isMobile ? "1.1rem" : "1.25rem" }}
                >
                  SUBMIT LEAVE REQUEST
                </h5>
              </div>

              <div
                className="alert alert-info d-flex align-items-start border-0 rounded-3 mb-4"
                style={{ backgroundColor: "#e3f2fd" }}
              >
                <Info size={20} className="me-3 mt-1 text-primary flex-shrink-0" />
                <div>
                  <h6 className={`mb-3 fw-semibold text-primary ${isMobile ? "fs-6" : ""}`}>
                    Officer Selection Guidelines
                  </h6>
                  <div className={`mb-3 p-2 bg-white rounded-2 ${isMobile ? "text-center" : ""}`}>
                    <small className="text-muted fw-semibold mx-2" style={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
                      Leave Approval Process:
                    </small>
                    <small className="text-muted mx-2" style={{ fontSize: isMobile ? "0.7rem" : "0.875rem" }}>
                      Acting Officer → Supervising Officer → Approval Officer
                    </small>
                  </div>
                  <p className="mb-1 text-dark" style={{ fontSize: isMobile ? "12px" : "14px" }}>
                    • You may select <strong>"None"</strong> for Acting or Supervising Officer if not required.
                  </p>
                  <p className="mb-0 text-danger fw-semibold" style={{ fontSize: isMobile ? "12px" : "14px" }}>
                    • If required, you must select them — otherwise your leave request will be rejected.
                  </p>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmitLeave(); }}>
                <div className="row g-3">

                  {/* Leave Type */}
                  <div className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}>
                    <label className="form-label fw-semibold text-dark" style={{ fontSize: isMobile ? "13px" : "14px" }}>
                      Leave Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select border-0 shadow-sm rounded-3"
                      style={{ height: isMobile ? "40px" : "45px", fontSize: isMobile ? "13px" : "14px" }}
                      value={leaveForm.leaveType}
                      onChange={(e) => {
                        setLeaveForm({
                          ...leaveForm,
                          leaveType: e.target.value,
                          halfDayStartTime: "",
                          halfDayEndTime: "",
                        });
                        setWorkingDaysInfo(null);
                      }}
                      required
                    >
                      <option value="">Select Leave Type</option>
                      {leaveTypes.map((type) => (
                        <option key={type} value={type}>{getLeaveTypeDisplayName(type)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Acting Officer */}
                  <div className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}>
                    <label className="form-label fw-semibold text-dark" style={{ fontSize: isMobile ? "13px" : "14px" }}>
                      Acting Officer <span className="text-muted">(Optional)</span>
                    </label>
                    <select
                      className="form-select border-0 shadow-sm rounded-3"
                      style={{ height: isMobile ? "40px" : "45px", fontSize: isMobile ? "13px" : "14px" }}
                      value={leaveForm.actingOfficerEmail}
                      onChange={(e) => setLeaveForm({ ...leaveForm, actingOfficerEmail: e.target.value })}
                    >
                      <option value="">{actingOfficers.length === 0 ? "Loading..." : "Select Acting Officer"}</option>
                      <option value="NONE">None</option>
                      {actingOfficers.map((o) => (
                        <option key={o.email} value={o.email}>{formatOfficerName(o)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Supervising Officer */}
                  <div className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}>
                    <label className="form-label fw-semibold text-dark" style={{ fontSize: isMobile ? "13px" : "14px" }}>
                      Supervising Officer <span className="text-muted">(Optional)</span>
                    </label>
                    <select
                      className="form-select border-0 shadow-sm rounded-3"
                      style={{ height: isMobile ? "40px" : "45px", fontSize: isMobile ? "13px" : "14px" }}
                      value={leaveForm.supervisingOfficerEmail}
                      onChange={(e) => setLeaveForm({ ...leaveForm, supervisingOfficerEmail: e.target.value })}
                    >
                      <option value="">{supervisingOfficers.length === 0 ? "Loading..." : "Select Supervising Officer"}</option>
                      <option value="NONE">None</option>
                      {supervisingOfficers
                        .filter((o) => o.email !== leaveForm.actingOfficerEmail)
                        .map((o) => (
                          <option key={o.email} value={o.email}>{formatOfficerName(o)}</option>
                        ))}
                    </select>
                  </div>

                  {/* Approval Officer */}
                  <div className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}>
                    <label className="form-label fw-semibold text-dark" style={{ fontSize: isMobile ? "13px" : "14px" }}>
                      Approval Officer <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select border-0 shadow-sm rounded-3"
                      style={{ height: isMobile ? "40px" : "45px", fontSize: isMobile ? "13px" : "14px" }}
                      value={leaveForm.approvalOfficerEmail}
                      onChange={(e) => setLeaveForm({ ...leaveForm, approvalOfficerEmail: e.target.value })}
                      required
                    >
                      <option value="">{approvalOfficers.length === 0 ? "Loading..." : "Select Approval Officer"}</option>
                      {approvalOfficers
                        .filter(
                          (o) =>
                            o.email !== leaveForm.actingOfficerEmail &&
                            o.email !== leaveForm.supervisingOfficerEmail
                        )
                        .map((o) => (
                          <option key={o.email} value={o.email}>{formatOfficerName(o)}</option>
                        ))}
                    </select>
                  </div>

                  {/* Start Date / Date */}
                  <div className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}>
                    <label className="form-label fw-semibold text-dark" style={{ fontSize: isMobile ? "13px" : "14px" }}>
                      {leaveForm.leaveType === "SHORT" || leaveForm.leaveType === "HALF_DAY"
                        ? "Date"
                        : "Start Date"}{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control border-0 shadow-sm rounded-3"
                      style={{ height: isMobile ? "40px" : "45px", fontSize: isMobile ? "13px" : "14px" }}
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      required
                    />
                    {leaveForm.leaveType &&
                      leaveForm.leaveType !== "SHORT" &&
                      leaveForm.leaveType !== "HALF_DAY" && (
                        <small className="text-muted mt-1 d-block" style={{ fontSize: "11px" }}>
                          
                        </small>
                      )}
                  </div>

                  {/* End Date — regular leaves only */}
                  {leaveForm.leaveType &&
                    leaveForm.leaveType !== "SHORT" &&
                    leaveForm.leaveType !== "HALF_DAY" &&
                    leaveForm.leaveType !== "MATERNITY" && (
                      <div className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}>
                        <label className="form-label fw-semibold text-dark" style={{ fontSize: isMobile ? "13px" : "14px" }}>
                          End Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control border-0 shadow-sm rounded-3"
                          style={{ height: isMobile ? "40px" : "45px", fontSize: isMobile ? "13px" : "14px" }}
                          value={leaveForm.endDate}
                          min={leaveForm.startDate || undefined}
                          onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                          required
                        />
                      </div>
                    )}

                  {/* Working Days Breakdown */}
                  {workingDaysInfo && workingDaysInfo.workingDays >= 0 && (
                    <div className="col-12">
                      <div
                        className="alert border-0 rounded-3 d-flex align-items-start"
                        style={{ backgroundColor: "#e8f5e9", borderLeft: "4px solid #4caf50" }}
                      >
                        <Calendar size={20} className="me-3 mt-1 flex-shrink-0" style={{ color: "#4caf50" }} />
                        <div className="w-100">
                          <h6 className="mb-2 fw-bold" style={{ color: "#2e7d32", fontSize: isMobile ? "13px" : "14px" }}>
                            Leave Duration Breakdown
                          </h6>
                          <div className="row g-2" style={{ fontSize: isMobile ? "12px" : "13px" }}>
                            {[
                              { label: "Total Days",   value: workingDaysInfo.totalDays,      cls: "text-primary" },
                              { label: "Working Days", value: workingDaysInfo.workingDays,    style: { color: "#4caf50" } },
                              { label: "Weekends",     value: workingDaysInfo.weekendDays,    cls: "text-secondary" },
                              { label: "Holidays",     value: workingDaysInfo.publicHolidays, cls: "text-warning" },
                            ].map(({ label, value, cls, style }) => (
                              <div key={label} className="col-6 col-md-3">
                                <div className="bg-white rounded-2 p-2 text-center">
                                  <small className="text-muted d-block">{label}</small>
                                  <strong className={`fs-5 ${cls || ""}`} style={style}>{value}</strong>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 p-2 bg-white rounded-2" style={{ fontSize: isMobile ? "11px" : "12px" }}>
                            <strong style={{ color: "#2e7d32" }}>
                              ✓ Only {workingDaysInfo.workingDays} working day{workingDaysInfo.workingDays !== 1 ? "s" : ""} will be deducted
                            </strong>
                            <br />
                            <small className="text-muted">Weekends and public holidays are automatically excluded</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── HALF DAY: start time + end time only (no period) ── */}
                  {leaveForm.leaveType === "HALF_DAY" && (
                    <>
                      {/* Start Time */}
                      <div className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}>
                        <label className="form-label fw-semibold text-dark" style={{ fontSize: isMobile ? "13px" : "14px" }}>
                          Start Time <span className="text-danger">*</span>
                        </label>
                        <input
                          type="time"
                          className="form-control border-0 shadow-sm rounded-3"
                          style={{ height: isMobile ? "40px" : "45px", fontSize: isMobile ? "13px" : "14px" }}
                          value={leaveForm.halfDayStartTime}
                          onChange={(e) => setLeaveForm({ ...leaveForm, halfDayStartTime: e.target.value })}
                          required
                        />
                      </div>

                      {/* End Time */}
                      <div className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}>
                        <label className="form-label fw-semibold text-dark" style={{ fontSize: isMobile ? "13px" : "14px" }}>
                          End Time <span className="text-danger">*</span>
                        </label>
                        <input
                          type="time"
                          className="form-control border-0 shadow-sm rounded-3"
                          style={{ height: isMobile ? "40px" : "45px", fontSize: isMobile ? "13px" : "14px" }}
                          value={leaveForm.halfDayEndTime}
                          onChange={(e) => setLeaveForm({ ...leaveForm, halfDayEndTime: e.target.value })}
                          required
                        />
                      </div>

                      {/* Info note */}
                      {leaveForm.halfDayStartTime && leaveForm.halfDayEndTime && (
                        <div className="col-12">
                          <div
                            className="rounded-3 d-flex align-items-center p-3"
                            style={{
                              backgroundColor: "#e3f2fd",
                              border: "1px solid #90caf9",
                              fontSize: isMobile ? "12px" : "13px",
                              color: "#1565c0",
                            }}
                          >
                            <span style={{ fontSize: "18px", marginRight: "10px" }}>🕐</span>
                            <div>
                              <strong>Half Day Leave</strong>
                              &nbsp;—&nbsp;
                              {leaveForm.halfDayStartTime} to {leaveForm.halfDayEndTime}
                              &nbsp;·&nbsp;
                              <span style={{ fontWeight: "600" }}>0.5 leave days will be deducted</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* SHORT leave times */}
                  {leaveForm.leaveType === "SHORT" && (
                    <>
                      <div className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}>
                        <label className="form-label fw-semibold text-dark" style={{ fontSize: isMobile ? "13px" : "14px" }}>
                          Start Time <span className="text-danger">*</span>
                        </label>
                        <input
                          type="time"
                          className="form-control border-0 shadow-sm rounded-3"
                          style={{ height: isMobile ? "40px" : "45px", fontSize: isMobile ? "13px" : "14px" }}
                          value={leaveForm.startTime}
                          onChange={(e) => setLeaveForm({ ...leaveForm, startTime: e.target.value })}
                          required
                        />
                      </div>
                      <div className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}>
                        <label className="form-label fw-semibold text-dark" style={{ fontSize: isMobile ? "13px" : "14px" }}>
                          End Time <span className="text-danger">*</span>
                        </label>
                        <input
                          type="time"
                          className="form-control border-0 shadow-sm rounded-3"
                          style={{ height: isMobile ? "40px" : "45px", fontSize: isMobile ? "13px" : "14px" }}
                          value={leaveForm.endTime}
                          onChange={(e) => setLeaveForm({ ...leaveForm, endTime: e.target.value })}
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Maternity Payment Type */}
                  {leaveForm.leaveType === "MATERNITY" && (
                    <div className={`${isMobile ? "col-12" : "col-lg-4 col-md-6"}`}>
                      <label className="form-label fw-semibold text-dark" style={{ fontSize: isMobile ? "13px" : "14px" }}>
                        Payment Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select border-0 shadow-sm rounded-3"
                        style={{ height: isMobile ? "40px" : "45px", fontSize: isMobile ? "13px" : "14px" }}
                        value={leaveForm.maternityLeaveType}
                        onChange={(e) => setLeaveForm({ ...leaveForm, maternityLeaveType: e.target.value })}
                        required
                      >
                        {maternityPaymentOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="col-12">
                    <label className="form-label fw-semibold text-dark" style={{ fontSize: isMobile ? "13px" : "14px" }}>
                      Reason for Leave
                    </label>
                    <textarea
                      className="form-control border-0 shadow-sm rounded-3"
                      rows="3"
                      style={{ fontSize: isMobile ? "13px" : "14px" }}
                      placeholder="Please provide the reason for your leave request..."
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-3 rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                      style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "600" }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={18} className="me-2" />
                          Submit Leave Request
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitLeaveRequest;