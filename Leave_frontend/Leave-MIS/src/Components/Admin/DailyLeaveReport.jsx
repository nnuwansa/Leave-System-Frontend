

import React, { useEffect, useState } from "react";
import API from "../../API/axios";
import "../CSS/Admin.css";
import { FaEye, FaDownload } from "react-icons/fa";


// ── Loading Dots ───────────────────────────────────────────────────────────────
const LoadingDots = ({ message = "Loading..." }) => (
  <div style={{
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "50px", minHeight: "300px",
  }}>
    <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: "15px", height: "15px", borderRadius: "50%",
          background: "linear-gradient(45deg, #185a9d 0%, #43cea2 100%)",
          animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
    <p style={{ color: "#555", fontSize: "16px", fontWeight: "500", margin: 0 }}>{message}</p>
    <style>{`
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
        40%            { transform: scale(1); opacity: 1;   }
      }
    `}</style>
  </div>
);

// ── Leave Detail Modal ─────────────────────────────────────────────────────────
const LeaveDetailModal = ({ leave, onClose }) => {
  if (!leave) return null;

  const buildDuration = () => {
    if (leave.category === "SHORT")
      return leave.shortLeaveStart && leave.shortLeaveEnd
        ? `${leave.shortLeaveStart?.slice(0, 5)} – ${leave.shortLeaveEnd?.slice(0, 5)}`
        : "Short Leave";
    if (leave.category === "HALF_DAY") {
      const period = leave.halfDayPeriod === "MORNING" ? "Morning" : "Afternoon";
      return leave.halfDayStartTime && leave.halfDayEndTime
        ? `${period} (${leave.halfDayStartTime?.slice(0, 5)} – ${leave.halfDayEndTime?.slice(0, 5)})`
        : period;
    }
    if (leave.workingDays > 0)
      return `${leave.workingDays} Working Day${leave.workingDays !== 1 ? "s" : ""}`;
    return "—";
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: "800px", maxWidth: "90vw" }}>
        <div className="modal-header">
          <h2 style={{ color: "white", margin: 0 }}>Leave Request Details</h2>
          <button className="btn-close" onClick={onClose}>✖</button>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>Employee Information</h4>
              <p><strong>Name:</strong> {leave.employeeName || "—"}</p>
              <p><strong>Email:</strong> {leave.employeeEmail || "—"}</p>
            </div>
            <div>
              <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>Leave Details</h4>
              <p><strong>Type:</strong> {leave.leaveType === "SICK" ? "VACATION" : leave.leaveType?.replace("_", " ")}</p>
              <p><strong>Category:</strong> {leave.category === "HALF_DAY" ? "Half Day" : leave.category === "SHORT" ? "Short Leave" : leave.category === "MATERNITY" ? "Maternity" : "Full Day"}</p>
              <p><strong>Start Date:</strong> {leave.startDate || "—"}</p>
              <p><strong>End Date:</strong> {leave.endDate || leave.startDate || "—"}</p>
              <p><strong>Duration:</strong> {buildDuration()}</p>
              {leave.category === "HALF_DAY" && leave.halfDayPeriod && (
                <p><strong>Period:</strong> {leave.halfDayPeriod === "MORNING" ? "Morning" : "Afternoon"}</p>
              )}
            </div>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>Reason</h4>
            <p style={{ background: "#f8f9fa", padding: "10px", borderRadius: "4px" }}>
              {leave.reason || "No reason provided"}
            </p>
          </div>
          <div>
            <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>Acting Officer</h4>
            <p><strong>Name:</strong> {leave.actingOfficerName || "N/A"}</p>
            <p><strong>Email:</strong> {leave.actingOfficerEmail || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const LEAVE_TYPE_LABEL = {
  CASUAL: "CASUAL", SICK: "VACATION", DUTY: "DUTY", MATERNITY: "MATERNITY",
};

const getLeaveTypeStyle = (leaveType, category) => {
  if (category === "SHORT")    return { background: "#fce4ec", color: "#880e4f" };
  if (category === "HALF_DAY") return { background: "#f3e5f5", color: "#7b1fa2" };
  switch (leaveType) {
    case "CASUAL":    return { background: "#e3f2fd", color: "#1976d2" };
    case "SICK":      return { background: "#ffebee", color: "#d32f2f" };
    case "MATERNITY": return { background: "#e8f5e8", color: "#388e3c" };
    case "DUTY":      return { background: "#e0faf3", color: "#065f46" };
    default:          return { background: "#f3e5f5", color: "#7b1fa2" };
  }
};

const getCategoryStyle = (category) => {
  switch (category) {
    case "FULL_DAY":  return { background: "#e8f5e8", color: "#2e7d32" };
    case "HALF_DAY":  return { background: "#f3e5f5", color: "#7b1fa2" };
    case "SHORT":     return { background: "#fce4ec", color: "#c2185b" };
    case "MATERNITY": return { background: "#fff3e0", color: "#f57c00" };
    default:          return { background: "#f5f5f5", color: "#555" };
  }
};

const formatCategory = (cat) => ({
  FULL_DAY: "FULL DAY", HALF_DAY: "HALF DAY", SHORT: "SHORT LEAVE", MATERNITY: "MATERNITY",
}[cat] || cat);

const buildDays = (entry) => {
  if (entry.category === "SHORT")    return "SHORT LEAVE";
  if (entry.category === "HALF_DAY") return "0.5 DAYS";
  if (entry.workingDays > 0)
    return `${entry.workingDays} Working Day${entry.workingDays !== 1 ? "s" : ""}`;
  return "—";
};

const buildPeriod = (entry) => {
  if (entry.category === "SHORT") {
    const s = entry.shortLeaveStart?.slice(0, 5);
    const e = entry.shortLeaveEnd?.slice(0, 5);
    return s && e ? `${s} - ${e}` : "Short Leave";
  }
  if (entry.category === "HALF_DAY") {
    const period = entry.halfDayPeriod === "MORNING" ? "Morning" : "Afternoon";
    const s = entry.halfDayStartTime?.slice(0, 5);
    const e = entry.halfDayEndTime?.slice(0, 5);
    return s && e ? `${period} (${s}-${e})` : period;
  }
  return "-";
};

// ── Format date as DD/MM/YYYY text for Excel ─────────────────────────────────
const fmtDateExcel = (d) => {
  if (!d) return "";
  if (d.includes("-")) {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }
  return d;
};

const today = () => new Date().toISOString().slice(0, 10);

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DailyLeaveReport() {
  const [reportDate,       setReportDate]       = useState(today());
  const [report,           setReport]           = useState(null);
  const [allEntries,       setAllEntries]       = useState([]);
  const [filteredLeaves,   setFilteredLeaves]   = useState([]);
  const [selectedLeave,    setSelectedLeave]    = useState(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);

  const [typeFilter,     setTypeFilter]     = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchReport = async (date) => {
    if (!date) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/admin/daily-report?date=${date}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = res.data;
      setReport(data);
      const merged = [...(data.onLeave || []), ...(data.shortLeaves || [])];
      setAllEntries(merged);
      setFilteredLeaves(merged);
      setCurrentPage(1);
    } catch (err) {
      console.error("❌ Daily report error:", err.response?.data || err.message);
      setError("Failed to load daily leave report.");
      setReport(null);
      setAllEntries([]);
      setFilteredLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(today()); }, []);

  useEffect(() => {
    let filtered = [...allEntries];
    if (typeFilter)     filtered = filtered.filter((e) => e.leaveType === typeFilter);
    if (categoryFilter) filtered = filtered.filter((e) => e.category  === categoryFilter);
    if (employeeFilter) filtered = filtered.filter(
      (e) =>
        (e.employeeName  || "").toLowerCase().includes(employeeFilter.toLowerCase()) ||
        (e.employeeEmail || "").toLowerCase().includes(employeeFilter.toLowerCase())
    );
    setFilteredLeaves(filtered);
    setCurrentPage(1);
  }, [typeFilter, categoryFilter, employeeFilter, allEntries]);

  const uniqueTypes      = [...new Set(allEntries.map((e) => e.leaveType))];
  const uniqueCategories = [...new Set(allEntries.map((e) => e.category))];

  const indexOfLast  = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows  = filteredLeaves.slice(indexOfFirst, indexOfLast);
  const totalPages   = Math.ceil(filteredLeaves.length / rowsPerPage);

  const resetFilters = () => { setTypeFilter(""); setCategoryFilter(""); setEmployeeFilter(""); };

  // ── Export XLSX — proper column widths via SheetJS ───────────────────────────
  const exportToXLSX = () => {
    // Dynamically load SheetJS from CDN
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => {
      const XLSX = window.XLSX;
      const wb   = XLSX.utils.book_new();

      const dateLabel = fmtDateExcel(reportDate);

      // ── Title / summary section ──────────────────────────────────────────
      const titleSection = [
        ["DAILY LEAVE REPORT"],
        ["Report Date:", dateLabel],
        ["Total on Leave:", (report?.totalOnLeave || 0) + (report?.shortLeaveCount || 0),
         "Full Day:", report?.fullDayCount || 0,
         "Half Day:", report?.halfDayCount || 0,
         "Short Leave:", report?.shortLeaveCount || 0,
         "Maternity:", report?.maternityCount || 0],
        [],  // blank row
        // Column headers
        ["No.", "Employee Name", "Email", "Department", "Leave Type",
         "Category", "Start Date", "End Date", "Days", "Period / Time",
         "Acting Officer", "Reason"],
      ];

      // ── Data rows ────────────────────────────────────────────────────────
      const dataRows = filteredLeaves.map((e, i) => {
        const startDate = fmtDateExcel(e.startDate);
        const endDate   = (e.category === "SHORT" || e.category === "HALF_DAY")
          ? fmtDateExcel(e.startDate)
          : fmtDateExcel(e.endDate);
        return [
          i + 1,
          e.employeeName   || "",
          e.employeeEmail  || "",
          e.department     || "",
          LEAVE_TYPE_LABEL[e.leaveType] || e.leaveType,
          formatCategory(e.category),
          startDate,
          endDate,
          buildDays(e),
          buildPeriod(e),
          e.actingOfficerName || "",
          e.reason            || "",
        ];
      });

      const allRows = [...titleSection, ...dataRows];
      const ws = XLSX.utils.aoa_to_sheet(allRows);

      // ── Column widths (wch = width in characters) ─────────────────────
      ws["!cols"] = [
        { wch: 5  },  // No.
        { wch: 28 },  // Employee Name
        { wch: 32 },  // Email
        { wch: 22 },  //  Section
        { wch: 14 },  // Leave Type
        { wch: 13 },  // Category
        { wch: 13 },  // Start Date
        { wch: 13 },  // End Date
        { wch: 18 },  // Days
        { wch: 22 },  // Period / Time
        { wch: 25 },  // Acting Officer
        { wch: 40 },  // Reason
      ];

      // ── Row height for title row ──────────────────────────────────────
      ws["!rows"] = [{ hpt: 20 }, { hpt: 16 }, { hpt: 16 }];

      XLSX.utils.book_append_sheet(wb, ws, "Daily Leave Report");
      XLSX.writeFile(wb, `Daily_Leave_Report_${reportDate}.xlsx`);
    };
    document.head.appendChild(script);
  };

  const displayDate = reportDate
    ? new Date(reportDate + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
      })
    : "";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">

      {/* ── Header ── */}
      <div className="header-heading">
        <h3>Daily Leave Report</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="btn-add"
            onClick={exportToXLSX}
            disabled={!filteredLeaves.length}
            style={{
              background: "#28a745",
              display: "flex", alignItems: "center", gap: "5px",
              opacity: filteredLeaves.length ? 1 : 0.5,
              cursor: filteredLeaves.length ? "pointer" : "not-allowed",
            }}
          >
            <FaDownload /> Export Excel
          </button>
        </div>
      </div>

      <div className="dashboard-paragraph">
        <p>View all employees on approved leave for any selected date.</p>
      </div>

      {error && (
        <div style={{ background: "#ffe6e6", color: "#c0392b", padding: "10px", marginBottom: "20px", borderRadius: "4px" }}>
          {error}
        </div>
      )}

      {/* ── Filters ── */}
      <div
        className="filters"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px", marginBottom: "20px",
          padding: "20px", background: "#f8f9fa", borderRadius: "8px",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Report Date</label>
          <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} style={{ width: "100%" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Leave Type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>{t === "SICK" ? "VACATION" : t.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Category</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>{formatCategory(c)}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Employee</label>
          <input
            type="text" placeholder="Search by name or email"
            value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "end", gap: "10px" }}>
          <button className="btn-add" onClick={() => fetchReport(reportDate)} disabled={loading || !reportDate} style={{ opacity: loading ? 0.6 : 1 }}>
            {loading ? "Loading…" : "Get Report"}
          </button>
          <button className="btn-reset" onClick={resetFilters}>Reset Filters</button>
        </div>
      </div>

      {/* ── Summary Statistics ── */}
      {report && (
        <>
          <div style={{ marginBottom: "12px" }}>
            <span style={{ fontSize: "0.88rem", fontWeight: "700", color: "#185a9d" }}>📅 {displayDate}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "20px" }}>
            {[
              { label: "TOTAL ON LEAVE", value: (report.totalOnLeave || 0) + (report.shortLeaveCount || 0), bg: "#e3f2fd", color: "#1976d2" },
              { label: "FULL DAY",       value: report.fullDayCount    || 0, bg: "#e8f5e8", color: "#388e3c" },
              { label: "HALF DAY",       value: report.halfDayCount    || 0, bg: "#f3e5f5", color: "#7b1fa2" },
              { label: "SHORT LEAVE",    value: report.shortLeaveCount || 0, bg: "#fce4ec", color: "#c2185b" },
              { label: "MATERNITY",      value: report.maternityCount  || 0, bg: "#fff3e0", color: "#f57c00" },
            ].map((s) => (
              <div key={s.label} style={{ background: s.bg, padding: "15px", borderRadius: "8px", textAlign: "center" }}>
                <h5 style={{ margin: "0 0 5px 0", color: s.color, fontSize: "0.78rem" }}>{s.label}</h5>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Table ── */}
      {loading ? (
        <LoadingDots message="Loading daily leave report..." />
      ) : (
        <>
          <table className="user-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Section</th>
                <th>Leave Type</th>
                <th>Category</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Period / Time</th>
                <th>Acting Officer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length > 0 ? (
                currentRows.map((entry, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: "bold" }}>{entry.employeeName || "—"}</div>
                      <div style={{ fontSize: "10px", color: "#666" }}>{entry.employeeEmail}</div>
                    </td>
                    <td style={{ fontSize: "13px" }}>{entry.department || "—"}</td>
                    <td>
                      <span style={{ ...getLeaveTypeStyle(entry.leaveType, entry.category), padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" }}>
                        {entry.category === "SHORT" ? "SHORT LEAVE" : entry.category === "HALF_DAY" ? "HALF DAY" : (LEAVE_TYPE_LABEL[entry.leaveType] || entry.leaveType)}
                      </span>
                    </td>
                    <td>
                      <span style={{ ...getCategoryStyle(entry.category), padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" }}>
                        {formatCategory(entry.category)}
                      </span>
                    </td>
                    <td>{entry.startDate || "—"}</td>
                    <td>{entry.category === "SHORT" || entry.category === "HALF_DAY" ? entry.startDate || "—" : entry.endDate || "Not Set"}</td>
                    <td style={{ fontSize: "12px", fontWeight: "500" }}>{buildDays(entry)}</td>
                    <td>
                      {entry.category === "SHORT" || entry.category === "HALF_DAY" ? (
                        <span style={{ background: "#fff3e0", color: "#f57c00", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" }}>
                          {buildPeriod(entry)}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <div style={{ fontWeight: "500", fontSize: "13px" }}>{entry.actingOfficerName || "—"}</div>
                      {entry.actingOfficerEmail && <div style={{ fontSize: "10px", color: "#666" }}>{entry.actingOfficerEmail}</div>}
                    </td>
                    <td className="actions-cell">
                      <FaEye className="icon-btn update-icon"
                        onClick={() => { setSelectedLeave(entry); setIsViewingDetails(true); }}
                        title="View Details" style={{ cursor: "pointer" }} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-users">
                    {report ? "✅ No employees on leave on this date." : "Select a date and click Get Report to view results."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredLeaves.length > 0 && (
            <div className="pagination">
              <label>
                Rows per page:{" "}
                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={25}>25</option>
                </select>
              </label>
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
            </div>
          )}
        </>
      )}

      {isViewingDetails && selectedLeave && (
        <LeaveDetailModal leave={selectedLeave} onClose={() => { setIsViewingDetails(false); setSelectedLeave(null); }} />
      )}
    </div>
  );
}