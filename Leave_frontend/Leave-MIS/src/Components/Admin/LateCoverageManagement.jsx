import React, { useState, useEffect } from "react";
import {
  FaPlus, FaTrash, FaDownload, FaSearch,
  FaUserClock, FaExclamationTriangle, FaUsers, FaMinusCircle,
  FaCalendarTimes, FaCheckCircle
} from "react-icons/fa";
import API from "../../API/axios";

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const CY = new Date().getFullYear();
const LS_KEY = "lateCoverageRecords_v2";
const lsGet  = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)||"[]"); } catch { return []; } };
const lsSet  = (d) => localStorage.setItem(LS_KEY, JSON.stringify(d));

// ─────────────────────────────────────────────────────────────────────────────
const LateCoverageManagement = () => {
  const [employees,   setEmployees]   = useState([]);
  const [records,     setRecords]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showAdd,     setShowAdd]     = useState(false);
  const [successMsg,  setSuccessMsg]  = useState("");
  const [error,       setError]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  // History filters
  const [searchTerm,  setSearchTerm]  = useState("");
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter,  setYearFilter]  = useState(CY);

  // Form
  const [form, setForm] = useState({
    employeeEmail: "",
    month:         new Date().getMonth() + 1,
    year:          CY,
    dates:         [],    
    adminNote:     "",
  });
  const [dateInput, setDateInput] = useState(""); 

  // Computed
  const uncoveredCount = form.dates.length;
  const halfDaysCalc   = Math.floor(uncoveredCount / 3);
  const remainder      = uncoveredCount % 3;
  const deductDays     = halfDaysCalc * 0.5;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchEmployees(); fetchRecords(); }, []);

  const fetchEmployees = async () => {
    try {
      const data = await API.get("/admin/users");
      setEmployees(Array.isArray(data) ? data : (data?.data || []));
    } catch { setEmployees([]); }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await API.get("/admin/late-coverage");
      setRecords(Array.isArray(data) ? data : (data?.data || []));
    } catch {
      setRecords(lsGet());
    } finally { setLoading(false); }
  };

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 7000); };

  // ── Add a date to the list ─────────────────────────────────────────────────
  const addDate = () => {
    if (!dateInput) return;
    if (form.dates.includes(dateInput)) {
      setError("This date is already added."); return;
    }
    setError("");
    setForm(f => ({ ...f, dates: [...f.dates, dateInput].sort() }));
    setDateInput("");
  };

  const removeDate = (d) => setForm(f => ({ ...f, dates: f.dates.filter(x => x !== d) }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  // isSubmittingRef prevents React StrictMode double-invoke from calling API twice
  const isSubmittingRef = React.useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.employeeEmail)    { setError("Please select an employee."); return; }
    if (form.dates.length === 0){ setError("Please add at least one not-covered late date."); return; }

    // Guard: prevent double submission (React StrictMode / double click)
    if (isSubmittingRef.current) {
      console.warn("[LateCoverage] Duplicate submit blocked");
      return;
    }
    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      const emp = employees.find(e => e.email === form.employeeEmail);
      const empName = emp?.fullName || emp?.name || form.employeeEmail;

      const record = {
        employeeEmail:   form.employeeEmail,
        employeeName:    empName,
        month:           Number(form.month),
        year:            Number(form.year),
        uncoveredDates:  form.dates,
        adminNote:       form.adminNote,
        // NOTE: backend calculates halfDaysDeducted and casualDaysDeducted
        // Do NOT pass pre-calculated values to avoid double deduction
      };

      // Single API call — backend saves AND deducts in one transaction
      let response = {};
      try {
        response = await API.post("/admin/late-coverage", record);
      } catch {
        // Fallback localStorage (no deduction possible)
        lsSet([{ ...record, id: Date.now().toString(),
          uncoveredCount: form.dates.length,
          halfDaysDeducted: Math.floor(form.dates.length/3),
          casualDaysDeducted: Math.floor(form.dates.length/3)*0.5,
          remainder: form.dates.length%3
        }, ...lsGet()]);
      }

      const casual = response?.casualDeducted ?? 0;
      const hd     = response?.halfDaysDeducted ?? 0;
      const count  = response?.uncoveredCount ?? form.dates.length;
      const rem    = response?.remainder ?? 0;

      if (hd > 0) {
        showSuccess(
          `✅ Saved for ${empName}. ${count} uncovered date(s). ` +
          `${hd} × 0.5 = ${casual}d deducted from CASUAL leave.` +
          (rem > 0 ? ` (${rem} carry forward)` : "")
        );
      } else {
        showSuccess(
          `✅ Recorded ${count} uncovered date(s) for ${empName}. ` +
          `Need ${3 - (count % 3)} more for next deduction.`
        );
      }

      await fetchRecords();
      setShowAdd(false);
      setForm({ employeeEmail:"", month:new Date().getMonth()+1, year:CY, dates:[], adminNote:"" });
      setDateInput("");
    } catch (err) {
      setError(err?.message || "Failed to save.");
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteRecord = async (rec) => {
    const hasDeduction = (rec.halfDaysDeducted||0) > 0;
    const confirmMsg = hasDeduction
      ? `Delete this record?

This will RESTORE ${rec.halfDaysDeducted} half-day(s) (${rec.casualDaysDeducted}d) back to ${rec.employeeName}'s CASUAL leave.`
      : "Delete this record?";
    if (!window.confirm(confirmMsg)) return;
    try {
      const res = await API.delete(`/admin/late-coverage/${rec.id}`);
      await fetchRecords();
      const msg = res?.message || "Record deleted.";
      showSuccess(msg);
    } catch {
      const u = lsGet().filter(r => r.id !== rec.id);
      lsSet(u); setRecords(u);
      showSuccess(hasDeduction
        ? `Record deleted locally. Manually restore ${rec.casualDaysDeducted}d to ${rec.employeeName}'s CASUAL leave.`
        : "Record deleted.");
    }
  };

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = records.filter(r => {
    const ms = !searchTerm ||
      (r.employeeName||"").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.employeeEmail||"").toLowerCase().includes(searchTerm.toLowerCase());
    return ms &&
      (!monthFilter || r.month === Number(monthFilter)) &&
      (!yearFilter  || r.year  === Number(yearFilter));
  });

  const totalUncovered = filtered.reduce((s,r)=>s+(r.uncoveredCount||0),0);
  const totalDeducted  = filtered.reduce((s,r)=>s+(r.casualDaysDeducted||0),0);

  // CSV
  const exportCSV = () => {
    const hdr = ["Employee","Email","Month","Year","Uncovered Dates","Count","Half Days Deducted","Casual Days Deducted","Remainder","Note"];
    const rows = filtered.map(r=>[
      r.employeeName,r.employeeEmail,MONTHS[(r.month||1)-1],r.year,
      (r.uncoveredDates||[]).join("; "),r.uncoveredCount,r.halfDaysDeducted,
      r.casualDaysDeducted,r.remainder,`"${r.adminNote||""}"`
    ].join(","));
    const blob=new Blob([[hdr.join(","),...rows].join("\n")],{type:"text/csv"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=`LateCoverage_${MONTHS[monthFilter-1]}_${yearFilter}.csv`; a.click();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">

      {/* Header */}
      <div className="header-heading" style={{ marginBottom:"8px" }}>
        <div>
          <h3 style={{ margin:0, color:"#1565c0", display:"flex", alignItems:"center", gap:"10px" }}>
            <FaUserClock /> LATE COVERAGE MANAGEMENT
          </h3>
          <p style={{ margin:"4px 0 0", fontSize:"12px", color:"#666" }}>
            Add not-covered late dates per employee. Every <strong>3 dates = 0.5 day deducted from CASUAL leave</strong>.
          </p>
        </div>
        <div style={{ display:"flex", gap:"10px" }}>
          <button onClick={exportCSV}
            style={{ background:"#28a745", color:"white", border:"none", padding:"9px 14px",
              borderRadius:"8px", cursor:"pointer", fontWeight:"600", fontSize:"13px",
              display:"flex", alignItems:"center", gap:"6px" }}>
            <FaDownload /> EXPORT
          </button>
          <button onClick={()=>{setShowAdd(true);setError("");setForm({employeeEmail:"",month:new Date().getMonth()+1,year:CY,dates:[],adminNote:""});setDateInput("");}}
            style={{ background:"#1565c0", color:"white", border:"none", padding:"9px 16px",
              borderRadius:"8px", cursor:"pointer", fontWeight:"700", fontSize:"13px",
              display:"flex", alignItems:"center", gap:"6px" }}>
            <FaPlus /> ADD LATE RECORD
          </button>
        </div>
      </div>

      {/* Rule banner */}
      <div style={{ background:"#e3f2fd", border:"1px solid #90caf9", borderRadius:"8px",
        padding:"10px 16px", marginBottom:"16px", fontSize:"12px", color:"#1565c0",
        display:"flex", alignItems:"center", gap:"10px" }}>
        <FaExclamationTriangle style={{ color:"#1976d2", flexShrink:0 }} />
        <span>
          Admin adds the <strong>specific dates</strong> an employee was late and did NOT cover.
          System counts them and automatically deducts: <strong>3 uncovered dates = 1 × 0.5 half day from CASUAL leave</strong>.
        </span>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ background:"#e8f5e9", color:"#2e7d32", padding:"12px 16px", borderRadius:"8px",
          marginBottom:"12px", border:"1px solid #a5d6a7", fontWeight:"600", fontSize:"13px" }}>
          {successMsg}
        </div>
      )}
      {error && !showAdd && (
        <div style={{ background:"#ffebee", color:"#c62828", padding:"10px 16px", borderRadius:"8px",
          marginBottom:"12px", border:"1px solid #ef9a9a" }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px", marginBottom:"20px" }}>
        {[
          { label:"TOTAL ENTRIES",        value:filtered.length,  bg:"#e3f2fd", color:"#1565c0" },
          { label:"TOTAL UNCOVERED DATES", value:totalUncovered,  bg:"#ffebee", color:"#c62828" },
          { label:"TOTAL CASUAL DEDUCTED", value:`${totalDeducted}d`, bg:"#fff3e0", color:"#e65100" },
        ].map(s=>(
          <div key={s.label} style={{ background:s.bg, borderRadius:"10px", padding:"18px",
            textAlign:"center", border:`1px solid ${s.color}20` }}>
            <div style={{ fontSize:"11px", color:"#666", fontWeight:"700", letterSpacing:"0.5px", marginBottom:"4px" }}>{s.label}</div>
            <div style={{ fontSize:"28px", fontWeight:"800", color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 150px 120px auto", gap:"10px",
        marginBottom:"14px", padding:"14px 16px", background:"#f8f9fa",
        borderRadius:"8px", border:"1px solid #e9ecef", alignItems:"end" }}>
        <div>
          <label style={{ display:"block", marginBottom:"4px", fontWeight:"600", fontSize:"12px" }}>Search Employee</label>
          <div style={{ position:"relative" }}>
            <FaSearch style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", color:"#999" }} />
            <input type="text" placeholder="Name or email..." value={searchTerm}
              onChange={e=>setSearchTerm(e.target.value)}
              style={{ width:"100%", padding:"7px 10px 7px 32px", border:"1.5px solid #dee2e6",
                borderRadius:"6px", fontSize:"13px", boxSizing:"border-box" }} />
          </div>
        </div>
        <div>
          <label style={{ display:"block", marginBottom:"4px", fontWeight:"600", fontSize:"12px" }}>Month</label>
          <select value={monthFilter} onChange={e=>setMonthFilter(e.target.value)}
            style={{ width:"100%", padding:"7px 10px", border:"1.5px solid #dee2e6", borderRadius:"6px", fontSize:"13px" }}>
            <option value="">All</option>
            {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display:"block", marginBottom:"4px", fontWeight:"600", fontSize:"12px" }}>Year</label>
          <select value={yearFilter} onChange={e=>setYearFilter(e.target.value)}
            style={{ width:"100%", padding:"7px 10px", border:"1.5px solid #dee2e6", borderRadius:"6px", fontSize:"13px" }}>
            {[CY,CY-1,CY-2].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={()=>{setSearchTerm("");setMonthFilter(new Date().getMonth()+1);setYearFilter(CY);}}
          style={{ padding:"7px 14px", background:"#6c757d", color:"white", border:"none",
            borderRadius:"6px", cursor:"pointer", fontWeight:"600", fontSize:"13px" }}>Reset</button>
      </div>

      {/* Records Table */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"50px", color:"#888" }}>Loading…</div>
      ) : (
        <div style={{ overflowX:"auto", borderRadius:"10px", border:"1px solid #e3f2fd",
          boxShadow:"0 2px 8px rgba(21,101,192,0.08)" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
            <thead>
              <tr style={{ background:"#1565c0", color:"white" }}>
                {["EMPLOYEE","PERIOD","UNCOVERED DATES","COUNT","÷3 CALCULATION","CASUAL DEDUCTED","NOTE",""].map(h=>(
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontWeight:"700",
                    fontSize:"11px", letterSpacing:"0.5px", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan="8" style={{ textAlign:"center", padding:"40px", color:"#888" }}>
                  No records found for selected filters.
                </td></tr>
              ) : filtered.map((rec, idx) => {
                const halfD = rec.halfDaysDeducted || 0;
                const casual = rec.casualDaysDeducted || 0;
                const rem  = rec.remainder || 0;
                return (
                  <tr key={rec.id||idx}
                    style={{ background:idx%2===0?"white":"#f8fbff", borderBottom:"1px solid #e3f2fd" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#e8f0fe"}
                    onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"white":"#f8fbff"}>

                    {/* Employee */}
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ fontWeight:"700", color:"#1a1a2e" }}>{rec.employeeName}</div>
                      <div style={{ fontSize:"11px", color:"#888" }}>{rec.employeeEmail}</div>
                    </td>

                    {/* Period */}
                    <td style={{ padding:"11px 14px", whiteSpace:"nowrap" }}>
                      <span style={{ background:"#e3f2fd", color:"#1565c0", padding:"3px 10px",
                        borderRadius:"12px", fontWeight:"700", fontSize:"12px" }}>
                        {MONTHS[(rec.month||1)-1]} {rec.year}
                      </span>
                    </td>

                    {/* Dates list */}
                    <td style={{ padding:"11px 14px", maxWidth:"260px" }}>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
                        {(rec.uncoveredDates||[]).map(d=>(
                          <span key={d} style={{ background:"#ffebee", color:"#c62828",
                            padding:"2px 7px", borderRadius:"4px", fontSize:"11px",
                            fontWeight:"600", whiteSpace:"nowrap" }}>
                            {d}
                          </span>
                        ))}
                        {(!rec.uncoveredDates||rec.uncoveredDates.length===0) && (
                          <span style={{ color:"#999", fontSize:"12px" }}>—</span>
                        )}
                      </div>
                    </td>

                    {/* Count */}
                    <td style={{ padding:"11px 14px", textAlign:"center" }}>
                      <span style={{ background:"#ffebee", color:"#c62828", padding:"4px 12px",
                        borderRadius:"12px", fontWeight:"800", fontSize:"16px" }}>
                        {rec.uncoveredCount || 0}
                      </span>
                    </td>

                    {/* Calculation */}
                    <td style={{ padding:"11px 14px", whiteSpace:"nowrap" }}>
                      <div style={{ fontSize:"12px", color:"#555" }}>
                        {rec.uncoveredCount||0} ÷ 3 = <strong style={{ color:"#c62828" }}>{halfD}</strong> half day{halfD!==1?"s":""}
                      </div>
                      {rem > 0 && (
                        <div style={{ fontSize:"11px", color:"#888", marginTop:"2px" }}>
                          +{rem} carry forward
                        </div>
                      )}
                    </td>

                    {/* Deducted */}
                    <td style={{ padding:"11px 14px", textAlign:"center" }}>
                      {casual > 0 ? (
                        <span style={{ background:"#ffebee", color:"#c62828", padding:"3px 12px",
                          borderRadius:"12px", fontWeight:"800", fontSize:"14px" }}>
                          −{casual}d ✓
                        </span>
                      ) : (
                        <span style={{ color:"#999", fontSize:"12px" }}>—</span>
                      )}
                    </td>

                    {/* Note */}
                    <td style={{ padding:"11px 14px", maxWidth:"150px" }}>
                      <div style={{ fontSize:"12px", color:"#555", overflow:"hidden",
                        textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={rec.adminNote}>
                        {rec.adminNote||"—"}
                      </div>
                    </td>

                    {/* Delete */}
                    <td style={{ padding:"11px 14px" }}>
                      <button onClick={()=>deleteRecord(rec)} title="Delete"
                        style={{ background:"#ffebee", color:"#c62828", border:"none",
                          padding:"5px 8px", borderRadius:"6px", cursor:"pointer" }}>
                        <FaTrash size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ADD RECORD MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showAdd && (
        <div className="modal-overlay">
          <div className="modal" style={{ width:"580px", maxWidth:"96vw", maxHeight:"93vh", overflowY:"auto" }}>
            <div className="modal-header" style={{ background:"linear-gradient(135deg,#1565c0,#1976d2)" }}>
              <h2 style={{ color:"white", margin:0, fontSize:"15px", display:"flex", alignItems:"center", gap:"8px" }}>
                <FaCalendarTimes /> Add Not-Covered Late Dates
              </h2>
              <button className="btn-close" onClick={()=>{setShowAdd(false);setError("");}}>✖</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding:"22px" }}>
              {error && (
                <div style={{ background:"#ffebee", color:"#c62828", padding:"10px 14px",
                  borderRadius:"8px", marginBottom:"14px", fontSize:"13px", border:"1px solid #ef9a9a" }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Row 1: Employee + Period */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 120px 100px", gap:"12px", marginBottom:"16px" }}>
                <div>
                  <label style={{ display:"block", marginBottom:"5px", fontWeight:"700", fontSize:"13px" }}>
                    Employee <span style={{ color:"red" }}>*</span>
                  </label>
                  <select value={form.employeeEmail}
                    onChange={e=>setForm(f=>({...f,employeeEmail:e.target.value}))}
                    style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #dee2e6",
                      borderRadius:"7px", fontSize:"13px" }} required>
                    <option value="">— Select Employee —</option>
                    {employees.map(emp=>(
                      <option key={emp.email} value={emp.email}>
                        {emp.fullName||emp.name} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display:"block", marginBottom:"5px", fontWeight:"700", fontSize:"13px" }}>Month</label>
                  <select value={form.month} onChange={e=>setForm(f=>({...f,month:e.target.value}))}
                    style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #dee2e6", borderRadius:"7px", fontSize:"13px" }}>
                    {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:"block", marginBottom:"5px", fontWeight:"700", fontSize:"13px" }}>Year</label>
                  <select value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))}
                    style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #dee2e6", borderRadius:"7px", fontSize:"13px" }}>
                    {[CY,CY-1,CY-2].map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Date picker to add dates */}
              <div style={{ marginBottom:"16px" }}>
                <label style={{ display:"block", marginBottom:"6px", fontWeight:"700", fontSize:"13px" }}>
                  Not-Covered Late Dates <span style={{ color:"red" }}>*</span>
                  <span style={{ fontWeight:"400", fontSize:"11px", color:"#888", marginLeft:"8px" }}>
                    (add each date the employee was late and did NOT cover)
                  </span>
                </label>
                <div style={{ display:"flex", gap:"8px", marginBottom:"10px" }}>
                  <input type="date" value={dateInput}
                    onChange={e=>setDateInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addDate())}
                    style={{ flex:1, padding:"8px 12px", border:"1.5px solid #dee2e6",
                      borderRadius:"7px", fontSize:"13px" }} />
                  <button type="button" onClick={addDate}
                    style={{ padding:"8px 18px", background:"#1565c0", color:"white",
                      border:"none", borderRadius:"7px", cursor:"pointer",
                      fontWeight:"700", fontSize:"13px", whiteSpace:"nowrap" }}>
                    + Add Date
                  </button>
                </div>

                {/* Date chips */}
                {form.dates.length > 0 ? (
                  <div style={{ background:"#f8fbff", borderRadius:"8px", padding:"12px",
                    border:"1px solid #e3f2fd", minHeight:"50px" }}>
                    <div style={{ fontSize:"11px", fontWeight:"700", color:"#1565c0",
                      marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
                      Added Dates ({form.dates.length}):
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                      {form.dates.map(d=>(
                        <span key={d} style={{ background:"#ffebee", color:"#c62828",
                          padding:"4px 10px", borderRadius:"6px", fontSize:"12px",
                          fontWeight:"600", display:"flex", alignItems:"center", gap:"6px",
                          border:"1px solid #ef9a9a" }}>
                          {d}
                          <button type="button" onClick={()=>removeDate(d)}
                            style={{ background:"none", border:"none", cursor:"pointer",
                              color:"#c62828", fontSize:"14px", padding:"0", lineHeight:"1",
                              fontWeight:"700" }}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ background:"#f8f9fa", borderRadius:"8px", padding:"16px",
                    border:"2px dashed #dee2e6", textAlign:"center", color:"#888", fontSize:"13px" }}>
                    <FaCalendarTimes style={{ marginBottom:"6px", fontSize:"24px", opacity:0.4 }} /><br/>
                    No dates added yet. Pick a date and click "+ Add Date".
                  </div>
                )}
              </div>

              {/* Live calculation preview */}
              {uncoveredCount > 0 && (
                <div style={{ background: halfDaysCalc>0 ? "#ffebee" : "#fff8e1",
                  border: `1.5px solid ${halfDaysCalc>0?"#ef9a9a":"#ffe082"}`,
                  borderRadius:"10px", padding:"14px 16px", marginBottom:"16px" }}>
                  <div style={{ fontWeight:"700", fontSize:"13px",
                    color:halfDaysCalc>0?"#c62828":"#f57c00", marginBottom:"8px" }}>
                    {halfDaysCalc>0 ? "⚠️ Half Day Deduction Required" : "ℹ️ Not enough for deduction yet"}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" }}>
                    <div style={{ textAlign:"center", background:"white", borderRadius:"8px",
                      padding:"10px", border:"1px solid #e0e0e0" }}>
                      <div style={{ fontSize:"22px", fontWeight:"800", color:"#c62828" }}>{uncoveredCount}</div>
                      <div style={{ fontSize:"10px", color:"#888", fontWeight:"600" }}>UNCOVERED DATES</div>
                    </div>
                    <div style={{ textAlign:"center", background:"white", borderRadius:"8px",
                      padding:"10px", border:"1px solid #e0e0e0" }}>
                      <div style={{ fontSize:"22px", fontWeight:"800", color:"#e65100" }}>{halfDaysCalc}</div>
                      <div style={{ fontSize:"10px", color:"#888", fontWeight:"600" }}>HALF DAYS (÷3)</div>
                    </div>
                    <div style={{ textAlign:"center", background:"white", borderRadius:"8px",
                      padding:"10px", border:"1px solid #e0e0e0" }}>
                      <div style={{ fontSize:"22px", fontWeight:"800", color:"#c62828" }}>−{deductDays}d</div>
                      <div style={{ fontSize:"10px", color:"#888", fontWeight:"600" }}>FROM CASUAL</div>
                    </div>
                  </div>
                  {remainder > 0 && (
                    <div style={{ marginTop:"8px", fontSize:"12px", color:"#888", textAlign:"center" }}>
                      +{remainder} date(s) carry forward — need {3-remainder} more for next deduction
                    </div>
                  )}
                  {halfDaysCalc === 0 && (
                    <div style={{ marginTop:"8px", fontSize:"12px", color:"#f57c00", textAlign:"center" }}>
                      Add {3-uncoveredCount} more date(s) to trigger a 0.5 day deduction
                    </div>
                  )}
                </div>
              )}

              {/* Note */}
              <div style={{ marginBottom:"20px" }}>
                <label style={{ display:"block", marginBottom:"5px", fontWeight:"700", fontSize:"13px" }}>
                  Admin Note <span style={{ fontSize:"11px", color:"#888", fontWeight:"400" }}>(optional)</span>
                </label>
                <textarea rows="2" value={form.adminNote}
                  onChange={e=>setForm(f=>({...f,adminNote:e.target.value}))}
                  placeholder="e.g. Discussed with employee..."
                  style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #dee2e6",
                    borderRadius:"7px", fontSize:"13px", resize:"vertical", boxSizing:"border-box" }} />
              </div>

              {/* Buttons */}
              <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px" }}>
                <button type="button" onClick={()=>{setShowAdd(false);setError("");}}
                  style={{ padding:"9px 22px", border:"1px solid #dee2e6", background:"white",
                    borderRadius:"8px", cursor:"pointer", fontWeight:"600", fontSize:"13px" }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting||form.dates.length===0}
                  style={{ padding:"9px 22px",
                    background: halfDaysCalc>0 ? "#c62828" : "#1565c0",
                    color:"white", border:"none", borderRadius:"8px", cursor:"pointer",
                    fontWeight:"700", fontSize:"13px",
                    opacity:submitting||form.dates.length===0?0.5:1 }}>
                  {submitting ? "Saving…"
                    : halfDaysCalc>0
                    ? `Save & Deduct −${deductDays}d from CASUAL`
                    : `Save ${uncoveredCount} Date(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LateCoverageManagement;