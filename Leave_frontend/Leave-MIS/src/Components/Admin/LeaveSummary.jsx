import React, { useEffect, useState, useCallback } from "react";
import { FaEye, FaSearch, FaDownload, FaFileExport } from "react-icons/fa";
import API from "../../API/axios";

// ── Skeleton shimmer cell ─────────────────────────────────────────────────────
const Shimmer = ({ width = "60px" }) => (
  <div style={{
    display: "inline-block", width, height: "14px", borderRadius: "4px",
    background: "linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%)",
    backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
  }} />
);

// ── Loading dots ──────────────────────────────────────────────────────────────
const LoadingDots = ({ message = "Loading..." }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px", minHeight: "200px" }}>
    <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: "18px", height: "18px", borderRadius: "50%",
          background: "linear-gradient(45deg, #185a9d 0%, #43cea2 100%)",
          animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
    <p style={{ color: "#555", fontSize: "16px", fontWeight: "500", margin: 0 }}>{message}</p>
    <style>{`
      @keyframes bounce { 0%, 80%, 100% { transform: scale(0); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
      @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    `}</style>
  </div>
);

// ── Employee Details Modal ────────────────────────────────────────────────────
const EmployeeDetailsModal = ({ employee, cachedEntitlement, onClose }) => {
  const [detail, setDetail] = useState(cachedEntitlement || null);
  const [loading, setLoading] = useState(!cachedEntitlement);

  useEffect(() => {
    if (cachedEntitlement) { setDetail(cachedEntitlement); return; }
    API.get(`/admin/entitlements/${employee.email}`)
      .then((r) => setDetail(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [employee]);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: "800px", maxWidth: "90vw" }}>
        <div className="modal-header">
          <h3 style={{ color: "white", margin: 0 }}>Employee Entitlement Details</h3>
          <button className="btn-close" onClick={onClose}>✖</button>
        </div>
        <div style={{ padding: "20px" }}>
          {loading ? <LoadingDots message="Loading details..." /> : (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>Employee Information</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  {[["Name", employee.fullName || employee.name], ["Email", employee.email],
                    ["Department", employee.department], ["Designation", employee.designation]].map(([label, val]) => (
                    <div key={label}>
                      <label style={{ fontWeight: "bold" }}>{label}:</label>
                      <span style={{ marginLeft: "10px" }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <h4 style={{ marginBottom: "15px", color: "#0056b3" }}>Leave Entitlement Summary ({detail?.year})</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
                {detail?.entitlements?.filter((e) => e.leaveType !== "MATERNITY").map((ent) => (
                  <div key={ent.leaveType} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "15px", backgroundColor: "#f8f9fa" }}>
                    <h5 style={{ margin: "0 0 10px 0", color: "#333" }}>
                      {ent.leaveType === "SICK" ? "VACATION" : ent.leaveType.replace("_", " ")} LEAVE
                    </h5>
                    {ent.leaveType !== "DUTY" ? (
                      <>
                        {[["Total", ent.totalEntitlement, "#2c3e50"], ["Used", ent.usedDays, "#dc3545"], ["Remaining", ent.remainingDays, "#28a745"]].map(([lbl, val, color]) => (
                          <div key={lbl} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <label style={{ fontWeight: "bold" }}>{lbl}:</label>
                            <span style={{ color, fontWeight: "bold" }}>{val}</span>
                          </div>
                        ))}
                        <div style={{ width: "100%", backgroundColor: "#e9ecef", borderRadius: "4px", marginTop: "10px", height: "8px" }}>
                          <div style={{ width: `${Math.min((ent.usedDays / ent.totalEntitlement) * 100, 100)}%`, backgroundColor: "#007bff", height: "100%", borderRadius: "4px" }} />
                        </div>
                        <div style={{ fontSize: "12px", color: "#6c757d", marginTop: "5px", textAlign: "center" }}>
                          {((ent.usedDays / ent.totalEntitlement) * 100).toFixed(1)}% Used
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff", marginBottom: "5px" }}>{ent.usedDays}</div>
                        <div style={{ fontSize: "14px", color: "#6c757d", textTransform: "uppercase" }}>Days Used</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {detail?.shortLeaveThisMonth && (
                <div style={{ marginTop: "20px" }}>
                  <h4 style={{ marginBottom: "10px", color: "#0056b3" }}>
                    Short Leave ({new Date().toLocaleString("default", { month: "long", year: "numeric" })})
                  </h4>
                  <div style={{ display: "flex", gap: "20px", backgroundColor: "#f8f9fa", padding: "10px", borderRadius: "4px" }}>
                    {[["Total", detail.shortLeaveThisMonth.total, "#2c3e50"], ["Used", detail.shortLeaveThisMonth.used, "#dc3545"], ["Remaining", detail.shortLeaveThisMonth.remaining, "#28a745"]].map(([lbl, val, color]) => (
                      <div key={lbl}><label style={{ fontWeight: "bold" }}>{lbl}:</label><span style={{ marginLeft: "5px", color }}>{val}</span></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function LeaveSummary() {
  const [employees, setEmployees] = useState([]);        // basic user list (fast)
  const [entitlements, setEntitlements] = useState({});  // { email: data | "loading" | "error" }
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [selectedEmails, setSelectedEmails] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── Step 1: Load employee list immediately ──────────────────────────────────
  useEffect(() => {
    API.get("/admin/users")
      .then((r) => {
        const nonAdmins = (r.data || []).filter(u => !u.roles?.includes("ADMIN"));
        setEmployees(nonAdmins);
        // Mark all as loading
        const initMap = {};
        nonAdmins.forEach(u => { initMap[u.email] = "loading"; });
        setEntitlements(initMap);
        // Step 2: fetch entitlements per employee in parallel batches
        fetchEntitlementsInBatches(nonAdmins);
      })
      .catch((err) => {
        setError("Failed to load employees: " + (err.response?.data || err.message));
      })
      .finally(() => setLoadingEmployees(false));
  }, []);

  // ── Step 2: Fetch entitlements in parallel batches of 5 ──────────────────
  const fetchEntitlementsInBatches = async (users) => {
    const BATCH_SIZE = 5;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (user) => {
          try {
            const res = await API.get(`/admin/entitlements/${user.email}`);
            setEntitlements((prev) => ({ ...prev, [user.email]: res.data }));
          } catch {
            setEntitlements((prev) => ({ ...prev, [user.email]: "error" }));
          }
        })
      );
    }
  };

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = employees.filter((u) => {
    const matchSearch = !searchTerm ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = !departmentFilter || u.department === departmentFilter;
    return matchSearch && matchDept;
  });

  const uniqueDepartments = [...new Set(employees.map((u) => u.department).filter(Boolean))];
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const currentRows = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // ── Selection ───────────────────────────────────────────────────────────────
  const toggleSelect = (email) => setSelectedEmails((prev) => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  const toggleSelectAll = () => {
    const pageEmails = currentRows.map(u => u.email);
    if (selectAll) { setSelectedEmails([]); setSelectAll(false); }
    else { setSelectedEmails(pageEmails); setSelectAll(true); }
  };
  useEffect(() => {
    const pageEmails = currentRows.map(u => u.email);
    setSelectAll(pageEmails.length > 0 && pageEmails.every(e => selectedEmails.includes(e)));
  }, [selectedEmails, currentPage]);

  // ── CSV export helpers ──────────────────────────────────────────────────────
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const buildRow = (user) => {
    const ent = entitlements[user.email];
    if (!ent || ent === "loading" || ent === "error") return null;
    const casual = ent.entitlements?.find(e => e.leaveType === "CASUAL");
    const vacation = ent.entitlements?.find(e => e.leaveType === "SICK");
    const duty = ent.entitlements?.find(e => e.leaveType === "DUTY");
    const monthly = ent.shortLeaveMonthlyDetails || {};
    const totalShort = months.reduce((s, m) => s + (monthly[m]?.used || 0), 0);
    const monthCols = months.map(m => `'${monthly[m]?.used || 0}/${monthly[m]?.total || 2}`);
    return [user.fullName || user.name, user.email, user.department, user.designation,
      casual?.usedDays||0, casual?.totalEntitlement||0, casual?.remainingDays||0,
      vacation?.usedDays||0, vacation?.totalEntitlement||0, vacation?.remainingDays||0,
      duty?.usedDays||0, ...monthCols, totalShort, 24, 24-totalShort].join(",");
  };

  const exportCSV = (rows, filename) => {
    const headers = ["Name","Email","Department","Designation","Casual Used","Casual Total","Casual Remaining","Vacation Used","Vacation Total","Vacation Remaining","Duty Used",...months.map(m=>m.substring(0,3)+" Short"),"Short Total Used","Short Total Allowed","Short Remaining"];
    const csv = [headers.join(","), ...rows.filter(Boolean)].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = filename;
    a.click();
  };

  const exportAll = () => exportCSV(employees.map(buildRow), `Leave_Summary_All_${new Date().toISOString().split("T")[0]}.csv`);
  const exportSelected = () => {
    if (!selectedEmails.length) return;
    exportCSV(employees.filter(u => selectedEmails.includes(u.email)).map(buildRow), `Selected_Leave_Summary_${new Date().toISOString().split("T")[0]}.csv`);
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const EntCell = ({ email, render }) => {
    const ent = entitlements[email];
    if (ent === "loading") return <Shimmer />;
    if (ent === "error") return <span style={{ color: "#dc3545", fontSize: "11px" }}>Error</span>;
    return render(ent);
  };

  const loadedCount = Object.values(entitlements).filter(v => v !== "loading").length;
  const totalCount = employees.length;
  const allLoaded = loadedCount === totalCount && totalCount > 0;

  return (
    <div className="dashboard">
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:scale(0);opacity:.5}40%{transform:scale(1);opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% 0}100%{background-position:200% 0} }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes slideIn { from{transform:translateY(-50px);opacity:0}to{transform:translateY(0);opacity:1} }
        .modal-overlay{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;background:rgba(0,0,0,.6)!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:999999!important;animation:fadeIn .2s}
        .modal{position:relative;background:#fff;border-radius:12px;max-width:90vw;max-height:90vh;overflow-y:auto;box-shadow:0 10px 30px rgba(0,0,0,.2);animation:slideIn .3s}
        .modal-header{padding:15px 20px!important;display:flex!important;justify-content:space-between!important;align-items:center!important;background:linear-gradient(135deg,#185a9d,#43cea2)!important;border-radius:12px 12px 0 0!important}
        .btn-close{background:#dc3545!important;color:#fff!important;border:none!important;padding:8px 12px!important;cursor:pointer!important;font-weight:bold!important;border-radius:4px!important;font-size:16px!important}
        .user-table{width:100%;border-collapse:collapse;background:#fff}
        .user-table th,.user-table td{padding:10px 8px;font-size:12px;border:1px solid #e9ecef;text-align:center;vertical-align:middle;text-transform:uppercase}
        .user-table td{font-weight:bold;color:#5a5959}
        .user-table th{background:#f8f9fa;font-weight:600;color:#495057;position:sticky;top:0;z-index:10}
        .user-table tbody tr:hover{background:#f8f9fa}
        .pagination{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:15px 0;font-size:12px;font-weight:bold;text-transform:uppercase}
      `}</style>

      {/* Header */}
      <div className="header-heading">
        <h3>Employee Leave Summary - {new Date().getFullYear()}</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="btn-add" onClick={exportSelected} disabled={!selectedEmails.length}
            style={{ background: selectedEmails.length ? "#17a2b8" : "#ccc", display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", padding: "4px 8px", cursor: selectedEmails.length ? "pointer" : "not-allowed" }}>
            <FaFileExport /> Export Selected ({selectedEmails.length})
          </button>
          <button className="btn-add" onClick={exportAll}
            style={{ background: "#28a745", display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", padding: "5px 8px" }}>
            <FaDownload /> Export All CSV
          </button>
        </div>
      </div>

      <div className="dashboard-paragraph">
        <p>Manage and view employee leave summary</p>
        {/* Progress bar while loading entitlements */}
        {!allLoaded && !loadingEmployees && totalCount > 0 && (
          <div style={{ marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6c757d", marginBottom: "4px" }}>
              <span>Loading entitlements... {loadedCount}/{totalCount}</span>
              <span>{Math.round((loadedCount / totalCount) * 100)}%</span>
            </div>
            <div style={{ width: "300px", height: "6px", backgroundColor: "#e9ecef", borderRadius: "3px" }}>
              <div style={{ width: `${(loadedCount / totalCount) * 100}%`, height: "100%", background: "linear-gradient(135deg,#185a9d,#43cea2)", borderRadius: "3px", transition: "width 0.3s" }} />
            </div>
          </div>
        )}
        {selectedEmails.length > 0 && <p style={{ color: "#17a2b8", marginTop: "5px" }}>{selectedEmails.length} employee(s) selected</p>}
      </div>

      {loadingEmployees ? (
        <LoadingDots message="Loading employees..." />
      ) : error ? (
        <div style={{ background: "#ffe6e6", color: "#c0392b", padding: "20px", borderRadius: "4px", textAlign: "center" }}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} style={{ background: "#007bff", color: "white", border: "none", padding: "10px 20px", borderRadius: "4px", cursor: "pointer", marginTop: "10px" }}>Retry</button>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "15px", marginBottom: "20px", padding: "20px", background: "#f8f9fa", borderRadius: "8px" }}>
            <div style={{ position: "relative" }}>
              <FaSearch style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#6c757d" }} />
              <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ width: "100%", padding: "8px 8px 8px 35px", border: "2px solid #e9ecef", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <select value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
                style={{ padding: "8px", border: "2px solid #e9ecef", borderRadius: "4px", minWidth: "150px" }}>
                <option value="">All Sectionss</option>
                {uniqueDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <button onClick={() => { setSearchTerm(""); setDepartmentFilter(""); setCurrentPage(1); }}
                style={{ padding: "8px 15px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                Reset
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "20px" }}>
            {[
              { label: "Total Employees", value: filtered.length, bg: "#e3f2fd", color: "#1976d2" },
              { label: "Departments", value: uniqueDepartments.length, bg: "#f3e5f5", color: "#7b1fa2" },
              { label: "Loaded", value: `${loadedCount}/${totalCount}`, bg: "#e8f5e8", color: "#388e3c" },
              { label: "Selected", value: selectedEmails.length, bg: "#fff3e0", color: "#f57c00" },
            ].map((s) => (
              <div key={s.label} style={{ background: s.bg, padding: "15px", borderRadius: "8px", textAlign: "center" }}>
                <h5 style={{ margin: "0 0 5px 0", color: s.color, fontSize: "12px", textTransform: "uppercase" }}>{s.label}</h5>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
            <table className="user-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} style={{ cursor: "pointer", transform: "scale(1.2)" }} />
                  </th>
                  <th>Employee</th>
                  <th>Section</th>
                  <th>Casual Leave</th>
                  <th>Vacation Leave</th>
                  <th>Duty Leave</th>
                  <th>Short Leave (Monthly)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? currentRows.map((user) => (
                  <tr key={user.email}>
                    <td><input type="checkbox" checked={selectedEmails.includes(user.email)} onChange={() => toggleSelect(user.email)} style={{ cursor: "pointer", transform: "scale(1.2)" }} /></td>

                    <td>
                      <div style={{ fontWeight: "bold", fontSize: "14px", color: "#2c3e50" }}>{user.fullName || user.name}</div>
                      <div style={{ fontSize: "12px", color: "#6c757d" }}>{user.email}</div>
                      <div style={{ fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>{user.designation}</div>
                    </td>

                    <td>{user.department}</td>

                    {/* Casual */}
                    <td>
                      <EntCell email={user.email} render={(ent) => {
                        const c = ent.entitlements?.find(e => e.leaveType === "CASUAL");
                        return (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "14px", gap: "2px" }}>
                            <div><span style={{ color: "#dc3545", fontWeight: "600" }}>{c?.usedDays||0}</span><span style={{ margin: "0 4px", color: "#6c757d" }}>/</span><span style={{ color: "#2c3e50", fontWeight: "600" }}>{c?.totalEntitlement||0}</span></div>
                            <div style={{ fontSize: "11px", color: "#6c757d", fontStyle: "italic" }}>({c?.remainingDays||0} left)</div>
                          </div>
                        );
                      }} />
                    </td>

                    {/* Vacation */}
                    <td>
                      <EntCell email={user.email} render={(ent) => {
                        const v = ent.entitlements?.find(e => e.leaveType === "SICK");
                        return (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "14px", gap: "2px" }}>
                            <div><span style={{ color: "#dc3545", fontWeight: "600" }}>{v?.usedDays||0}</span><span style={{ margin: "0 4px", color: "#6c757d" }}>/</span><span style={{ color: "#2c3e50", fontWeight: "600" }}>{v?.totalEntitlement||0}</span></div>
                            <div style={{ fontSize: "11px", color: "#6c757d", fontStyle: "italic" }}>({v?.remainingDays||0} left)</div>
                          </div>
                        );
                      }} />
                    </td>

                    {/* Duty */}
                    <td>
                      <EntCell email={user.email} render={(ent) => {
                        const d = ent.entitlements?.find(e => e.leaveType === "DUTY");
                        return <div style={{ fontSize: "16px", fontWeight: "700", color: "#007bff" }}>{d?.usedDays||0}</div>;
                      }} />
                    </td>

                    {/* Short Leave */}
                    <td>
                      <EntCell email={user.email} render={(ent) => {
                        const monthly = ent.shortLeaveMonthlyDetails || {};
                        const total = months.reduce((s, m) => s + (monthly[m]?.used || 0), 0);
                        return (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "11px", gap: "1px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px", width: "100%" }}>
                              {months.map((m) => (
                                <div key={m} style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", padding: "1px 2px" }}>
                                  <span style={{ fontWeight: "600", color: "#495057", minWidth: "28px" }}>{m.substring(0,3)}:</span>
                                  <span>
                                    <span style={{ color: "#dc3545", fontWeight: "600" }}>{monthly[m]?.used||0}</span>
                                    <span style={{ margin: "0 1px", color: "#6c757d" }}>/</span>
                                    <span style={{ color: "#28a745", fontWeight: "600" }}>{monthly[m]?.total||2}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div style={{ borderTop: "1px solid #dee2e6", marginTop: "3px", paddingTop: "3px", width: "100%", textAlign: "center", fontWeight: "bold", fontSize: "11px" }}>
                              Total: {total}/24
                            </div>
                          </div>
                        );
                      }} />
                    </td>

                    {/* Actions */}
                    <td className="actions-cell">
                      <FaEye style={{ cursor: "pointer", fontSize: "28px", color: "#007bff", padding: "5px", borderRadius: "4px", border: "1px solid transparent", transition: "all 0.2s" }}
                        onClick={() => setSelectedEmployee(user)}
                        onMouseEnter={(e) => { e.target.style.backgroundColor="#e7f3ff"; e.target.style.border="1px solid #007bff"; }}
                        onMouseLeave={(e) => { e.target.style.backgroundColor="transparent"; e.target.style.border="1px solid transparent"; }}
                        title="View Details" />
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: "30px", fontWeight: "bold" }}>No employees found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <label>Rows per page:{" "}
              <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: "5px 8px", border: "2px solid #ccc", fontSize: "13px", cursor: "pointer" }}>
                {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1}
                style={{ padding: "7px 12px", border: "none", fontWeight: "bold", fontSize: "11px", textTransform: "uppercase", background: currentPage===1?"#ccc":"#6c757d", color: "white", cursor: currentPage===1?"not-allowed":"pointer" }}>
                Previous
              </button>
              <span style={{ fontWeight: "bold", color: "#6e6d6d" }}>Page {currentPage} of {totalPages || 1}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} disabled={currentPage===totalPages||totalPages===0}
                style={{ padding: "7px 12px", border: "none", fontWeight: "bold", fontSize: "11px", textTransform: "uppercase", background: currentPage===totalPages||totalPages===0?"#ccc":"#6c757d", color: "white", cursor: currentPage===totalPages||totalPages===0?"not-allowed":"pointer" }}>
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          cachedEntitlement={entitlements[selectedEmployee.email] !== "loading" && entitlements[selectedEmployee.email] !== "error" ? entitlements[selectedEmployee.email] : null}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}