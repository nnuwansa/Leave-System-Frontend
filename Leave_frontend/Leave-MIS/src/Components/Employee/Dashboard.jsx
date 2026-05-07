import React, { useState, useEffect } from "react";
import { Award, AlertCircle, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import Navbar from "../Navbar/Navbar";
import EmployeeSidebar from "../Navbar/EmployeeSidebar";
import "../CSS/EmployeeDashboard.css";
import EmployeeDashboard from "./EmployeeDashboard";
import API from "../../utils/apiUtils";

// ── Leave Entitlement Card ────────────────────────────────────────────────────
const LeaveEntitlementCard = ({ entitlement, summaryMeta, onRefresh, isMobile }) => {
  const getLeaveTypeColor = (type) => {
    const colors = {
      CASUAL:   { bg:"#ffffff", accent:"#21c269", text:"#333333", lightBg:"rgba(8,189,90,0.862)",  shadow:"0 8px 12px rgba(0,0,0,0.1)", border:"rgba(79,172,254,0.2)" },
      SICK:     { bg:"#ffffff", accent:"#2e7abd", text:"#333333", lightBg:"rgb(37,110,174)",        shadow:"0 8px 12px rgba(0,0,0,0.1)", border:"rgba(229,101,243,0.2)" },
      DUTY:     { bg:"#ffffff", accent:"#1ae3a4", text:"#333333", lightBg:"#1ae3a4",               shadow:"0 8px 12px rgba(0,0,0,0.1)", border:"rgba(229,101,243,0.2)" },
      MATERNITY:{ bg:"#ffffff", accent:"#95900f", text:"#333333", lightBg:"#95912285",             shadow:"0 8px 12px rgba(0,0,0,0.1)", border:"rgba(250,242,17,0.418)"},
    };
    return colors[type] || colors.CASUAL;
  };

  const getLeaveTypeDisplayName = (t) => ({
    CASUAL:"CASUAL LEAVE", SICK:"VACATION LEAVE", DUTY:"DUTY LEAVE",
    MATERNITY:"MATERNITY LEAVE", SHORT:"SHORT LEAVE", HALF_DAY:"HALF DAY LEAVE",
  })[t] || t.replace("_"," ");

  const colors = getLeaveTypeColor(entitlement.leaveType);
  const isUnlimited = entitlement.totalEntitlement === -1 || entitlement.isUnlimited;
  const effectiveUsedDays = entitlement.effectiveUsedDays || entitlement.usedDays || 0;
  const effectiveRemainingDays = isUnlimited ? "Unlimited" : (entitlement.effectiveRemainingDays ?? entitlement.remainingDays ?? 0);
  const hasHalfDays = entitlement.hasHalfDays || false;
  const accumulatedHalfDays = entitlement.accumulatedHalfDays || 0;
  const usagePercentage = isUnlimited ? 0 : entitlement.totalEntitlement > 0 ? (effectiveUsedDays / entitlement.totalEntitlement) * 100 : 0;

  const isVacation = entitlement.leaveType === "SICK";
  const carryOver = isVacation && summaryMeta ? summaryMeta.vacationCarryOver || 0 : 0;
  const carryOverFromDB = isVacation ? entitlement.carryOverDays || 0 : 0;
  const effectiveCarryOver = carryOver > 0 ? carryOver : carryOverFromDB;
  const showBreakdown = isVacation && effectiveCarryOver > 0;

  const getUsedDaysText = () => {
    if (isUnlimited) return `${effectiveUsedDays} Used`;
    return hasHalfDays && accumulatedHalfDays > 0
      ? `${effectiveUsedDays} Used (${entitlement.usedDays}d + ${accumulatedHalfDays}×½) • ${entitlement.totalEntitlement} Total`
      : `${effectiveUsedDays} Used • ${entitlement.totalEntitlement} Total`;
  };

  const cardHeight = isMobile ? "140px" : "190px";

  return (
    <div className="d-flex flex-column p-3 rounded-4 position-relative overflow-hidden leave-card"
      style={{ background:colors.bg, color:colors.text, boxShadow:colors.shadow,
        border:`1px solid ${colors.border}`, marginBottom:isMobile?"12px":"16px",
        cursor:"pointer", height:cardHeight }}
      onMouseEnter={e=>{ if(!isMobile){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`${colors.shadow}, 0 12px 24px rgba(0,0,0,0.15)`; }}}
      onMouseLeave={e=>{ if(!isMobile){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=colors.shadow; }}}>
      <div className="d-flex align-items-start justify-content-between mb-1">
        <div className="flex-grow-1 me-2" style={{ minWidth:0 }}>
          <h6 className="fw-semibold mb-1" style={{ fontSize:isMobile?"0.78rem":"0.82rem", letterSpacing:"0.3px", color:colors.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {getLeaveTypeDisplayName(entitlement.leaveType)}
          </h6>
          <small style={{ fontSize:isMobile?"0.72rem":"0.75rem", opacity:0.85, color:colors.text, fontWeight:"500", display:"block", marginBottom:"5px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {getUsedDaysText()}
          </small>
          {hasHalfDays && accumulatedHalfDays > 0 && (
            <small style={{ fontSize:"0.68rem", opacity:0.85, color:colors.accent, fontStyle:"italic", display:"block", marginBottom:"4px" }}>
              +{accumulatedHalfDays} half day{accumulatedHalfDays>1?"s":""} pending
            </small>
          )}
          {!isUnlimited && (
            <span className="px-2 py-1 rounded-pill d-inline-block" style={{ fontSize:"0.58rem",
              background:usagePercentage>80?"rgba(220,38,38,0.1)":`${colors.accent}20`,
              color:usagePercentage>80?"#dc2626":colors.accent, fontWeight:"600",
              textTransform:"uppercase", letterSpacing:"0.3px",
              border:usagePercentage>80?"1px solid rgba(220,38,38,0.2)":`1px solid ${colors.accent}30` }}>
              {usagePercentage.toFixed(1)}% used
            </span>
          )}
        </div>
        <div className="d-flex flex-column align-items-center flex-shrink-0">
          <div className="d-flex align-items-center justify-content-center fw-bold text-white rounded-circle mb-1"
            style={{ width:isMobile?"46px":"54px", height:isMobile?"46px":"54px",
              backgroundColor:colors.lightBg,
              fontSize:isUnlimited?"0.75rem":typeof effectiveRemainingDays==="number"&&effectiveRemainingDays>=100?"0.95rem":"1.1rem",
              boxShadow:`0 4px 12px ${colors.accent}40` }}>
            {isUnlimited?"∞":effectiveRemainingDays}
          </div>
          <small className="text-center" style={{ fontSize:"0.56rem", opacity:0.7, fontWeight:"600", color:colors.text, textTransform:"uppercase", letterSpacing:"0.3px", lineHeight:"1.2" }}>
            {isUnlimited?"As Required":effectiveRemainingDays===1?"Day Left":"Days Left"}
          </small>
        </div>
      </div>
      {showBreakdown && (
        <div className="mt-auto pt-1" style={{ borderTop:`1px dashed ${colors.accent}30` }}>
          <div style={{ fontSize:"0.58rem", fontWeight:"700", color:colors.accent, textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:"4px" }}>Entitlement Breakdown</div>
          <div className="d-flex gap-1 flex-wrap">
            <span style={{ fontSize:"0.6rem", fontWeight:"600", background:`${colors.accent}15`, color:colors.accent, padding:"1px 7px", borderRadius:"20px", border:`1px solid ${colors.accent}30`, whiteSpace:"nowrap" }}>
              From {new Date().getFullYear()} : 24
            </span>
            <span style={{ fontSize:"0.6rem", fontWeight:"600", background:"rgba(245,158,11,0.12)", color:"#d97706", padding:"1px 7px", borderRadius:"20px", border:"1px solid rgba(245,158,11,0.3)", whiteSpace:"nowrap" }}>
              + From Previous Year: {effectiveCarryOver%1===0?effectiveCarryOver:effectiveCarryOver.toFixed(1)}
            </span>
            <span style={{ fontSize:"0.6rem", fontWeight:"700", background:"rgba(16,185,129,0.12)", color:"#059669", padding:"1px 7px", borderRadius:"20px", border:"1px solid rgba(16,185,129,0.3)", whiteSpace:"nowrap" }}>
              = Total: {entitlement.totalEntitlement}
            </span>
          </div>
        </div>
      )}
      {!isUnlimited && (
        <div className="position-absolute bottom-0 start-0" style={{ width:"100%", height:"4px", background:"rgba(0,0,0,0.05)" }}>
          <div style={{ width:`${Math.min(usagePercentage,100)}%`, height:"100%",
            background:usagePercentage>80?"linear-gradient(90deg,#dc2626,#ef4444)":`linear-gradient(90deg,${colors.accent},${colors.accent}cc)`,
            transition:"width 0.8s ease" }} />
        </div>
      )}
      {isUnlimited && (
        <div className="position-absolute bottom-0 start-0" style={{ width:"100%", height:"4px",
          background:`linear-gradient(90deg,${colors.accent},${colors.accent}cc,${colors.accent})`, opacity:0.6 }} />
      )}
    </div>
  );
};

// ── Short Leave Card ──────────────────────────────────────────────────────────
const ShortLeaveEntitlementCard = ({ shortLeaveEntitlement, onRefresh, isMobile }) => {
  const colors = { bg:"#ffffff", accent:"#1b90b7", text:"#333333", lightBg:"#1b90b7", shadow:"0 8px 12px rgba(0,0,0,0.1)", border:"#288d6d63" };
  const usedShortLeaves      = shortLeaveEntitlement.usedShortLeaves  || 0;
  const totalShortLeaves     = shortLeaveEntitlement.totalShortLeaves || 2;
  const remainingShortLeaves = shortLeaveEntitlement.remainingShortLeaves ?? totalShortLeaves - usedShortLeaves;
  const month                = shortLeaveEntitlement.month || new Date().getMonth()+1;
  const year                 = shortLeaveEntitlement.year  || new Date().getFullYear();
  const usagePercentage      = totalShortLeaves > 0 ? (usedShortLeaves/totalShortLeaves)*100 : 0;
  const getMonthName = (m) => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]||"Unknown";

  return (
    <div className="d-flex flex-column p-3 rounded-4 position-relative overflow-hidden leave-card"
      style={{ background:colors.bg, color:colors.text, boxShadow:colors.shadow,
        border:`1px solid ${colors.border}`, marginBottom:isMobile?"12px":"16px",
        cursor:"pointer", height:isMobile?"140px":"190px" }}
      onMouseEnter={e=>{ if(!isMobile){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`${colors.shadow}, 0 12px 24px rgba(0,0,0,0.15)`; }}}
      onMouseLeave={e=>{ if(!isMobile){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=colors.shadow; }}}>
      <div className="d-flex align-items-start justify-content-between">
        <div className="flex-grow-1 me-2">
          <h6 className="fw-semibold mb-1" style={{ fontSize:isMobile?"0.85rem":"clamp(0.8rem,2.5vw,0.9rem)", letterSpacing:"0.3px", color:colors.text }}>SHORT LEAVE</h6>
          <small style={{ fontSize:isMobile?"0.8rem":"0.9rem", opacity:0.9, color:colors.text, fontWeight:"500", display:"block", marginBottom:"6px" }}>
            {usedShortLeaves} Used • {totalShortLeaves} Total
          </small>
          <span className="px-2 py-1 rounded-pill d-inline-block mb-2" style={{ fontSize:"0.6rem",
            background:usagePercentage>80?"rgba(220,38,38,0.1)":`${colors.accent}20`,
            color:usagePercentage>80?"#dc2626":colors.accent, fontWeight:"600", textTransform:"uppercase",
            border:usagePercentage>80?"1px solid rgba(220,38,38,0.2)":`1px solid ${colors.accent}30` }}>
            {usagePercentage.toFixed(1)}% used
          </span>
          <div>
            <small style={{ fontSize:isMobile?"1.1rem":"clamp(1.1rem,2.5vw,1.4rem)", opacity:0.9, color:colors.accent, fontWeight:"bold", fontStyle:"italic" }}>
              {getMonthName(month)} {year}
            </small>
          </div>
        </div>
        <div className="d-flex flex-column align-items-center">
          <div className="d-flex align-items-center justify-content-center fw-bold text-white rounded-circle mb-1"
            style={{ width:isMobile?"50px":"clamp(50px,8vw,62px)", height:isMobile?"50px":"clamp(50px,8vw,62px)",
              backgroundColor:colors.lightBg, fontSize:remainingShortLeaves>=10?"1rem":"1.2rem",
              boxShadow:`0 4px 12px ${colors.accent}40`, flexShrink:0 }}>
            {remainingShortLeaves}
          </div>
          <small className="text-center" style={{ fontSize:"0.6rem", opacity:0.7, fontWeight:"600", color:colors.text, textTransform:"uppercase", letterSpacing:"0.3px" }}>
            {remainingShortLeaves===1?"Leave Left":"Leaves Left"}
          </small>
        </div>
      </div>
      <div className="position-absolute bottom-0 start-0" style={{ width:"100%", height:"4px", background:"rgba(0,0,0,0.05)" }}>
        <div style={{ width:`${Math.min(usagePercentage,100)}%`, height:"100%",
          background:usagePercentage>80?"linear-gradient(90deg,#dc2626,#ef4444)":`linear-gradient(90deg,${colors.accent},${colors.accent}cc)`,
          transition:"width 0.8s ease" }} />
      </div>
    </div>
  );
};

// ── Emergency Leave History Section ──────────────────────────────────────────
const EmergencyLeaveHistory = ({ isMobile }) => {
  const [requests, setRequests]   = useState([]);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    API.get("/emergency-leave/my")
      .then(data => setRequests(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!requests.length) return null;

  const getStatusStyle = (status) => {
    if (status === "APPROVED")        return { bg:"#e8f5e9", color:"#2e7d32", icon:<CheckCircle size={13} />, label:"APPROVED" };
    if (status === "REJECTED")        return { bg:"#fce4ec", color:"#c62828", icon:<XCircle    size={13} />, label:"REJECTED" };
    if (status === "PENDING_APPROVAL")return { bg:"#e3f2fd", color:"#1565c0", icon:<Clock       size={13} />, label:"PENDING"  };
    return                                   { bg:"#f5f5f5", color:"#555",    icon:<Clock       size={13} />, label:status     };
  };

  return (
    <div className="glass-card rounded-4 mt-3">
      <div className={`p-${isMobile?"3":"4"}`}>
        {/* Header */}
        <div className="d-flex align-items-center mb-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center me-2"
            style={{ width:"32px", height:"32px", background:"linear-gradient(135deg,#1565c0,#1976d2)" }}>
            <span style={{ fontSize:"14px" }}>🔵</span>
          </div>
          <div>
            <h6 className="mb-0 fw-bold text-dark" style={{ fontSize:isMobile?"0.9rem":"0.95rem" }}>
              EMERGENCY LEAVE REQUESTS
            </h6>
            <small className="text-muted" style={{ fontSize:"0.72rem" }}>
              Previous year vacation credit grants
            </small>
          </div>
        </div>

        {/* Cards */}
        <div className="d-flex flex-column gap-2">
          {requests.map(req => {
            const st = getStatusStyle(req.status);
            const date = req.createdAt ? new Date(req.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—";

            return (
              <div key={req.id} style={{ background:"white", borderRadius:"10px",
                border:"1px solid #e3f2fd", boxShadow:"0 1px 6px rgba(21,101,192,0.08)",
                overflow:"hidden" }}>
                {/* Blue accent top bar */}
                <div style={{ height:"3px", background:"linear-gradient(90deg,#1565c0,#42a5f5)" }} />

                <div className={`p-${isMobile?"2":"3"}`}>
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">

                    {/* Left: status + days */}
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {/* Status badge */}
                      <span className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-semibold"
                        style={{ fontSize:"0.65rem", background:st.bg, color:st.color,
                          border:`1px solid ${st.color}30` }}>
                        {st.icon} {st.label}
                      </span>

                      {/* Days granted */}
                      <span style={{ fontSize:isMobile?"0.8rem":"0.85rem", fontWeight:"800", color:"#1565c0" }}>
                        +{req.totalDaysToGrant} days
                      </span>

                      {/* Reason */}
                      {req.reason && (
                        <span style={{ fontSize:"0.72rem", color:"#666", maxWidth:"180px",
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            Reason:  {req.reason}
                        </span>
                      )}
                    </div>

                    {/* Right: date */}
                    <small style={{ fontSize:"0.68rem", color:"#999", whiteSpace:"nowrap" }}>
                      {date}
                    </small>
                  </div>

                  {/* Year grants table */}
                  {req.yearGrants && req.yearGrants.length > 0 && (
                    <div className="mt-2" style={{ background:"#f8fbff", borderRadius:"6px",
                      border:"1px solid #e3f2fd", overflow:"hidden" }}>
                      {/* Table header */}
                      <div style={{ display:"grid", gridTemplateColumns:"70px 1fr 1fr",
                        padding:"4px 10px", background:"#1565c0", fontSize:"10px",
                        fontWeight:"700", color:"white" }}>
                        <span>Year</span>
                        <span style={{ textAlign:"center" }}>Prev. Remaining</span>
                        <span style={{ textAlign:"center" }}>Granted</span>
                      </div>
                      {req.yearGrants.map((yg, i) => (
                        <div key={yg.previousYear} style={{ display:"grid",
                          gridTemplateColumns:"70px 1fr 1fr",
                          padding:"4px 10px", fontSize:"11px",
                          background:i%2===0?"white":"#f8fbff",
                          borderBottom:i<req.yearGrants.length-1?"1px solid #e3f2fd":"none" }}>
                          <span style={{ fontWeight:"700", color:"#1565c0" }}>{yg.previousYear}</span>
                          <span style={{ textAlign:"center", color:"#555" }}>
                            {yg.previousYearRemainingDays >= 0 ? `${yg.previousYearRemainingDays}d` : "—"}
                          </span>
                          <span style={{ textAlign:"center", color:"#2e7d32", fontWeight:"700" }}>
                            +{yg.daysToGrant}d
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Admin + Approval Officer info */}
                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {req.requestedByAdminName && (
                      <span style={{ fontSize:"0.68rem", color:"#555", background:"#f0f4ff",
                        padding:"2px 8px", borderRadius:"4px", border:"1px solid #c5cae9",
                        display:"flex", alignItems:"center", gap:"4px" }}>
                        🏢 <strong>Requested by:</strong> {req.requestedByAdminName}
                      </span>
                    )}
                    {req.approvalOfficerName && (
                      <span style={{ fontSize:"0.68rem",
                        color: req.status==="APPROVED" ? "#2e7d32" : req.status==="REJECTED" ? "#c62828" : "#1565c0",
                        background: req.status==="APPROVED" ? "#e8f5e9" : req.status==="REJECTED" ? "#fce4ec" : "#e3f2fd",
                        padding:"2px 8px", borderRadius:"4px",
                        border:`1px solid ${req.status==="APPROVED"?"#a5d6a7":req.status==="REJECTED"?"#ef9a9a":"#90caf9"}`,
                        display:"flex", alignItems:"center", gap:"4px" }}>
                        {req.status==="APPROVED" ? "✅" : req.status==="REJECTED" ? "❌" : "⏳"}
                        <strong>{req.status==="APPROVED"?"Approved by":req.status==="REJECTED"?"Rejected by":"Pending:"}</strong> {req.approvalOfficerName}
                      </span>
                    )}
                  </div>

                  {/* Officer comment */}
                  {req.approvalOfficerComments && req.status !== "PENDING_APPROVAL" && (
                    <div className="mt-1" style={{ fontSize:"0.68rem", color:"#666",
                      fontStyle:"italic", padding:"4px 8px", background:"#f9f9f9",
                      borderRadius:"4px", borderLeft:"2px solid #90caf9" }}>
                      Note: "{req.approvalOfficerComments}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard Component ──────────────────────────────────────────────────
const Dashboard = () => {
  let email, token;
  try { email=localStorage?.getItem("email")||"demo@example.com"; token=localStorage?.getItem("token")||"demo-token"; }
  catch(e) { email="demo@example.com"; token="demo-token"; }

  const [leaveEntitlements,      setLeaveEntitlements]      = useState([]);
  const [shortLeaveEntitlements, setShortLeaveEntitlements] = useState([]);
  const [summaryMeta,            setSummaryMeta]            = useState(null);
  const [loading,                setLoading]                = useState(false);
  const [lastRefresh,            setLastRefresh]            = useState(null);
  const [sidebarOpen,            setSidebarOpen]            = useState(false);
  const [isMobile,               setIsMobile]               = useState(window.innerWidth < 992);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const filterAndOrderEntitlements = (ents) => {
    const required = ["CASUAL","SICK","DUTY"];
    return required.map(t => ents.find(e => e.leaveType===t)).filter(Boolean);
  };

  const fetchLeaveEntitlements = async () => {
    try {
      const [entitlementsRaw, summary] = await Promise.all([
        API.get("/entitlements/my-entitlements"),
        API.get("/entitlements/summary").catch(()=>null),
      ]);
      if (summary) {
        setSummaryMeta({
          vacationCarryOver:       summary.vacationCarryOver       || 0,
          vacationBaseEntitlement: summary.vacationBaseEntitlement || 24,
          vacationTotalEntitlement:summary.vacationTotalEntitlement|| 24,
        });
      }
      const arr = Array.isArray(entitlementsRaw) ? entitlementsRaw : [];
      const processed = arr.map(ent => {
        const isUnlimited = ent.totalEntitlement === -1;
        const halfDays    = ent.accumulatedHalfDays || 0;
        const effectiveUsedDays      = ent.usedDays + halfDays * 0.5;
        const effectiveRemainingDays = isUnlimited ? "Unlimited" : ent.totalEntitlement - effectiveUsedDays;
        return { ...ent, isUnlimited, effectiveUsedDays, effectiveRemainingDays, hasHalfDays:halfDays>0 };
      });
      setLeaveEntitlements(filterAndOrderEntitlements(processed));
    } catch(err) {
      console.error("Failed to fetch leave entitlements:", err);
      setLeaveEntitlements([]);
    }
  };

  const fetchShortLeaveEntitlements = async () => {
    try {
      const data = await API.get("/leaves/my-short-leave-entitlements");
      const cm = new Date().getMonth()+1;
      const cy = new Date().getFullYear();
      setShortLeaveEntitlements(Array.isArray(data) ? data.filter(i=>i.month===cm&&i.year===cy) : []);
    } catch { setShortLeaveEntitlements([]); }
  };

  const refreshAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchLeaveEntitlements(), fetchShortLeaveEntitlements()]);
      setLastRefresh(new Date());
    } catch(e) { console.error("Error refreshing:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!token||!email) return;
    refreshAllData();
    const onStorage = e => { if(e.key==="leaveDataUpdated") refreshAllData(); };
    const onCustom  = () => refreshAllData();
    window.addEventListener("storage", onStorage);
    window.addEventListener("refreshLeaveData", onCustom);
    return () => { window.removeEventListener("storage",onStorage); window.removeEventListener("refreshLeaveData",onCustom); };
  }, [token, email]);

  useEffect(() => {
    window.refreshDashboardData = refreshAllData;
    return () => { delete window.refreshDashboardData; };
  }, []);

  if (!token||!email) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-warning d-flex align-items-center shadow-lg border-0 rounded-4">
              <AlertCircle size={20} className="me-3 text-warning" />
              <div><h6 className="mb-1 fw-semibold">Authentication Required</h6><p className="mb-0">Please log in to access the employee dashboard.</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#88b3df 0%,#b5cce7 50%,#75e3c0 100%)",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif" }}>

      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:1030 }}>
        <Navbar setSidebarOpen={setSidebarOpen} />
      </div>
      <div className="d-none d-lg-block position-fixed" style={{ top:"60px", left:0, bottom:0, width:"280px", zIndex:1020 }}>
        <EmployeeSidebar sidebarOpen={true} setSidebarOpen={setSidebarOpen} />
      </div>
      {sidebarOpen && isMobile && (
        <>
          <div className="position-fixed w-100 h-100 bg-dark bg-opacity-50 d-lg-none" style={{ zIndex:1040, top:"60px" }} onClick={()=>setSidebarOpen(false)} />
          <div className="position-fixed d-lg-none" style={{ top:"60px", left:sidebarOpen?0:"-280px", bottom:0, width:"280px", zIndex:1050, transition:"left 0.3s ease" }}>
            <EmployeeSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          </div>
        </>
      )}

      <div style={{ marginLeft:isMobile?"0":"280px", marginTop:"60px", minHeight:"calc(100vh - 60px)" }}>
        <div style={{ position:"relative", zIndex:1 }}><EmployeeDashboard /></div>

        <div className={`container-fluid ${isMobile?"px-3":"px-4"} py-4`}>

          {/* ── Entitlements Card ── */}
          <div className="glass-card rounded-4">
            <div className={`p-${isMobile?"3":"4"}`}>
              <div className={`d-flex ${isMobile?"flex-column":"flex-column flex-sm-row"} align-items-start align-items-sm-center justify-content-between mb-4`}>
                <div className={`d-flex align-items-center ${isMobile?"mb-3":"mb-2 mb-sm-0"}`}>
                  <Award size={isMobile?20:24} className="text-success me-2" />
                  <h5 className="mb-0 fw-bold text-dark" style={{ fontSize:isMobile?"1.1rem":"clamp(1.1rem,2.5vw,1.3rem)" }}>
                    LEAVE SUMMARY
                  </h5>
                </div>
                <div className={`d-flex ${isMobile?"flex-column gap-2":"align-items-center gap-3"}`}>
                  {lastRefresh && <small className="text-muted" style={{ fontSize:isMobile?"0.75rem":"0.875rem" }}>Last updated: {lastRefresh.toLocaleTimeString()}</small>}
                  <button onClick={refreshAllData} disabled={loading}
                    className="btn btn-outline-primary btn-sm rounded-3 d-flex align-items-center justify-content-center"
                    style={{ minWidth:isMobile?"120px":"auto" }}>
                    <RefreshCw size={14} className={`me-1 ${loading?"spin":""}`} />
                    {loading?"Updating...":"Refresh"}
                  </button>
                  <span className="fw-semibold text-success" style={{ fontSize:isMobile?"1.2rem":"clamp(1.2rem,4vw,1.5rem)" }}>
                    {new Date().getFullYear()}
                  </span>
                </div>
              </div>

              {loading && (
                <div className="d-flex align-items-center justify-content-center py-3 mb-4">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                  <span className="text-muted" style={{ fontSize:isMobile?"0.85rem":"1rem" }}>Updating leave entitlements...</span>
                </div>
              )}

              <div className={`row ${isMobile?"g-2":"g-3"}`}>
                {shortLeaveEntitlements.map((sl,i) => (
                  <div key={`short-${sl.month}-${sl.year}-${i}`} className={isMobile?"col-12":"col-12 col-sm-6 col-lg-4 col-xl-3"}>
                    <ShortLeaveEntitlementCard shortLeaveEntitlement={sl} onRefresh={refreshAllData} isMobile={isMobile} />
                  </div>
                ))}
                {leaveEntitlements.map((ent,i) => (
                  <div key={`${ent.leaveType}-${ent.year||new Date().getFullYear()}-${i}`} className={isMobile?"col-12":"col-12 col-sm-6 col-lg-4 col-xl-3"}>
                    <LeaveEntitlementCard entitlement={ent} summaryMeta={summaryMeta} onRefresh={refreshAllData} isMobile={isMobile} />
                  </div>
                ))}
              </div>

              {!loading && leaveEntitlements.length===0 && shortLeaveEntitlements.length===0 && (
                <div className="text-center py-5">
                  <AlertCircle size={isMobile?36:48} className="text-muted mb-3" />
                  <h6 className="text-muted" style={{ fontSize:isMobile?"1rem":"1.2rem" }}>No entitlements found</h6>
                  <p className="text-muted small" style={{ maxWidth:"300px", margin:"0 auto" }}>Your leave entitlements will appear here once they are set up.</p>
                  <button onClick={refreshAllData} className="btn btn-outline-primary btn-sm mt-3" disabled={loading}>
                    <RefreshCw size={14} className="me-1" /> Try Refresh
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Emergency Leave History — below entitlement cards ── */}
          <EmergencyLeaveHistory isMobile={isMobile} />

        </div>
      </div>

      <style jsx>{`
        .glass-card { background:#bccee4f2; backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.2); box-shadow:0 8px 32px rgba(0,0,0,0.1); }
        .leave-card { transition:all 0.3s cubic-bezier(0.4,0,0.2,1); }
        @media (min-width:992px) { .leave-card:hover { transform:translateY(-2px); } }
        .spin { animation:spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (max-width:991.98px) { .leave-card { margin-bottom:0.75rem; min-height:120px!important; } .btn-sm { padding:0.375rem 0.75rem; font-size:0.875rem; } }
        @media (max-width:576px) { .container-fluid { padding-left:0.75rem!important; padding-right:0.75rem!important; } .glass-card { border-radius:1rem!important; } .leave-card { padding:0.75rem!important; min-height:110px!important; } }
        @media (prefers-reduced-motion:reduce) { .leave-card,.spin,* { animation:none!important; transition:none!important; } }
      `}</style>
    </div>
  );
};

export default Dashboard;