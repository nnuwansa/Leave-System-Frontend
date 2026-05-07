import React, { useEffect, useState } from "react";
import API from "../../API/axios";
import "../CSS/Admin.css";
import { FaEye, FaPlus, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = {
    PENDING_APPROVAL: { bg:"#e3f2fd", color:"#1565c0", label:"Pending",  icon:<FaClock      size={10}/> },
    APPROVED:         { bg:"#e8f5e9", color:"#2e7d32", label:"Approved", icon:<FaCheckCircle size={10}/> },
    REJECTED:         { bg:"#ffebee", color:"#c62828", label:"Rejected", icon:<FaTimesCircle size={10}/> },
  }[status] || { bg:"#f5f5f5", color:"#555", label:status, icon:null };
  return (
    <span style={{ background:s.bg, color:s.color, padding:"3px 10px", borderRadius:"20px",
      fontSize:"11px", fontWeight:"700", display:"inline-flex", alignItems:"center", gap:"4px" }}>
      {s.icon}{s.label}
    </span>
  );
};

// ── Year Grants Mini Table ─────────────────────────────────────────────────────
const YearGrantsTable = ({ yearGrants }) => {
  if (!yearGrants || !yearGrants.length) return <span style={{ color:"#999", fontSize:"12px" }}>—</span>;
  return (
    <div style={{ minWidth:"180px" }}>
      {yearGrants.map(yg => (
        <div key={yg.previousYear} style={{ display:"flex", alignItems:"center", gap:"6px",
          marginBottom:"2px", fontSize:"12px" }}>
          <span style={{ background:"#e3f2fd", color:"#1565c0", padding:"1px 7px",
            borderRadius:"4px", fontWeight:"700", minWidth:"38px", textAlign:"center" }}>
            {yg.previousYear}
          </span>
          <span style={{ color:"#555" }}>
            {yg.previousYearRemainingDays >= 0 ? `${yg.previousYearRemainingDays}d avail` : "—"}
          </span>
          <span style={{ color:"#2e7d32", fontWeight:"700" }}>→ +{yg.daysToGrant}d</span>
        </div>
      ))}
    </div>
  );
};

// ── Detail Modal ───────────────────────────────────────────────────────────────
const DetailModal = ({ req, onClose }) => {
  if (!req) return null;
  const statusColor = req.status==="APPROVED"?"#2e7d32":req.status==="REJECTED"?"#c62828":"#1565c0";
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width:"680px", maxWidth:"95vw", maxHeight:"90vh", overflowY:"auto" }}>
        <div className="modal-header" style={{ background:"linear-gradient(135deg,#1565c0,#1976d2)" }}>
          <h2 style={{ color:"white", margin:0, fontSize:"16px" }}>🔵 Emergency Leave — Request Details</h2>
          <button className="btn-close" onClick={onClose}>✖</button>
        </div>
        <div style={{ padding:"24px" }}>

          {/* Status banner */}
          <div style={{ background:req.status==="APPROVED"?"#e8f5e9":req.status==="REJECTED"?"#ffebee":"#e3f2fd",
            border:`1px solid ${statusColor}40`, borderRadius:"10px", padding:"12px 16px",
            marginBottom:"20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:"800", color:statusColor, fontSize:"15px" }}>
                <StatusBadge status={req.status} /> &nbsp; +{req.totalDaysToGrant} days emergency credit
              </div>
              <div style={{ fontSize:"12px", color:"#555", marginTop:"4px" }}>
                Target year: <strong>{req.targetYear}</strong>
              </div>
            </div>
            <div style={{ textAlign:"right", fontSize:"12px", color:"#666" }}>
              <div>{req.createdAt ? new Date(req.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—"}</div>
            </div>
          </div>

          {/* Employee + Admin grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>
            <div style={{ background:"#f8fbff", borderRadius:"8px", padding:"14px", border:"1px solid #e3f2fd" }}>
              <div style={{ fontWeight:"700", color:"#1565c0", marginBottom:"8px", fontSize:"13px" }}>👤 Employee</div>
              <div style={{ fontWeight:"600" }}>{req.employeeName}</div>
              <div style={{ fontSize:"12px", color:"#666" }}>{req.employeeEmail}</div>
            </div>
            <div style={{ background:"#f8fbff", borderRadius:"8px", padding:"14px", border:"1px solid #e3f2fd" }}>
              <div style={{ fontWeight:"700", color:"#1565c0", marginBottom:"8px", fontSize:"13px" }}>🏢 Requested By</div>
              <div style={{ fontWeight:"600" }}>{req.requestedByAdminName}</div>
              <div style={{ fontSize:"12px", color:"#666" }}>{req.requestedByAdminEmail}</div>
            </div>
          </div>

          {/* Year grants table */}
          <div style={{ marginBottom:"16px" }}>
            <div style={{ fontWeight:"700", color:"#1565c0", marginBottom:"8px", fontSize:"13px" }}>📅 Year Grants</div>
            <div style={{ border:"1px solid #e3f2fd", borderRadius:"8px", overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 1fr 1fr",
                padding:"8px 14px", background:"#1565c0", color:"white",
                fontSize:"12px", fontWeight:"700" }}>
                <span>Year</span>
                <span style={{ textAlign:"center" }}>Prev. Remaining</span>
                <span style={{ textAlign:"center" }}>Days Granted</span>
                <span style={{ textAlign:"center" }}>Target</span>
              </div>
              {(req.yearGrants||[]).map((yg,i) => (
                <div key={yg.previousYear} style={{ display:"grid", gridTemplateColumns:"80px 1fr 1fr 1fr",
                  padding:"8px 14px", fontSize:"13px",
                  background:i%2===0?"white":"#f8fbff", borderBottom:"1px solid #e3f2fd" }}>
                  <span style={{ fontWeight:"700", color:"#1565c0" }}>{yg.previousYear}</span>
                  <span style={{ textAlign:"center", color:"#555" }}>{yg.previousYearRemainingDays>=0?`${yg.previousYearRemainingDays}d`:"—"}</span>
                  <span style={{ textAlign:"center", color:"#2e7d32", fontWeight:"700" }}>+{yg.daysToGrant}d</span>
                  <span style={{ textAlign:"center", color:"#1565c0" }}>{req.targetYear}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 14px",
                background:"#e3f2fd", fontWeight:"800", color:"#1565c0" }}>
                <span>Total</span>
                <span style={{ color:"#2e7d32", fontSize:"16px" }}>+{req.totalDaysToGrant} days</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom:"16px" }}>
            <div style={{ fontWeight:"700", color:"#1565c0", marginBottom:"8px", fontSize:"13px" }}>📝 Reason / Medical Note</div>
            <div style={{ background:"#f8f9fa", padding:"12px 14px", borderRadius:"8px",
              fontSize:"13px", borderLeft:"3px solid #1976d2" }}>
              {req.reason || "—"}
            </div>
          </div>

          {/* Approval Officer */}
          <div style={{ background:"#f8fbff", borderRadius:"8px", padding:"14px", border:"1px solid #e3f2fd" }}>
            <div style={{ fontWeight:"700", color:"#1565c0", marginBottom:"8px", fontSize:"13px" }}>
              {req.status==="APPROVED"?"✅ Approved By":req.status==="REJECTED"?"❌ Rejected By":"⏳ Pending Approval From"}
            </div>
            <div style={{ fontWeight:"600" }}>{req.approvalOfficerName}</div>
            <div style={{ fontSize:"12px", color:"#666" }}>{req.approvalOfficerEmail}</div>
            {req.approvalOfficerComments && (
              <div style={{ marginTop:"8px", fontSize:"13px", fontStyle:"italic",
                padding:"8px", background:"white", borderRadius:"6px", color:"#555",
                border:"1px solid #e0e0e0" }}>
                "{req.approvalOfficerComments}"
              </div>
            )}
            {req.approvalOfficerActionAt && (
              <div style={{ fontSize:"11px", color:"#999", marginTop:"6px" }}>
                {new Date(req.approvalOfficerActionAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const EmergencyLeaveAdmin = () => {
  const [requests,      setRequests]      = useState([]);
  const [employees,     setEmployees]     = useState([]);
  const [allOfficers,   setAllOfficers]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showCreate,    setShowCreate]    = useState(false);
  const [selectedReq,   setSelectedReq]   = useState(null);
  const [error,         setError]         = useState("");
  const [successMsg,    setSuccessMsg]    = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [statusFilter,  setStatusFilter]  = useState("");
  const [empFilter,     setEmpFilter]     = useState("");
  const [currentPage,   setCurrentPage]   = useState(1);
  const rowsPerPage = 10;

  // Form state
  const [form,            setForm]            = useState({ employeeEmail:"", reason:"", approvalOfficerEmail:"" });
  const [allYearsData,    setAllYearsData]    = useState(null);
  const [checkingRemain,  setCheckingRemain]  = useState(false);
  const [selectedYears,   setSelectedYears]   = useState({});

  // ── Fetch all data ─────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reqs, emps] = await Promise.all([
        API.get("/emergency-leave/admin/all"),
        API.get("/admin/users"),
      ]);
      setRequests(Array.isArray(reqs) ? reqs : (reqs?.data || []));
      const empArr = Array.isArray(emps) ? emps : (emps?.data || []);
      setEmployees(empArr);
      setAllOfficers(empArr.filter(e => e.department==="All" || e.role==="APPROVAL_OFFICER"));
    } catch(e) { setError("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── When employee changes, fetch all previous years ────────────────────────
  useEffect(() => {
    if (!form.employeeEmail) { setAllYearsData(null); setSelectedYears({}); return; }
    setCheckingRemain(true);
    setAllYearsData(null);
    setSelectedYears({});
    API.get(`/emergency-leave/admin/check-all-years?email=${form.employeeEmail}`)
      .then(data => { setAllYearsData(data); })
      .catch(() => setAllYearsData(null))
      .finally(() => setCheckingRemain(false));
  }, [form.employeeEmail]);

  // ── Toggle year checkbox ───────────────────────────────────────────────────
  const toggleYear = (yr) => {
    setSelectedYears(prev => {
      if (prev[yr] !== undefined) { const n={...prev}; delete n[yr]; return n; }
      const yrData = (allYearsData?.yearBreakdown||[]).find(y=>y.year===yr);
      const max = yrData?.netAvailable || 0;
      return { ...prev, [yr]: max > 0 ? max : "" };
    });
  };

  const updateYearDays = (yr, val) => {
    setSelectedYears(prev => ({ ...prev, [yr]: val }));
  };

  const totalGrantDays = Object.values(selectedYears).reduce((s,v)=>s+(parseFloat(v)||0), 0);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    const yearEntries = Object.entries(selectedYears).filter(([,d])=>parseFloat(d)>0);
    if (!form.employeeEmail)            { setError("Please select an employee.");           return; }
    if (yearEntries.length === 0)       { setError("Please select at least one year.");     return; }
    if (!form.approvalOfficerEmail)     { setError("Please select an approval officer.");   return; }
    if (!form.reason.trim())            { setError("Please provide a reason.");             return; }
    if (allYearsData && !allYearsData.eligible) { setError(allYearsData.notEligibleReason); return; }
    for (const [yr,days] of yearEntries) {
      if (!parseFloat(days)||parseFloat(days)<=0) { setError(`Enter valid days for year ${yr}.`); return; }
    }
    setSubmitting(true);
    try {
      const payload = {
        employeeEmail: form.employeeEmail,
        reason: form.reason,
        approvalOfficerEmail: form.approvalOfficerEmail,
        yearGrants: yearEntries.map(([yr,days])=>({ previousYear:Number(yr), daysToGrant:parseFloat(days) })),
      };
      await API.post("/emergency-leave/admin/create", payload);
      setSuccessMsg(`✅ Emergency leave request submitted — ${totalGrantDays} days from ${yearEntries.length} year(s).`);
      setShowCreate(false);
      setForm({ employeeEmail:"", reason:"", approvalOfficerEmail:"" });
      setAllYearsData(null); setSelectedYears({});
      fetchAll();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch(err) {
      setError(err?.response?.data?.message || err?.message || "Failed to submit request.");
    } finally { setSubmitting(false); }
  };

  // ── Filter + paginate ──────────────────────────────────────────────────────
  const filtered = requests.filter(r => {
    const matchStatus = !statusFilter || r.status===statusFilter;
    const matchEmp    = !empFilter    || (r.employeeName||"").toLowerCase().includes(empFilter.toLowerCase())
                                      || (r.employeeEmail||"").toLowerCase().includes(empFilter.toLowerCase());
    return matchStatus && matchEmp;
  });
  const totalPages  = Math.max(1, Math.ceil(filtered.length/rowsPerPage));
  const currentRows = filtered.slice((currentPage-1)*rowsPerPage, currentPage*rowsPerPage);
  const stats = {
    total:   requests.length,
    pending: requests.filter(r=>r.status==="PENDING_APPROVAL").length,
    approved:requests.filter(r=>r.status==="APPROVED").length,
    rejected:requests.filter(r=>r.status==="REJECTED").length,
  };

  return (
    <div className="dashboard">

      {/* ── Page Header ── */}
      <div className="header-heading" style={{ marginBottom:"6px" }}>
        <div>
          <h3 style={{ margin:0, color:"#1565c0" }}>EMERGENCY LEAVE REQUESTS</h3>
          <p style={{ margin:"4px 0 0", fontSize:"12px", color:"#ba2b92", fontWeight:"600" }}>
            GRANT PREVIOUS YEAR&apos;S REMAINING VACATION LEAVE TO EMPLOYEES DURING EMERGENCIES/SICKNESS. REQUIRES APPROVAL OFFICER SIGN-OFF.
          </p>
        </div>
        <button onClick={()=>{setShowCreate(true);setError("");setForm({employeeEmail:"",reason:"",approvalOfficerEmail:""});setAllYearsData(null);setSelectedYears({});}}
          style={{ background:"#1565c0", color:"white", border:"none", padding:"10px 18px",
            borderRadius:"8px", cursor:"pointer", fontWeight:"700", fontSize:"13px",
            display:"flex", alignItems:"center", gap:"8px" }}>
          <FaPlus />  NEW EMERGENCY REQUEST
        </button>
      </div>

      {/* ── Warning banner ── */}
      <div style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:"8px",
        padding:"10px 16px", marginBottom:"20px", fontSize:"12px", color:"#795548",
        display:"flex", alignItems:"center", gap:"10px" }}>
        <FaExclamationTriangle style={{ color:"#f57c00", flexShrink:0 }} />
        <span><strong>Emergency Use Only:</strong> This feature allows granting previous year&apos;s unused vacation days in emergency/medical situations. All grants require Approval Officer authorization.</span>
      </div>

      {/* ── Messages ── */}
      {successMsg && (
        <div style={{ background:"#e8f5e9", color:"#2e7d32", padding:"12px 16px", borderRadius:"8px",
          marginBottom:"16px", border:"1px solid #a5d6a7", fontWeight:"600" }}>
          {successMsg}
        </div>
      )}
      {error && !showCreate && (
        <div style={{ background:"#ffebee", color:"#c62828", padding:"12px 16px", borderRadius:"8px",
          marginBottom:"16px", border:"1px solid #ef9a9a" }}>
          {error}
        </div>
      )}

      {/* ── Stats cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"24px" }}>
        {[
          { label:"TOTAL REQUESTS", value:stats.total,    bg:"#e3f2fd", color:"#1565c0" },
          { label:"PENDING",        value:stats.pending,  bg:"#fff3e0", color:"#e65100" },
          { label:"APPROVED",       value:stats.approved, bg:"#e8f5e9", color:"#2e7d32" },
          { label:"REJECTED",       value:stats.rejected, bg:"#ffebee", color:"#c62828" },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:"10px", padding:"18px",
            textAlign:"center", border:`1px solid ${s.color}20` }}>
            <div style={{ fontSize:"11px", color:"#666", fontWeight:"700", letterSpacing:"0.5px", marginBottom:"6px" }}>{s.label}</div>
            <div style={{ fontSize:"28px", fontWeight:"800", color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr auto", gap:"12px",
        marginBottom:"16px", padding:"16px", background:"#f8f9fa", borderRadius:"8px",
        border:"1px solid #e9ecef", alignItems:"end" }}>
        <div>
          <label style={{ display:"block", marginBottom:"5px", fontWeight:"600", fontSize:"13px" }}>Status</label>
          <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setCurrentPage(1);}}
            style={{ width:"100%", padding:"7px 10px", border:"1.5px solid #dee2e6", borderRadius:"6px", fontSize:"13px" }}>
            <option value="">ALL STATUSES</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div>
          <label style={{ display:"block", marginBottom:"5px", fontWeight:"600", fontSize:"13px" }}>Employee</label>
          <input type="text" placeholder="Search by name or email..."
            value={empFilter} onChange={e=>{setEmpFilter(e.target.value);setCurrentPage(1);}}
            style={{ width:"100%", padding:"7px 10px", border:"1.5px solid #dee2e6", borderRadius:"6px", fontSize:"13px" }} />
        </div>
        <button onClick={()=>{setStatusFilter("");setEmpFilter("");setCurrentPage(1);}}
          style={{ padding:"7px 16px", background:"#6c757d", color:"white", border:"none",
            borderRadius:"6px", cursor:"pointer", fontWeight:"600", fontSize:"13px" }}>
          RESET FILTERS
        </button>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"60px", color:"#888" }}>
          <div className="spinner-border text-primary mb-3" />
          <p>Loading emergency leave requests…</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX:"auto", borderRadius:"10px", border:"1px solid #e3f2fd", boxShadow:"0 2px 8px rgba(21,101,192,0.08)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
              <thead>
                <tr style={{ background:"#a0a7ad", color:"white" }}>
                  {["EMPLOYEE","YEAR(S) & DAYS","TOTAL GRANTED","REASON","APPROVAL OFFICER","STATUS","CREATED","ACTIONS"].map(h => (
                    <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontWeight:"700",
                      fontSize:"11px", letterSpacing:"0.5px", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign:"center", padding:"40px", color:"#888", fontSize:"14px" }}>
                    No emergency leave requests found.
                  </td></tr>
                ) : currentRows.map((req, idx) => (
                  <tr key={req.id} style={{ background:idx%2===0?"white":"#f8fbff",
                    borderBottom:"1px solid #e3f2fd", transition:"background 0.15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#e8f0fe"}
                    onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"white":"#f8fbff"}>

                    {/* Employee */}
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ fontWeight:"700", color:"#1a1a2e" }}>{req.employeeName||"—"}</div>
                      <div style={{ fontSize:"11px", color:"#888", marginTop:"1px" }}>{req.employeeEmail}</div>
                    </td>

                    {/* Year(s) + Days — multi-year display */}
                    <td style={{ padding:"11px 14px" }}>
                      <YearGrantsTable yearGrants={req.yearGrants} />
                    </td>

                    {/* Total Granted */}
                    <td style={{ padding:"11px 14px", textAlign:"center" }}>
                      <span style={{ background:"#e3f2fd", color:"#1565c0", padding:"4px 12px",
                        borderRadius:"20px", fontWeight:"800", fontSize:"14px", display:"inline-block" }}>
                        +{req.totalDaysToGrant}d
                      </span>
                      <div style={{ fontSize:"10px", color:"#888", marginTop:"2px" }}>→ {req.targetYear} balance</div>
                    </td>

                    {/* Reason */}
                    <td style={{ padding:"11px 14px", maxWidth:"160px" }}>
                      <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        fontSize:"12px", color:"#444" }} title={req.reason}>
                        {req.reason || "—"}
                      </div>
                    </td>

                    {/* Approval Officer */}
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ fontWeight:"600", fontSize:"12px" }}>{req.approvalOfficerName||"—"}</div>
                      <div style={{ fontSize:"10px", color:"#888" }}>{req.approvalOfficerEmail}</div>
                    </td>

                    {/* Status */}
                    <td style={{ padding:"11px 14px" }}><StatusBadge status={req.status} /></td>

                    {/* Created */}
                    <td style={{ padding:"11px 14px", fontSize:"12px", color:"#555", whiteSpace:"nowrap" }}>
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                    </td>

                    {/* Actions */}
                    <td style={{ padding:"11px 14px" }}>
                      <button onClick={()=>setSelectedReq(req)} title="View Details"
                        style={{ background:"#e3f2fd", color:"#1565c0", border:"none",
                          padding:"5px 10px", borderRadius:"6px", cursor:"pointer" }}>
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > rowsPerPage && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
              marginTop:"14px", padding:"10px 0" }}>
              <span style={{ fontSize:"13px", color:"#666" }}>
                Showing {(currentPage-1)*rowsPerPage+1}–{Math.min(currentPage*rowsPerPage,filtered.length)} of {filtered.length}
              </span>
              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={()=>setCurrentPage(p=>Math.max(p-1,1))} disabled={currentPage===1}
                  style={{ padding:"6px 14px", border:"1px solid #dee2e6", borderRadius:"6px",
                    background:currentPage===1?"#f8f9fa":"white", cursor:currentPage===1?"not-allowed":"pointer",
                    fontSize:"13px", fontWeight:"600" }}>
                  Previous
                </button>
                <span style={{ padding:"6px 12px", background:"#1565c0", color:"white",
                  borderRadius:"6px", fontSize:"13px", fontWeight:"700" }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages}
                  style={{ padding:"6px 14px", border:"1px solid #dee2e6", borderRadius:"6px",
                    background:currentPage===totalPages?"#f8f9fa":"white",
                    cursor:currentPage===totalPages?"not-allowed":"pointer", fontSize:"13px", fontWeight:"600" }}>
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          DETAIL MODAL
      ═══════════════════════════════════════════════════════════ */}
      {selectedReq && <DetailModal req={selectedReq} onClose={()=>setSelectedReq(null)} />}

      {/* ═══════════════════════════════════════════════════════════
          CREATE MODAL
      ═══════════════════════════════════════════════════════════ */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal" style={{ width:"660px", maxWidth:"96vw", maxHeight:"92vh", overflowY:"auto" }}>
            <div className="modal-header" style={{ background:"linear-gradient(135deg,#1565c0,#1976d2)" }}>
              <h2 style={{ color:"white", margin:0, fontSize:"15px", display:"flex", alignItems:"center", gap:"10px" }}>
                <FaExclamationTriangle /> New Emergency Leave Request
              </h2>
              <button className="btn-close" onClick={()=>{setShowCreate(false);setError("");}}>✖</button>
            </div>

            <form onSubmit={handleCreate} style={{ padding:"24px" }}>

              {error && (
                <div style={{ background:"#ffebee", color:"#c62828", padding:"10px 14px",
                  borderRadius:"8px", marginBottom:"16px", fontSize:"13px", border:"1px solid #ef9a9a" }}>
                  ⚠️ {error}
                </div>
              )}

              {/* ── Row 1: Employee select ── */}
              <div style={{ marginBottom:"18px" }}>
                <label style={{ display:"block", marginBottom:"6px", fontWeight:"700", fontSize:"13px" }}>
                  1. Select Employee <span style={{ color:"red" }}>*</span>
                </label>
                <select value={form.employeeEmail}
                  onChange={e=>setForm(f=>({...f,employeeEmail:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #dee2e6",
                    borderRadius:"8px", fontSize:"13px" }} required>
                  <option value="">— Select Employee —</option>
                  {employees.map(e => (
                    <option key={e.email} value={e.email}>{e.fullName||e.name} ({e.email})</option>
                  ))}
                </select>
              </div>

              {/* ── Year selection ── */}
              {form.employeeEmail && (
                <div style={{ marginBottom:"18px" }}>
                  <label style={{ display:"block", marginBottom:"8px", fontWeight:"700", fontSize:"13px" }}>
                    2. Select Year(s) &amp; Days to Grant <span style={{ color:"red" }}>*</span>
                    <span style={{ fontWeight:"400", fontSize:"11px", color:"#888", marginLeft:"8px" }}>
                      (years before {new Date().getFullYear()-1} only)
                    </span>
                  </label>

                  {/* Loading */}
                  {checkingRemain && (
                    <div style={{ textAlign:"center", padding:"30px", color:"#888",
                      background:"#f8f9fa", borderRadius:"8px", border:"1px solid #e9ecef" }}>
                      <div style={{ display:"flex", justifyContent:"center", gap:"8px", marginBottom:"10px" }}>
                        {[0,1,2].map(i=>(
                          <div key={i} style={{ width:"10px", height:"10px", borderRadius:"50%",
                            background:"#1565c0", animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                        ))}
                      </div>
                      <span style={{ fontSize:"13px" }}>Loading previous years vacation history…</span>
                      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.3);opacity:0.3}40%{transform:scale(1);opacity:1}}`}</style>
                    </div>
                  )}

                  {/* Eligibility banner */}
                  {!checkingRemain && allYearsData && (
                    allYearsData.eligible ? (
                      <div style={{ background:"#e8f5e9", border:"1px solid #a5d6a7", borderRadius:"8px",
                        padding:"10px 14px", marginBottom:"12px", fontSize:"12px", color:"#2e7d32",
                        display:"flex", alignItems:"center", gap:"8px" }}>
                        ✅ <span><strong>Eligible:</strong> {new Date().getFullYear()} vacation balance is fully used. Emergency leave from previous years can be requested.</span>
                      </div>
                    ) : (
                      <div style={{ background:"#fff3e0", border:"1px solid #ffcc80", borderRadius:"8px",
                        padding:"10px 14px", marginBottom:"12px", fontSize:"12px", color:"#e65100",
                        display:"flex", alignItems:"center", gap:"8px" }}>
                        ⚠️ <span><strong>Not Eligible:</strong> {allYearsData.notEligibleReason}</span>
                      </div>
                    )
                  )}

                  {/* Year table */}
                  {!checkingRemain && allYearsData?.hasAnyData && allYearsData?.eligible && (
                    <div style={{ border:"1.5px solid #e3f2fd", borderRadius:"10px", overflow:"hidden" }}>
                      {/* Table header */}
                      <div style={{ display:"grid", gridTemplateColumns:"40px 80px 1fr 1fr 160px",
                        background:"#1565c0", color:"white", padding:"9px 14px",
                        fontSize:"12px", fontWeight:"700", gap:"8px", alignItems:"center" }}>
                        <span></span>
                        <span>Year</span>
                        <span>Available</span>
                        <span>Already Granted</span>
                        <span>Days to Grant</span>
                      </div>

                      {/* Year rows */}
                      {(allYearsData.yearBreakdown||[]).map((yr,i) => {
                        const isChecked = selectedYears[yr.year] !== undefined;
                        const daysVal   = selectedYears[yr.year] ?? "";
                        const inputDays = parseFloat(daysVal) || 0;
                        return (
                          <div key={yr.year} style={{ display:"grid",
                            gridTemplateColumns:"40px 80px 1fr 1fr 160px",
                            padding:"9px 14px", gap:"8px", alignItems:"center",
                            background: isChecked ? "#e8f0fe" : (i%2===0?"white":"#f8fbff"),
                            borderBottom:"1px solid #e3f2fd",
                            opacity: yr.netAvailable===0 ? 0.5 : 1 }}>

                            {/* Checkbox */}
                            <input type="checkbox" checked={isChecked}
                              onChange={()=>toggleYear(yr.year)}
                              disabled={yr.netAvailable===0}
                              style={{ width:"16px", height:"16px", cursor:"pointer", accentColor:"#1565c0" }} />

                            {/* Year */}
                            <span style={{ fontWeight:"700", color:"#1565c0", fontSize:"14px" }}>{yr.year}</span>

                            {/* Available */}
                            <span style={{ color: yr.netAvailable>0?"#2e7d32":"#c62828",
                              fontWeight:"600", fontSize:"13px" }}>
                              {yr.netAvailable > 0 ? `${yr.netAvailable} days` : "None available"}
                            </span>

                            {/* Already granted */}
                            <span style={{ color: yr.alreadyGranted>0?"#e65100":"#888", fontSize:"13px" }}>
                              {yr.alreadyGranted > 0 ? `${yr.alreadyGranted} days` : "—"}
                            </span>

                            {/* Days input */}
                            {isChecked ? (
                              <input type="number" min="0.5" step="0.5"
                                value={daysVal}
                                onChange={e=>updateYearDays(yr.year, e.target.value)}
                                placeholder={`e.g. ${yr.netAvailable}`}
                                style={{ width:"100%", padding:"6px 10px",
                                  border:"1.5px solid #90caf9",
                                  background:"white", borderRadius:"6px",
                                  fontSize:"13px", fontWeight:"600", color:"#1565c0",
                                  boxSizing:"border-box" }} />
                            ) : (
                              <span style={{ fontSize:"12px", color:"#aaa" }}>Select to enter days</span>
                            )}
                          </div>
                        );
                      })}

                      {/* Footer total */}
                      {Object.keys(selectedYears).length > 0 && (
                        <div style={{ padding:"10px 14px", background:"#e3f2fd",
                          display:"flex", justifyContent:"space-between", alignItems:"center",
                          fontSize:"13px", fontWeight:"700", color:"#1565c0" }}>
                          <span>Total across {Object.keys(selectedYears).length} selected year(s):</span>
                          <span style={{ fontSize:"20px", color:"#2e7d32" }}>{totalGrantDays} days</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Not eligible locked state */}
                  {!checkingRemain && allYearsData?.hasAnyData && !allYearsData?.eligible && (
                    <div style={{ padding:"14px", background:"#fff3e0", borderRadius:"8px",
                      fontSize:"13px", color:"#e65100", border:"1px solid #ffcc80" }}>
                      🔒 Previous year data exists but emergency leave cannot be requested yet.<br/>
                      Current year ({new Date().getFullYear()}) vacation balance must be 0 first.
                    </div>
                  )}

                  {/* No data */}
                  {!checkingRemain && allYearsData && !allYearsData.hasAnyData && (
                    <div style={{ padding:"14px", background:"#fff8e1", borderRadius:"8px",
                      fontSize:"13px", color:"#f57c00", border:"1px solid #ffe082" }}>
                      ⚠️ No previous year vacation history found for this employee (years before {new Date().getFullYear()-1}).
                    </div>
                  )}
                </div>
              )}

              {/* ── Reason ── */}
              <div style={{ marginBottom:"18px" }}>
                <label style={{ display:"block", marginBottom:"6px", fontWeight:"700", fontSize:"13px" }}>
                  3. Reason / Medical Note <span style={{ color:"red" }}>*</span>
                </label>
                <textarea rows="3" value={form.reason}
                  onChange={e=>setForm(f=>({...f,reason:e.target.value}))}
                  placeholder="Describe the emergency situation or medical reason..."
                  style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #dee2e6",
                    borderRadius:"8px", fontSize:"13px", resize:"vertical", boxSizing:"border-box" }}
                  required />
              </div>

              {/* ── Approval Officer ── */}
              <div style={{ marginBottom:"24px" }}>
                <label style={{ display:"block", marginBottom:"6px", fontWeight:"700", fontSize:"13px" }}>
                  4. Approval Officer <span style={{ color:"red" }}>*</span>
                </label>
                <p style={{ fontSize:"11px", color:"#888", margin:"0 0 6px" }}>Only officers with access to all departments are listed.</p>
                <select value={form.approvalOfficerEmail}
                  onChange={e=>setForm(f=>({...f,approvalOfficerEmail:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #dee2e6",
                    borderRadius:"8px", fontSize:"13px" }} required>
                  <option value="">— Select Approval Officer —</option>
                  {allOfficers.map(o => (
                    <option key={o.email} value={o.email}>{o.fullName||o.name} ({o.email})</option>
                  ))}
                </select>
                {allOfficers.length === 0 && (
                  <p style={{ fontSize:"11px", color:"#e65100", marginTop:"4px" }}>
                    ⚠️ No officers with "All" department access found.
                  </p>
                )}
              </div>

              {/* ── Summary ── */}
              {Object.keys(selectedYears).length > 0 && totalGrantDays > 0 && (
                <div style={{ background:"#e8f0fe", borderRadius:"8px", padding:"12px 16px",
                  marginBottom:"16px", fontSize:"13px", color:"#1565c0",
                  border:"1px solid #c5cae9" }}>
                  📋 <strong>Summary:</strong> Granting <strong>{totalGrantDays} days</strong> from{" "}
                  {Object.entries(selectedYears).filter(([,d])=>parseFloat(d)>0).map(([yr,d])=>`${yr} (${d}d)`).join(" + ")}{" "}
                  to {employees.find(e=>e.email===form.employeeEmail)?.fullName || employees.find(e=>e.email===form.employeeEmail)?.name || form.employeeEmail}.
                </div>
              )}

              {/* ── Buttons ── */}
              <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px" }}>
                <button type="button" onClick={()=>{setShowCreate(false);setError("");}}
                  style={{ padding:"9px 22px", border:"1px solid #dee2e6", background:"white",
                    borderRadius:"8px", cursor:"pointer", fontWeight:"600", fontSize:"13px" }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting||Object.keys(selectedYears).length===0||totalGrantDays<=0||(allYearsData&&!allYearsData.eligible)}
                  style={{ padding:"9px 22px", background:"#1565c0", color:"white", border:"none",
                    borderRadius:"8px", cursor:"pointer", fontWeight:"700", fontSize:"13px",
                    display:"flex", alignItems:"center", gap:"8px",
                    opacity:submitting||Object.keys(selectedYears).length===0||totalGrantDays<=0||(allYearsData&&!allYearsData.eligible)?0.5:1 }}>
                  {submitting ? "Submitting…" : `SUBMIT REQUEST (${Object.keys(selectedYears).length} year${Object.keys(selectedYears).length!==1?"s":""}, ${totalGrantDays} days)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmergencyLeaveAdmin;