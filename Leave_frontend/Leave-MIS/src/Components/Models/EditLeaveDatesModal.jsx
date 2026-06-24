import React, { useState, useEffect } from "react";
import { X, Calendar, Check, AlertCircle, Clock, Info } from "lucide-react";
import API from "../../utils/apiUtils";

const EditLeaveDatesModal = ({ show, onHide, leave, onSave }) => {
  const [startDate,       setStartDate]       = useState("");
  const [endDate,         setEndDate]         = useState("");
  const [reason,          setReason]          = useState("");
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState("");
  const [workingDaysInfo, setWorkingDaysInfo] = useState(null);
  const [calculating,     setCalculating]     = useState(false);

  // ── Reset whenever modal opens ──
  useEffect(() => {
    if (leave && show) {
      setStartDate(leave.startDate ? leave.startDate.split("T")[0] : "");
      setEndDate(leave.endDate     ? leave.endDate.split("T")[0]   : "");
      setReason("");
      setError("");
      setWorkingDaysInfo(null);
    }
  }, [leave, show]);

  // ── Auto-calculate working days ──
  useEffect(() => {
    if (
      startDate && endDate &&
      startDate <= endDate &&
      leave?.leaveType !== "HALF_DAY" &&
      leave?.leaveType !== "SHORT"
    ) {
      calcDays();
    } else {
      setWorkingDaysInfo(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const calcDays = async () => {
    setCalculating(true);
    try {
      const resp = await API.post("/leaves/calculate-working-days", { startDate, endDate });
      setWorkingDaysInfo(resp);
    } catch {
      setWorkingDaysInfo(null);
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    setError("");

    if (!startDate) { setError("Start date is required."); return; }
    if (!reason.trim()) { setError("Please provide a reason for changing the dates."); return; }

    const isHalfOrShort =
      leave?.leaveType === "HALF_DAY" || leave?.leaveType === "SHORT";

    if (!isHalfOrShort && !endDate) { setError("End date is required."); return; }
    if (endDate && startDate > endDate) { setError("End date must be on or after start date."); return; }

    if (!isHalfOrShort && workingDaysInfo?.workingDays === 0) {
      setError("Selected period contains no working days (weekends/holidays only). Please choose different dates.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave(leave.id, {
        startDate,
        endDate: isHalfOrShort ? startDate : endDate,
        reason,
      });
      onHide();
    } catch (err) {
      setError(err?.response?.data || err?.message || "Failed to update dates. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!show || !leave) return null;

  const isHalfOrShort = leave.leaveType === "HALF_DAY" || leave.leaveType === "SHORT";
  const today         = new Date().toISOString().split("T")[0];

  const leaveTypeLabels = {
    CASUAL:    "Casual Leave",
    SICK:      "Vacation Leave",
    DUTY:      "Duty Leave",
    MATERNITY: "Maternity Leave",
    HALF_DAY:  "Half Day Leave",
    SHORT:     "Short Leave",
  };
  const leaveTypeLabel = leaveTypeLabels[leave.leaveType] || leave.leaveType;

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
        })
      : "—";

  const canSave =
    startDate &&
    reason.trim() &&
    (isHalfOrShort || endDate) &&
    (isHalfOrShort || (workingDaysInfo?.workingDays ?? 1) > 0) &&
    !submitting;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1055, backdropFilter: "blur(4px)" }}
    >
      <div
        className="bg-white rounded-4 shadow-lg w-100"
        style={{ maxWidth: "520px", maxHeight: "92vh", overflowY: "auto" }}
      >
        {/* ── Header ── */}
        <div className="d-flex align-items-center justify-content-between p-3 p-md-4 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle p-2 d-flex align-items-center justify-content-center"
              style={{ backgroundColor: "rgba(13,110,253,0.12)", width: 40, height: 40 }}
            >
              <Calendar size={20} className="text-primary" />
            </div>
            <div>
              <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: "1rem" }}>
                Edit Leave Dates
              </h5>
              <small className="text-muted">{leaveTypeLabel}</small>
            </div>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary rounded-circle p-0 d-flex align-items-center justify-content-center"
            onClick={onHide}
            disabled={submitting}
            style={{ width: 34, height: 34 }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-3 p-md-4">

          {/* Current dates card */}
          <div
            className="rounded-3 p-3 mb-3"
            style={{ background: "#f8f9fa", border: "1px solid #e9ecef" }}
          >
            <div className="small text-muted fw-semibold mb-1">Current Dates</div>
            <div className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
              {fmtDate(leave.startDate)}
              {!isHalfOrShort && (
                <span className="text-muted fw-normal">
                  {" "}→ {fmtDate(leave.endDate)}
                </span>
              )}
            </div>
            <div className="small text-muted mt-1 d-flex align-items-center gap-1">
              <Clock size={11} />
              {leave.workingDays > 0
                ? `${leave.workingDays} working day${leave.workingDays !== 1 ? "s" : ""}`
                : isHalfOrShort
                ? "Half / Short leave"
                : "—"}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="alert alert-danger border-0 rounded-3 py-2 px-3 mb-3 d-flex align-items-center gap-2"
              style={{ fontSize: "0.875rem" }}
            >
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* New date inputs */}
          <div className="mb-3">
            <div className="small fw-semibold text-dark mb-2">New Dates</div>
            <div className={`row g-3`}>
              <div className={isHalfOrShort ? "col-12" : "col-6"}>
                <label className="form-label small text-muted mb-1">
                  {isHalfOrShort ? "Date" : "Start Date"}{" "}
                  <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control border-2 rounded-3"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  disabled={submitting}
                />
              </div>
              {!isHalfOrShort && (
                <div className="col-6">
                  <label className="form-label small text-muted mb-1">
                    End Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control border-2 rounded-3"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || today}
                    disabled={submitting}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Working days preview */}
          {!isHalfOrShort && startDate && endDate && (
            <div className="mb-3">
              {calculating ? (
                <div className="small text-muted d-flex align-items-center gap-2 p-2">
                  <div
                    className="spinner-border spinner-border-sm"
                    style={{ width: 14, height: 14 }}
                  />
                  Calculating working days…
                </div>
              ) : workingDaysInfo ? (
                <div
                  className={`rounded-3 px-3 py-2 small ${
                    workingDaysInfo.workingDays === 0
                      ? "border border-warning"
                      : ""
                  }`}
                  style={{
                    background:
                      workingDaysInfo.workingDays === 0
                        ? "rgba(255,193,7,0.1)"
                        : "rgba(25,135,84,0.08)",
                  }}
                >
                  <div className="d-flex flex-wrap gap-3 align-items-center">
                    <span
                      className={`fw-bold ${
                        workingDaysInfo.workingDays === 0
                          ? "text-warning"
                          : "text-success"
                      }`}
                    >
                      {workingDaysInfo.workingDays} working day
                      {workingDaysInfo.workingDays !== 1 ? "s" : ""}
                    </span>
                    <span className="text-muted">
                      ({workingDaysInfo.totalDays} calendar day
                      {workingDaysInfo.totalDays !== 1 ? "s" : ""})
                    </span>
                    {workingDaysInfo.weekendDays > 0 && (
                      <span className="text-muted">
                        {workingDaysInfo.weekendDays} weekend
                        {workingDaysInfo.weekendDays !== 1 ? "s" : ""} excluded
                      </span>
                    )}
                    {workingDaysInfo.publicHolidays > 0 && (
                      <span className="text-muted">
                        {workingDaysInfo.publicHolidays} holiday
                        {workingDaysInfo.publicHolidays !== 1 ? "s" : ""}{" "}
                        excluded
                      </span>
                    )}
                  </div>
                  {workingDaysInfo.workingDays === 0 && (
                    <div className="mt-1 text-warning fw-semibold">
                      ⚠️ No working days — please select different dates
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Reason */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark mb-1">
              Reason for Change <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-control border-2 rounded-3"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you need to change the leave dates?"
              disabled={submitting}
              style={{ fontSize: "0.9rem", resize: "none" }}
            />
          </div>

          {/* Info note */}
          <div
            className="rounded-3 px-3 py-2 small d-flex align-items-start gap-2"
            style={{ background: "#e3f2fd", color: "#1565c0" }}
          >
            <Info size={13} className="flex-shrink-0 mt-1" />
            <span>
              Only <strong>future pending or approved leaves</strong> can be
              edited. All assigned officers will be notified of the date change
              via email. Leave entitlements are automatically recalculated.
            </span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 p-3 p-md-4 border-top">
          <button
            className="btn btn-outline-secondary px-4 rounded-3 order-2 order-sm-1"
            onClick={onHide}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary px-4 rounded-3 fw-semibold order-1 order-sm-2 d-flex align-items-center justify-content-center gap-2"
            onClick={handleSave}
            disabled={!canSave}
          >
            {submitting ? (
              <>
                <div
                  className="spinner-border spinner-border-sm"
                  role="status"
                />
                Saving…
              </>
            ) : (
              <>
                <Check size={15} />
                Update Dates
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLeaveDatesModal;