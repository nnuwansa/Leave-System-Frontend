import React, { useState, useEffect } from "react";
import {
  CheckCircle, XCircle, Clock, Calendar, User, FileText, MessageSquare,
  Settings, Shield, Inbox, UserCog, UserCheck, AlertCircle, ArrowRight,
  Check, X, Ban, Users, ChevronLeft, ChevronRight, RotateCcw,
} from "lucide-react";
import Navbar from "../Navbar/Navbar";
import EmployeeSidebar from "../Navbar/EmployeeSidebar";
import "../CSS/EmployeeDashboard.css";
import EmployeeDashboard from "./EmployeeDashboard";
import API from "../../utils/apiUtils";

const ApprovalFlow = ({ leave, employeeDetails, isCompact = false, isMobile = false }) => {
  const getTitle = (gender, maritalStatus) => {
    if (!gender) return "";
    const g = gender.toString().toUpperCase();
    if (g === "MALE") return "Mr.";
    if (g === "FEMALE") return maritalStatus?.toString().toUpperCase() === "MARRIED" ? "Mrs." : "Miss.";
    return "";
  };
  const formatOfficerName = (name) => {
    if (!name) return "Not Selected";
    const d = employeeDetails[name];
    if (d?.gender) { const t = getTitle(d.gender, d.maritalStatus); return t ? `${t} ${name}` : name; }
    return name;
  };
  const fmtDT = (dt) => {
    if (!dt) return null;
    const d = new Date(dt);
    return { date: d.toLocaleDateString(), time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
  };
  const sIcon = (status, approved, approvedAt, cancelled, hasOfficer) => {
    const sz = isMobile ? 10 : 12;
    if (!hasOfficer)            return <Ban   size={sz} className="text-muted"    />;
    if (cancelled)              return <Ban   size={sz} className="text-secondary"/>;
    if (approved && approvedAt) return <Check size={sz} className="text-success"  />;
    if (status === "REJECTED")  return <X     size={sz} className="text-danger"   />;
    if (status === "PENDING")   return <Clock size={sz} className="text-primary"  />;
    return <Clock size={sz} className="text-muted" />;
  };
  const sColor = (status, approved, approvedAt, cancelled, hasOfficer) => {
    if (!hasOfficer)            return "text-muted";
    if (cancelled)              return "text-secondary";
    if (approved && approvedAt) return "text-success";
    if (status === "REJECTED")  return "text-danger";
    if (status === "PENDING")   return "text-primary";
    return "text-muted";
  };
  const hasA  = leave.actingOfficerEmail      && leave.actingOfficerEmail      !== "NONE" && leave.actingOfficerName;
  const hasS  = leave.supervisingOfficerEmail && leave.supervisingOfficerEmail !== "NONE" && leave.supervisingOfficerName;
  const hasAp = leave.approvalOfficerEmail    && leave.approvalOfficerEmail    !== "NONE" && leave.approvalOfficerName;
  const isCancelled = leave.isCancelled || leave.status?.includes("CANCELLED");
  const officers = [
    { type:"acting",      icon:User,      title:isMobile?"Acting":"Acting Officer",
      name:hasA  ? formatOfficerName(leave.actingOfficerName)     : "Not Assigned",
      status:hasA  ? leave.actingOfficerStatus                    : "NOT_ASSIGNED",
      approved:hasA  && leave.actingOfficerStatus  === "APPROVED",
      approvedAt:hasA  ? leave.actingOfficerApprovedAt            : null,
      dateTime:hasA  ? fmtDT(leave.actingOfficerApprovedAt)       : null, hasOfficer:hasA },
    { type:"supervising", icon:UserCog,   title:isMobile?"Supervising":"Supervising Officer",
      name:hasS  ? formatOfficerName(leave.supervisingOfficerName) : "Not Assigned",
      status:hasS  ? leave.supervisingOfficerStatus                : "NOT_ASSIGNED",
      approved:hasS  && leave.supervisingOfficerStatus === "APPROVED",
      approvedAt:hasS  ? leave.supervisingOfficerApprovedAt        : null,
      dateTime:hasS  ? fmtDT(leave.supervisingOfficerApprovedAt)   : null, hasOfficer:hasS },
    { type:"approval",    icon:UserCheck, title:isMobile?"Approval":"Approval Officer",
      name:hasAp ? formatOfficerName(leave.approvalOfficerName)   : "Not Assigned",
      status:hasAp ? leave.approvalOfficerStatus                  : "NOT_ASSIGNED",
      approved:hasAp && leave.approvalOfficerStatus === "APPROVED",
      approvedAt:hasAp ? leave.approvalOfficerApprovedAt          : null,
      dateTime:hasAp ? fmtDT(leave.approvalOfficerApprovedAt)     : null, hasOfficer:hasAp },
  ];
  const cW = isMobile ? "70px" : isCompact ? "70px" : "120px";
  const cH = isMobile ? "50px" : isCompact ? "60px" : "80px";
  const fs = isMobile ? "0.7rem" : isCompact ? "0.70rem" : "0.75rem";
  return (
    <div className="approval-flow-horizontal d-flex align-items-start justify-content-center">
      {officers.map((o, idx) => {
        const Icon = o.icon;
        return (
          <React.Fragment key={o.type}>
            <div className="officer-container text-center" style={{ width:cW, minHeight:cH }}>
              <div className="d-flex align-items-center justify-content-center mb-1" style={{ minHeight:isMobile?"14px":"20px" }}>
                <div className="me-1">{sIcon(o.status,o.approved,o.approvedAt,isCancelled,o.hasOfficer)}</div>
                <Icon size={isMobile?8:10} className="me-1" />
              </div>
              <div className="mb-1">
                <div className="small text-muted" style={{ fontSize:isMobile?"0.5rem":fs, lineHeight:"1" }}>{o.title}</div>
              </div>
              <div className={`fw-semibold text-center ${sColor(o.status,o.approved,o.approvedAt,isCancelled,o.hasOfficer)}`}
                style={{ fontSize:fs, lineHeight:"1.1", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"100%" }}
                title={o.name}>
                {o.name.length > 15 ? o.name.substring(0,15)+"..." : o.name}
              </div>
              <div className="text-center mt-1" style={{ minHeight:isMobile?"10px":"15px" }}>
                {!o.hasOfficer ? (
                  <div className="small text-muted" style={{ fontSize:"0.5rem" }}>N/A</div>
                ) : isCancelled ? (
                  <div className="small text-secondary" style={{ fontSize:"0.5rem" }}>Cancelled</div>
                ) : (
                  <>
                    {o.dateTime && !isMobile && <div className="small text-success" style={{ fontSize:"0.5rem" }}>{o.dateTime.date}</div>}
                    {o.status === "REJECTED" && <div className="small text-danger"  style={{ fontSize:"0.5rem" }}>Rejected</div>}
                    {o.status === "PENDING" && !o.approved && <div className="small text-primary" style={{ fontSize:"0.5rem" }}>Pending</div>}
                  </>
                )}
              </div>
            </div>
            {idx < officers.length - 1 && (
              <div className="d-flex align-items-center justify-content-center mx-1" style={{ minHeight:isMobile?"30px":"40px" }}>
                <ArrowRight size={isMobile?8:10} className={isCancelled?"text-secondary":o.approved?"text-success":"text-muted"} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const MobileApprovalCard = ({ leave, employeeDetails, onApprove, onReject, loading, formatEmployeeName, getLeaveTypeDisplayName, calculateDuration, getRoleIcon, getRoleColor }) => (
  <div className="card border-0 shadow-sm mb-3 approval-card-mobile">
    <div className="card-body p-3">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div className="flex-grow-1">
          <div className="fw-bold text-dark mb-1" style={{ fontSize:"0.9rem" }}>{formatEmployeeName(leave)}</div>
          <div className="small text-muted">{new Date(leave.receivedDate||leave.requestDate||leave.createdAt).toLocaleDateString()}</div>
        </div>
        <span className={`badge px-2 py-1 rounded-pill d-inline-flex align-items-center ${getRoleColor(leave.role)}`} style={{ fontSize:"0.7rem" }}>
          {getRoleIcon(leave.role)}<span style={{ fontSize:"0.7rem" }}>{leave.role}</span>
        </span>
      </div>
      <div className="mb-2">
        <span className="badge px-2 py-1 rounded-pill fw-semibold me-2" style={{ backgroundColor:"#e9ecef", color:"#495057", fontSize:"0.75rem" }}>
          {getLeaveTypeDisplayName(leave.leaveType)}
        </span>
      </div>
      <div className="mb-2">
        <div className="small text-muted mb-1">Duration:</div>
        <div className="fw-semibold text-dark small">
          {leave.leaveType==="MATERNITY" ? (<>{new Date(leave.startDate).toLocaleDateString()}<div className="small text-primary"><Clock size={12} className="me-1" />84 Days</div></>)
            : leave.leaveType==="HALF_DAY" ? `${new Date(leave.startDate).toLocaleDateString()} (${leave.halfDayPeriod||"MORNING"} period)`
            : leave.leaveType==="SHORT"||leave.leaveType==="SHORT_LEAVE" ? new Date(leave.startDate).toLocaleDateString()
            : `${new Date(leave.startDate).toLocaleDateString()} → ${new Date(leave.endDate).toLocaleDateString()}`}
        </div>
        <div className="small text-muted"><Clock size={12} className="me-1" />{calculateDuration(leave.leaveType,leave.startDate,leave.endDate,leave.shortLeaveStartTime,leave.shortLeaveEndTime,leave.halfDayPeriod,leave.halfDayStartTime, leave.halfDayEndTime  )}</div>
      </div>
      {leave.reason && <div className="mb-2"><div className="small text-muted mb-1"><MessageSquare size={10} className="me-1" />Reason:</div><div className="small text-dark">{leave.reason}</div></div>}
      <div className="mb-3"><div className="small text-muted mb-2">Approval Chain:</div><ApprovalFlow leave={leave} employeeDetails={employeeDetails} isCompact={true} isMobile={true} /></div>
      <div className="d-flex gap-2">
        <button className="btn btn-success flex-grow-1 d-flex align-items-center justify-content-center fw-semibold" style={{ fontSize:"0.8rem", height:"36px" }} onClick={()=>onApprove(leave)} disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm" /> : <><CheckCircle size={14} className="me-1" />APPROVE</>}
        </button>
        <button className="btn btn-danger flex-grow-1 d-flex align-items-center justify-content-center fw-semibold" style={{ fontSize:"0.8rem", height:"36px" }} onClick={()=>onReject(leave)} disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm" /> : <><XCircle size={14} className="me-1" />REJECT</>}
        </button>
      </div>
    </div>
  </div>
);

const MobileHistoryCard = ({ leave, employeeDetails, formatEmployeeName, getLeaveTypeDisplayName, calculateDuration, getRoleIcon, getRoleColor, onCancelRejectionAndAccept, cancelRejectionLoading }) => {
  const actionDate = new Date(leave.actionDate||leave.createdAt);
  const actionTaken = leave.actionTaken||(leave.status?.includes("APPROVED")?"APPROVED":leave.status?.includes("REJECTED")?"REJECTED":leave.status||"UNKNOWN");
  const canReverse =
    (leave.role==="Acting Officer"      && leave.status==="REJECTED_BY_ACTING_OFFICER")     ||
    (leave.role==="Supervising Officer" && leave.status==="REJECTED_BY_SUPERVISING_OFFICER")||
    (leave.role==="Approval Officer"    && leave.status==="REJECTED_BY_APPROVAL_OFFICER");
  return (
    <div className="card border-0 shadow-sm mb-3 history-card-mobile">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <div className="fw-bold text-dark mb-1" style={{ fontSize:"0.9rem" }}>{formatEmployeeName(leave)}</div>
            <div className="small text-muted">{actionDate.toLocaleDateString()} - {actionDate.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
          </div>
          <span className={`badge px-2 py-1 rounded-pill fw-semibold ${actionTaken==="APPROVED"?"bg-success text-white":actionTaken==="REJECTED"?"bg-danger text-white":"bg-secondary text-white"}`} style={{ fontSize:"0.7rem" }}>
            {actionTaken==="APPROVED"?<><CheckCircle size={12} className="me-1" />APPROVED</>:actionTaken==="REJECTED"?<><XCircle size={12} className="me-1" />REJECTED</>:actionTaken}
          </span>
        </div>
        <div className="mb-2 d-flex gap-2 flex-wrap">
          <span className="badge px-2 py-1 rounded-pill fw-semibold" style={{ backgroundColor:"#e9ecef", color:"#495057", fontSize:"0.75rem" }}>{getLeaveTypeDisplayName(leave.leaveType)}</span>
          <span className={`badge px-2 py-1 rounded-pill d-inline-flex align-items-center ${getRoleColor(leave.role)}`} style={{ fontSize:"0.7rem" }}>{getRoleIcon(leave.role)}<span style={{ fontSize:"0.7rem" }}>{leave.role}</span></span>
        </div>
        {leave.reason && <div className="mb-2"><div className="small text-muted mb-1"><MessageSquare size={10} className="me-1" />Reason:</div><div className="small text-dark">{leave.reason}</div></div>}
        <div><div className="small text-muted mb-2">Approval Chain:</div><ApprovalFlow leave={leave} employeeDetails={employeeDetails} isCompact={true} isMobile={true} /></div>
        {canReverse && (
          <div className="mt-3">
            <div className="alert alert-warning py-2 px-3 mb-2 d-flex align-items-center" style={{ fontSize:"0.75rem", borderRadius:"8px" }}>
              <AlertCircle size={14} className="me-2 flex-shrink-0 text-warning" />
              <span>Mistakenly rejected? You can reverse this decision.</span>
            </div>
            <button className="btn btn-warning w-100 d-flex align-items-center justify-content-center fw-semibold cancel-rejection-btn" style={{ fontSize:"0.8rem", height:"38px", borderRadius:"8px" }} onClick={()=>onCancelRejectionAndAccept(leave)} disabled={cancelRejectionLoading===leave.id}>
              {cancelRejectionLoading===leave.id ? <span className="spinner-border spinner-border-sm me-2" /> : <RotateCcw size={14} className="me-2" />}
              Cancel Rejection & Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Approvals = () => {
  const [loading,                setLoading]                = useState(false);
  const [error,                  setError]                  = useState("");
  const [success,                setSuccess]                = useState("");
  const [allPendingLeaves,       setAllPendingLeaves]       = useState([]);
  const [employeeDetails,        setEmployeeDetails]        = useState({});
  const [loadingEmployeeData,    setLoadingEmployeeData]    = useState(false);
  const [sidebarOpen,            setSidebarOpen]            = useState(false);
  const [isMobile,               setIsMobile]               = useState(window.innerWidth < 992);
  const [approvalHistory,        setApprovalHistory]        = useState([]);
  const [historyLoading,         setHistoryLoading]         = useState(false);
  const [currentPage,            setCurrentPage]            = useState(1);
  const [totalPages,             setTotalPages]             = useState(0);
  const [totalRecords,           setTotalRecords]           = useState(0);
  const [itemsPerPage,           setItemsPerPage]           = useState(10);
  const [cancelRejectionLoading, setCancelRejectionLoading] = useState(null);
  const [pendingEmergencyLeaves, setPendingEmergencyLeaves] = useState([]);
  const [emergencyActionModal,   setEmergencyActionModal]   = useState(null);
  const [emergencyActionLoading, setEmergencyActionLoading] = useState(null);
  const [emergencyComments,      setEmergencyComments]      = useState("");

  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const showMessage = (msg, isError=false) => {
    isError ? (setError(msg),setSuccess("")) : (setSuccess(msg),setError(""));
    setTimeout(()=>{setError("");setSuccess("");},5000);
  };

  const staticEmployeeData = {
    Nadini:{gender:"FEMALE",maritalStatus:"MARRIED"}, subashi:{gender:"MALE",maritalStatus:"SINGLE"},
    Nilushi:{gender:"FEMALE",maritalStatus:"MARRIED"}, John:{gender:"MALE",maritalStatus:"MARRIED"},
    Sarah:{gender:"FEMALE",maritalStatus:"SINGLE"},
  };

  const getTitle = (gender, maritalStatus) => {
    if (!gender) return "";
    if (gender.toUpperCase()==="MALE") return "Mr.";
    if (gender.toUpperCase()==="FEMALE") return maritalStatus?.toUpperCase()==="MARRIED"?"Mrs.":"Miss.";
    return "";
  };

  const formatEmployeeName = (leave) => {
    const name = leave.employeeName||leave.name||leave.empName||"Unknown Employee";
    let info = null;
    if (leave.employeeGender||leave.gender) info={gender:leave.employeeGender||leave.gender,maritalStatus:leave.employeeMaritalStatus||leave.maritalStatus};
    if (!info && employeeDetails[name])    info = employeeDetails[name];
    if (!info && staticEmployeeData[name]) info = staticEmployeeData[name];
    if (info){const t=getTitle(info.gender,info.maritalStatus);if(t)return `${t} ${name}`;}
    return name;
  };

  const getLeaveTypeDisplayName = (t) => ({CASUAL:"CASUAL LEAVE",SICK:"VACATION LEAVE",MATERNITY:"MATERNITY LEAVE",SHORT:"SHORT LEAVE",HALF_DAY:"HALF DAY LEAVE"}[t]||t?.replace("_"," ")||"");

  // const calculateDuration = (leaveType,startDate,endDate,shortStart,shortEnd,halfDayPeriod,workingDays) => {
  //   if (leaveType==="HALF_DAY") return `0.5 day (${halfDayPeriod||"MORNING"} period)`;
  //   if (leaveType==="SHORT"||leaveType==="SHORT_LEAVE") {
  //     if (shortStart&&shortEnd){const s=new Date(`${startDate}T${shortStart}`);const e=new Date(`${startDate}T${shortEnd}`);return `${((e-s)/3600000).toFixed(2)} hours (${s.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} - ${e.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})})`;}
  //     return "Short duration";
  //   }
  //   if (workingDays&&workingDays>0) return `${workingDays} working day${workingDays!==1?"s":""}`;
  //   const days=Math.round((new Date(endDate)-new Date(startDate))/86400000)+1;
  //   return days===1?"1 day":`${days} days`;
  // };
  const formatTimeDisplay = (time) => {
  if (!time) return null;
  const [h, m] = time.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const calculateDuration = (leaveType,startDate,endDate,shortStart,shortEnd,halfDayPeriod,workingDays,halfDayStart,halfDayEnd) => {
  if (leaveType==="HALF_DAY") {
    const period = halfDayPeriod || "MORNING";
    if (halfDayStart && halfDayEnd) {
      const s = formatTimeDisplay(halfDayStart);
      const e = formatTimeDisplay(halfDayEnd);
      return `0.5 day (${period} · ${s} - ${e})`;
    }
    return `0.5 day (${period} period)`;
  }
  if (leaveType==="SHORT"||leaveType==="SHORT_LEAVE") {
    if (shortStart&&shortEnd){const s=new Date(`${startDate}T${shortStart}`);const e=new Date(`${startDate}T${shortEnd}`);return `${((e-s)/3600000).toFixed(2)} hours (${s.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} - ${e.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})})`;}
    return "Short duration";
  }
  if (workingDays&&workingDays>0) return `${workingDays} working day${workingDays!==1?"s":""}`;
  const days=Math.round((new Date(endDate)-new Date(startDate))/86400000)+1;
  return days===1?"1 day":`${days} days`;
};

  const getRoleIcon  = (role) => role==="Acting Officer"?<User size={isMobile?12:16} className="me-1" />:role==="Supervising Officer"?<UserCog size={isMobile?12:16} className="me-1" />:role==="Approval Officer"?<UserCheck size={isMobile?12:16} className="me-1" />:<Shield size={isMobile?12:16} className="me-1" />;
  const getRoleColor = (role) => role==="Acting Officer"?"bg-info-subtle text-info":role==="Supervising Officer"?"bg-warning-subtle text-warning":role==="Approval Officer"?"bg-success-subtle text-success":"bg-secondary-subtle text-secondary";
  const sortByDate   = (arr) => arr.slice().sort((a,b)=>new Date(b.receivedDate||b.requestDate||b.createdAt||0)-new Date(a.receivedDate||a.requestDate||a.createdAt||0));

  const fetchEmployeeDetails = async () => {
    try {
      setLoadingEmployeeData(true);
      const res = await API.get("/admin/users");
      if (Array.isArray(res)){
        const map={};
        res.forEach(emp=>{[emp.name,emp.fullName,emp.employeeName,emp.empName].filter(Boolean).forEach(n=>{map[n]={gender:emp.gender,maritalStatus:emp.maritalStatus};});});
        setEmployeeDetails({...staticEmployeeData,...map});
      }
    } catch { setEmployeeDetails(staticEmployeeData); }
    finally { setLoadingEmployeeData(false); }
  };

  const fetchPendingEmergencyLeaves = async () => {
    try {
      const res = await API.get("/emergency-leave/officer/pending");
      const data = Array.isArray(res)?res:(Array.isArray(res?.data)?res.data:[]);
      setPendingEmergencyLeaves(data.filter(r=>r.status==="PENDING_APPROVAL"));
    } catch { setPendingEmergencyLeaves([]); }
  };

  const handleEmergencyAction = async (requestId, action, comments) => {
    setEmergencyActionLoading(requestId);
    try {
      await API.post(`/emergency-leave/officer/${action}/${requestId}`,{comments:comments||""});
      showMessage(action==="approve"?"✅ Emergency leave approved! Vacation days added to employee balance.":"✅ Emergency leave request rejected.");
      setEmergencyActionModal(null);
      setEmergencyComments("");
      await fetchPendingEmergencyLeaves();
    } catch(err){ showMessage(err.message||`Failed to ${action} emergency leave.`,true); }
    finally { setEmergencyActionLoading(null); }
  };

  const fetchPendingLeavesInternal = async () => {
    try {
      const [acting,supervising,approval] = await Promise.all([
        API.get("/leaves/pending/acting").catch(()=>[]),
        API.get("/leaves/pending/supervising").catch(()=>[]),
        API.get("/leaves/pending/approval").catch(()=>[]),
      ]);
      setAllPendingLeaves([
        ...(Array.isArray(acting)?acting:[]).map(l=>({...l,role:"Acting Officer"})),
        ...(Array.isArray(supervising)?supervising:[]).map(l=>({...l,role:"Supervising Officer"})),
        ...(Array.isArray(approval)?approval:[]).map(l=>({...l,role:"Approval Officer"})),
      ]);
    } catch { showMessage("Failed to fetch pending leaves",true); }
  };

  const handleLeaveAction = async (leave, action) => {
    let ep="";
    if (leave.status==="PENDING_ACTING_OFFICER"||leave.status==="PENDING_ACTING") ep=`/leaves/${leave.id}/acting-action`;
    else if (leave.status==="PENDING_SUPERVISING_OFFICER"||leave.status==="PENDING_SUPERVISING") ep=`/leaves/${leave.id}/supervising-action`;
    else if (leave.status==="PENDING_APPROVAL_OFFICER"||leave.status==="PENDING_APPROVAL") ep=`/leaves/${leave.id}/approval-action`;
    else { showMessage("This leave cannot be processed",true); return; }
    try {
      setLoading(true);
      await API.post(ep,{action:action.toUpperCase(),comments:""});
      showMessage(action.toUpperCase()==="APPROVE"?"Leave has been approved":"Leave has been rejected");
      setAllPendingLeaves(prev=>prev.filter(l=>l.id!==leave.id));
      setTimeout(()=>{fetchPendingLeavesInternal();fetchApprovalHistory(currentPage,itemsPerPage);},1000);
    } catch(err){ showMessage(err.message||"Failed to update leave status",true); }
    finally { setLoading(false); }
  };

  const handleCancelRejectionAndAccept = async (leave) => {
    let ep="";
    if (leave.role==="Acting Officer")      ep=`/leaves/${leave.id}/acting-action`;
    else if (leave.role==="Supervising Officer") ep=`/leaves/${leave.id}/supervising-action`;
    else if (leave.role==="Approval Officer")    ep=`/leaves/${leave.id}/approval-action`;
    else { showMessage("Cannot determine officer role.",true); return; }
    try {
      setCancelRejectionLoading(leave.id);
      await API.post(ep,{action:"APPROVE",comments:"Rejection cancelled — approved after review."});
      showMessage(`✅ Rejection reversed! Leave for ${formatEmployeeName(leave)} has been approved.`);
      setTimeout(()=>{fetchPendingLeavesInternal();fetchApprovalHistory(currentPage,itemsPerPage);},800);
    } catch(err){ showMessage(err.message||"Failed to reverse rejection.",true); }
    finally { setCancelRejectionLoading(null); }
  };

  const fetchApprovalHistory = async (page=1, pageSize=itemsPerPage) => {
    try {
      setHistoryLoading(true);
      const [ah,sh,aph] = await Promise.all([
        API.get("/leaves/history/acting").catch(()=>[]),
        API.get("/leaves/history/supervising").catch(()=>[]),
        API.get("/leaves/history/approval").catch(()=>[]),
      ]);
      const processItem = (item, role) => {
        let actionDate, actionTaken;
        if (role==="Acting Officer")      {actionDate=item.actingOfficerApprovedAt||item.createdAt;     actionTaken=item.actingOfficerStatus;}
        else if (role==="Supervising Officer"){actionDate=item.supervisingOfficerApprovedAt||item.createdAt;actionTaken=item.supervisingOfficerStatus;}
        else                              {actionDate=item.approvalOfficerApprovedAt||item.createdAt;    actionTaken=item.approvalOfficerStatus;}
        return {...item,role,actionDate,actionTaken,
          actingOfficerName:item.actingOfficerName||"Not Assigned",actingOfficerEmail:item.actingOfficerEmail||"NONE",actingOfficerStatus:item.actingOfficerStatus||"NOT_ASSIGNED",
          supervisingOfficerName:item.supervisingOfficerName||"Not Assigned",supervisingOfficerEmail:item.supervisingOfficerEmail||"NONE",supervisingOfficerStatus:item.supervisingOfficerStatus||"NOT_ASSIGNED",
          approvalOfficerName:item.approvalOfficerName||"Not Assigned",approvalOfficerEmail:item.approvalOfficerEmail||"NONE",approvalOfficerStatus:item.approvalOfficerStatus||"NOT_ASSIGNED",
          employeeName:item.employeeName||item.name||"Unknown",isCancelled:item.isCancelled||item.status?.includes("CANCELLED")};
      };
      const all=[
        ...(Array.isArray(ah)?ah:[]).map(i=>processItem(i,"Acting Officer")),
        ...(Array.isArray(sh)?sh:[]).map(i=>processItem(i,"Supervising Officer")),
        ...(Array.isArray(aph)?aph:[]).map(i=>processItem(i,"Approval Officer")),
      ].reduce((acc,item)=>{if(!acc.find(e=>e.id===item.id&&e.role===item.role))acc.push(item);return acc;},[])
       .sort((a,b)=>new Date(b.actionDate||0)-new Date(a.actionDate||0));
      const start=(page-1)*pageSize;
      setApprovalHistory(all.slice(start,start+pageSize));
      setTotalRecords(all.length);
      setTotalPages(Math.ceil(all.length/pageSize));
    } catch { showMessage("Failed to fetch approval history",true); }
    finally { setHistoryLoading(false); }
  };

  useEffect(()=>{
    if (!token||!email) return;
    fetchEmployeeDetails();
    fetchPendingLeavesInternal();
    fetchPendingEmergencyLeaves();
    fetchApprovalHistory(1,itemsPerPage);
  },[email,token,itemsPerPage]);

  const handlePageChange = (p) => { setCurrentPage(p); fetchApprovalHistory(p,itemsPerPage); };
  const handleItemsPerPageChange = (n) => { setItemsPerPage(n); setCurrentPage(1); fetchApprovalHistory(1,n); };

  const renderHistoryRow = (leave) => {
    const actionDate = new Date(leave.actionDate||leave.createdAt);
    const actionTaken = leave.actionTaken||(leave.status?.includes("APPROVED")?"APPROVED":leave.status?.includes("REJECTED")?"REJECTED":leave.status||"UNKNOWN");
    const canReverse =
      (leave.role==="Acting Officer"      && leave.status==="REJECTED_BY_ACTING_OFFICER")     ||
      (leave.role==="Supervising Officer" && leave.status==="REJECTED_BY_SUPERVISING_OFFICER")||
      (leave.role==="Approval Officer"    && leave.status==="REJECTED_BY_APPROVAL_OFFICER");
    return (
      <tr key={`${leave.id}-${leave.role}`} className={canReverse?"table-warning":""}>
        <td className="py-3 px-3">
          <div className="fw-semibold text-dark mb-1">{actionDate.toLocaleDateString()}</div>
          <div className="small text-muted">{actionDate.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
        </td>
        <td className="py-3 px-3" style={{ width:"120px" }}>
          <div className="d-flex align-items-center">
            <div className="rounded-circle p-2 me-2" style={{ background:"rgba(31,41,55,0.1)", width:"32px", height:"32px" }}><User size={14} style={{ color:"#1f2937" }} /></div>
            <div className="fw-semibold text-dark" style={{ fontSize:"0.75rem" }}>{formatEmployeeName(leave)}</div>
          </div>
        </td>
        <td className="py-3 px-3" style={{ width:"130px" }}>
          <span className="badge text-dark px-2 py-1 rounded-pill fw-semibold d-block mb-2" style={{ fontSize:"0.6rem", backgroundColor:"#bbc0c7" }}>{getLeaveTypeDisplayName(leave.leaveType)}</span>
          <div className="small text-muted" style={{ fontSize:"0.65rem", lineHeight:"1.3" }}><MessageSquare size={10} className="me-1" />{leave.reason||"No reason"}</div>
        </td>
        <td className="py-3 px-1">
          <div className="fw-semibold text-dark mb-1" style={{ fontSize:"0.75rem" }}>
            {leave.leaveType==="SHORT"||leave.leaveType==="SHORT_LEAVE" ? new Date(leave.startDate).toLocaleDateString()
              : leave.leaveType==="HALF_DAY" ? `${new Date(leave.startDate).toLocaleDateString()} (${leave.halfDayPeriod||"MORNING"})`
              : leave.leaveType==="MATERNITY" ? `${new Date(leave.startDate).toLocaleDateString()}${leave.endDate?" → "+new Date(leave.endDate).toLocaleDateString():""}`
              : `${new Date(leave.startDate).toLocaleDateString()} → ${new Date(leave.endDate).toLocaleDateString()}`}
          </div>
          <div className="small text-muted"><Clock size={12} className="me-1" />{calculateDuration(leave.leaveType,leave.startDate,leave.endDate,leave.shortLeaveStartTime,leave.shortLeaveEndTime,leave.halfDayPeriod,leave.workingDays,leave.halfDayStartTime, leave.halfDayEndTime  )}</div>
        </td>
        <td className="py-3 px-0" style={{ minWidth:"300px" }}>
          <ApprovalFlow leave={leave} employeeDetails={employeeDetails} isCompact={false} isMobile={false} />
        </td>
        <td className="py-3 px-1">
          <span className={`badge px-2 py-1 rounded-pill fw-semibold ${actionTaken==="APPROVED"?"bg-success text-white":actionTaken==="REJECTED"?"bg-danger text-white":"bg-secondary text-white"}`} style={{ fontSize:"0.55rem" }}>
            {actionTaken==="APPROVED"?<><CheckCircle size={12} className="me-1" />APPROVED</>:actionTaken==="REJECTED"?<><XCircle size={12} className="me-1" />REJECTED</>:actionTaken}
          </span>
        </td>
        <td className="py-3 px-1">
          <span className={`badge px-2 py-1 rounded-pill d-inline-flex align-items-center ${getRoleColor(leave.role)}`} style={{ fontSize:"0.6rem" }}>{getRoleIcon(leave.role)}<span style={{ fontSize:"0.6rem" }}>{leave.role}</span></span>
        </td>
        <td className="py-3 px-2" style={{ minWidth:"160px" }}>
          {canReverse ? (
            <button className="btn btn-sm btn-warning rounded-2 d-flex align-items-center justify-content-center fw-semibold shadow-sm cancel-rejection-btn"
              style={{ fontSize:"0.6rem", minWidth:"145px", height:"28px", whiteSpace:"nowrap" }}
              onClick={()=>handleCancelRejectionAndAccept(leave)} disabled={cancelRejectionLoading===leave.id} title="Cancel rejection and approve">
              {cancelRejectionLoading===leave.id ? <span className="spinner-border spinner-border-sm me-1" /> : <RotateCcw size={11} className="me-1" />}
              Cancel Rejection & Accept
            </button>
          ) : (
            <span className="text-muted small" style={{ fontSize:"0.6rem" }}>—</span>
          )}
        </td>
      </tr>
    );
  };

  const renderPagPages = () => {
    const pages=[];
    if (totalPages<=5){for(let i=1;i<=totalPages;i++)pages.push(i);}
    else if (currentPage<=3){for(let i=1;i<=4;i++)pages.push(i);pages.push("...");pages.push(totalPages);}
    else if (currentPage>=totalPages-2){pages.push(1);pages.push("...");for(let i=totalPages-3;i<=totalPages;i++)pages.push(i);}
    else{pages.push(1);pages.push("...");for(let i=currentPage-1;i<=currentPage+1;i++)pages.push(i);pages.push("...");pages.push(totalPages);}
    return pages.map((page,idx)=>page==="..."
      ? <span key={idx} className="px-2 py-1 text-muted small">...</span>
      : <button key={idx} onClick={()=>handlePageChange(page)} className={`btn btn-sm me-1 ${currentPage===page?"btn-primary":"btn-outline-primary"}`} style={{ fontSize:"0.75rem", padding:"0.25rem 0.5rem", minWidth:"32px" }}>{page}</button>
    );
  };

  if (!token||!email) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-warning d-flex align-items-center shadow-lg border-0 rounded-4">
              <AlertCircle size={20} className="me-3 text-warning" />
              <div><h6 className="mb-1 fw-semibold">Authentication Required</h6><p className="mb-0">Please log in to access approvals.</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#88b3df 0%,#b5cce7 50%,#75e3c0 100%)", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:1030 }}><Navbar setSidebarOpen={setSidebarOpen} /></div>
      <div className="d-none d-lg-block position-fixed" style={{ top:"60px", left:0, bottom:0, width:"280px", zIndex:1020 }}><EmployeeSidebar sidebarOpen={true} setSidebarOpen={setSidebarOpen} /></div>
      {sidebarOpen && isMobile && (
        <>
          <div className="position-fixed w-100 h-100 bg-dark bg-opacity-50 d-lg-none" style={{ zIndex:1040, top:"60px" }} onClick={()=>setSidebarOpen(false)} />
          <div className="position-fixed d-lg-none" style={{ top:"60px", left:0, bottom:0, width:"280px", zIndex:1050 }}><EmployeeSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /></div>
        </>
      )}
      <div className="main-content" style={{ marginLeft:isMobile?"0":"280px", marginTop:"60px", minHeight:"calc(100vh - 60px)", padding:isMobile?"10px":"20px" }}>
        <EmployeeDashboard />
        <div className="container-fluid px-0 py-3">

          {/* ── Emergency Leave Pending ── */}
          {pendingEmergencyLeaves.length > 0 && (
            <div className="glass-card rounded-4 slide-in mb-3" style={{ border:"2px solid #1976d2", background:"rgba(240,244,255,0.97)" }}>
              <div className="p-3 d-flex align-items-center justify-content-between flex-wrap" style={{ background:"linear-gradient(135deg,#1565c0,#1976d2)", borderRadius:"1rem 1rem 0 0" }}>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize:"24px" }}>🚨</span>
                  <div>
                    <h6 className="mb-0 fw-bold text-white" style={{ fontSize:"13px" }}> EMERGENCY LEAVE — PENDING APPROVAL</h6>
                    <small className="text-white" style={{ opacity:0.85, fontSize:"11px" }}>Grant previous year remaining vacation as emergency credit</small>
                  </div>
                </div>
                <span className="badge bg-white fw-bold mt-2 mt-sm-0" style={{ fontSize:"0.85rem", padding:"6px 14px", color:"#1565c0" }}>{pendingEmergencyLeaves.length} pending</span>
              </div>
              <div className="p-3">
                {pendingEmergencyLeaves.map(req => (
                  <div key={req.id} style={{ background:"white", borderRadius:"12px", marginBottom:"12px", border:"1px solid #90caf9", boxShadow:"0 2px 8px rgba(21,101,192,0.12)", overflow:"hidden" }}>
                    <div style={{ height:"3px", background:"linear-gradient(90deg,#1565c0,#1976d2,#42a5f5)" }} />
                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                        <div>
                          <div className="fw-bold text-dark">👤 {req.employeeName}</div>
                          <div className="text-muted small">{req.employeeEmail}</div>
                        </div>
                        <span style={{ background:"#e3f2fd", color:"#1565c0", padding:"3px 12px", borderRadius:"20px", fontSize:"11px", fontWeight:"800", border:"1px solid #90caf9", whiteSpace:"nowrap" }}>🔵 EMERGENCY LEAVE</span>
                      </div>
                      <div style={{ marginBottom:"12px", background:"#fff8f0", borderRadius:"8px", overflow:"hidden" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 1fr 1fr", padding:"6px 10px", background:"#1565c0", color:"white", fontSize:"11px", fontWeight:"700" }}>
                          <span>Year</span><span style={{ textAlign:"center" }}>Remaining</span><span style={{ textAlign:"center" }}>Granting</span><span style={{ textAlign:"center" }}>Target</span>
                        </div>
                        {(req.yearGrants||[]).map((yg,yi)=>(
                          <div key={yg.previousYear} style={{ display:"grid", gridTemplateColumns:"80px 1fr 1fr 1fr", padding:"6px 10px", fontSize:"12px", background:yi%2===0?"#fff":"#f8f9fa", borderBottom:"1px solid #eee" }}>
                            <span style={{ fontWeight:"700", color:"#1565c0" }}>{yg.previousYear}</span>
                            <span style={{ textAlign:"center", color:"#555" }}>{yg.previousYearRemainingDays>=0?`${yg.previousYearRemainingDays}d`:"?"}</span>
                            <span style={{ textAlign:"center", color:"#1565c0", fontWeight:"700" }}>+{yg.daysToGrant}d</span>
                            <span style={{ textAlign:"center", color:"#1565c0" }}>{req.targetYear}</span>
                          </div>
                        ))}
                        <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 10px", background:"#e3f2fd", fontWeight:"800", color:"#1565c0", fontSize:"13px" }}>
                          <span>Total Grant</span><span style={{ fontSize:"18px", color:"#1565c0" }}>+{req.totalDaysToGrant} days</span>
                        </div>
                      </div>
                      <div style={{ background:"#f9f9f9", borderRadius:"8px", padding:"8px 12px", marginBottom:"10px", borderLeft:"3px solid #1976d2", fontSize:"13px" }}>
                        <strong style={{ color:"#1565c0" }}>Reason:</strong> {req.reason||"—"}
                      </div>
                      <div className="d-flex justify-content-between mb-3 flex-wrap gap-1" style={{ fontSize:"12px", color:"#888" }}>
                        <span>🏢 Admin: <strong style={{ color:"#333" }}>{req.requestedByAdminName}</strong></span>
                        <span>📅 {req.createdAt?new Date(req.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):"—"}</span>
                      </div>
                      <div style={{ background:"#e3f2fd", border:"1px solid #90caf9", borderRadius:"8px", padding:"8px 12px", marginBottom:"12px", fontSize:"12px", color:"#1565c0" }}>
                        📋 Approving grants <strong>{req.totalDaysToGrant} days</strong> of previous year remaining vacation as emergency credit to <strong>{req.employeeName}</strong>.
                      </div>
                      <div className="d-flex gap-2">
                        <button onClick={()=>{setEmergencyComments("");setEmergencyActionModal({req,action:"approve"});}} disabled={emergencyActionLoading===req.id}
                          style={{ flex:1, background:"#109353", color:"white", border:"none", borderRadius:"8px", padding:"9px", fontWeight:"700", fontSize:"12px", cursor:"pointer", opacity:emergencyActionLoading===req.id?0.6:1 }}>
                          {emergencyActionLoading===req.id?<span className="spinner-border spinner-border-sm" />:"✅ APPROVE"}
                        </button>
                        <button onClick={()=>{setEmergencyComments("");setEmergencyActionModal({req,action:"reject"});}} disabled={emergencyActionLoading===req.id}
                          style={{ flex:1, background:"#c62828", color:"white", border:"none", borderRadius:"8px", padding:"10px", fontWeight:"700", fontSize:"13px", cursor:"pointer", opacity:emergencyActionLoading===req.id?0.6:1 }}>
                          ❌ REJECT
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Regular Pending Approvals ── */}
          <div className="glass-card rounded-4 slide-in">
            {loadingEmployeeData && <div className="d-flex align-items-center p-3 mb-3 rounded bg-light"><div className="spinner-border spinner-border-sm me-2" /><span className="text-muted">Loading employee details...</span></div>}
            {success && <div className="d-flex align-items-center p-3 mb-3 rounded" style={{ backgroundColor:"#d1edff", color:"#065F46", border:"1px solid #b3d9ff" }}><CheckCircle size={20} className="me-2" /><span><strong>Success!</strong> {success}</span></div>}
            {error   && <div className="d-flex align-items-center p-3 mb-3 rounded" style={{ backgroundColor:"#FEE2E2", color:"#991B1B", border:"1px solid #EF4444" }}><XCircle size={20} className="me-2" /><span><strong>Error!</strong> {error}</span></div>}
            <div className={`border-bottom ${isMobile?"p-3":"p-4"} d-flex align-items-center justify-content-between flex-wrap`}>
              <div className="d-flex align-items-center mb-2 mb-sm-0">
                <div className="rounded-circle p-2 me-3" style={{ background:"rgba(31,41,55,0.1)" }}><CheckCircle size={20} style={{ color:"#1f2937" }} /></div>
                <h6 className="mb-0 fw-semibold text-dark">PENDING APPROVALS</h6>
              </div>
              {allPendingLeaves.length>0 && <span className="badge bg-danger rounded-pill">{allPendingLeaves.length} pending</span>}
            </div>
            <div className="p-0">
              {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /><p className="mt-2 text-muted">Processing...</p></div>}
              {!loading && allPendingLeaves.length===0 && <div className="text-center py-5 text-muted"><CheckCircle size={48} className="mb-3 opacity-50" /><p className="mb-0">All caught up!</p><small>No pending approvals</small></div>}
              {!loading && allPendingLeaves.length>0 && (
                isMobile ? (
                  <div className="p-3">{sortByDate(allPendingLeaves).map(leave=><MobileApprovalCard key={leave.id} leave={leave} employeeDetails={employeeDetails} onApprove={l=>handleLeaveAction(l,"APPROVE")} onReject={l=>handleLeaveAction(l,"REJECT")} loading={loading} formatEmployeeName={formatEmployeeName} getLeaveTypeDisplayName={getLeaveTypeDisplayName} calculateDuration={calculateDuration} getRoleIcon={getRoleIcon} getRoleColor={getRoleColor} />)}</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover mb-0 small" style={{ fontSize:"0.75rem" }}>
                      <thead style={{ background:"rgba(211,225,240,0.8)" }}>
                        <tr>
                          <th className="border-0 py-3 px-1 fw-semibold text-dark"><div className="d-flex align-items-center justify-content-center text-center"><div><div className="d-flex align-items-center justify-content-center mb-1"><Inbox size={14} className="me-1" /></div><div style={{ fontSize:"0.75rem",lineHeight:"1.1" }}><div>DATE</div><div>RECEIVED</div></div></div></div></th>
                          <th className="border-0 py-3 px-1 fw-semibold text-dark" style={{ width:"120px" }}><div className="d-flex align-items-center"><User size={16} className="me-2" />EMPLOYEE</div></th>
                          <th className="border-0 py-3 px-1 fw-semibold text-dark" style={{ width:"130px" }}><div className="d-flex align-items-center justify-content-center text-center"><div><div className="d-flex align-items-center justify-content-center mb-1"><FileText size={14} className="me-1" /></div><div style={{ fontSize:"0.75rem",lineHeight:"1.1" }}><div>LEAVE</div><div>TYPE</div></div></div></div></th>
                          <th className="border-0 py-3 px-1 fw-semibold text-dark"><div className="d-flex align-items-center"><Calendar size={16} className="me-2" />DURATION</div></th>
                          <th className="border-0 py-3 px-1 fw-semibold text-dark"><div className="d-flex align-items-center justify-content-center text-center"><div><div className="d-flex align-items-center justify-content-center mb-1"><Users size={14} className="me-1" /></div><div style={{ fontSize:"0.75rem",lineHeight:"1.1" }}><div>APPROVAL</div><div>CHAIN</div></div></div></div></th>
                          <th className="border-0 py-3 px-1 fw-semibold text-dark"><div className="d-flex align-items-center"><Settings size={16} className="me-2" />ACTIONS</div></th>
                          <th className="border-0 py-3 px-1 fw-semibold text-dark"><div className="d-flex align-items-center"><Shield size={16} className="me-2" />YOUR ROLE</div></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortByDate(allPendingLeaves).map(leave=>(
                          <tr key={leave.id}>
                            <td className="py-3 px-3">
                              <div className="fw-semibold text-dark mb-1">{new Date(leave.receivedDate||leave.requestDate||leave.createdAt).toLocaleDateString()}</div>
                              <div className="small text-muted">{new Date(leave.receivedDate||leave.requestDate||leave.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                            </td>
                            <td className="py-3 px-3" style={{ width:"120px" }}>
                              <div className="d-flex align-items-center">
                                <div className="rounded-circle p-2 me-2" style={{ background:"rgba(31,41,55,0.1)", width:"32px", height:"32px" }}><User size={14} style={{ color:"#1f2937" }} /></div>
                                <div className="fw-semibold text-dark" style={{ fontSize:"0.75rem" }}>{formatEmployeeName(leave)}</div>
                              </div>
                            </td>
                            <td className="py-3 px-3" style={{ width:"130px" }}>
                              <span className="badge text-dark px-2 py-1 rounded-pill fw-semibold d-block mb-2" style={{ fontSize:"0.6rem", backgroundColor:"#bbc0c7" }}>{getLeaveTypeDisplayName(leave.leaveType)}</span>
                              {leave.leaveType==="MATERNITY"&&leave.maternityLeaveType&&<div className="mb-2"><span className="badge px-2 py-1 rounded-pill fw-semibold" style={{ backgroundColor:"rgba(236,72,153,0.1)", color:"#be185d" }}>{leave.maternityLeaveType.replace(/_/g," ")}</span></div>}
                              <div className="small text-muted" style={{ fontSize:"0.65rem", lineHeight:"1.3" }}><MessageSquare size={10} className="me-1" />{leave.reason||"No reason"}</div>
                            </td>
                            <td className="py-3 px-1">
                              {leave.leaveType==="MATERNITY" ? (
                                <div>
                                  <div className="fw-semibold text-dark mb-1">{new Date(leave.startDate).toLocaleDateString()}</div>
                                  <div className="small text-primary mb-1"><Clock size={12} className="me-1" />Full Pay - 84 Days</div>
                                  <div className="small text-muted" style={{ fontSize:"0.65rem" }}>End date: Set by admin after approval</div>
                                </div>
                              ) : (
                                <div>
                                  <div className="fw-semibold text-dark mb-1">
                                    {leave.leaveType==="SHORT"||leave.leaveType==="SHORT_LEAVE" ? new Date(leave.startDate).toLocaleDateString()
                                      : leave.leaveType==="HALF_DAY" ? `${new Date(leave.startDate).toLocaleDateString()} (${leave.halfDayPeriod||"MORNING"} period)`
                                      : `${new Date(leave.startDate).toLocaleDateString()} → ${new Date(leave.endDate).toLocaleDateString()}`}
                                  </div>
                                  <div className="small text-muted"><Clock size={12} className="me-1" />{calculateDuration(leave.leaveType,leave.startDate,leave.endDate,leave.shortLeaveStartTime,leave.shortLeaveEndTime,leave.halfDayPeriod,leave.workingDays,leave.halfDayStartTime, leave.halfDayEndTime  )}</div>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-0" style={{ minWidth:"300px" }}><ApprovalFlow leave={leave} employeeDetails={employeeDetails} isCompact={false} isMobile={false} /></td>
                            <td className="py-3 px-2" style={{ width:"180px" }}>
                              <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-success rounded-2 d-flex align-items-center justify-content-center fw-semibold shadow-sm" style={{ fontSize:"0.6rem", width:"80px", height:"28px" }} onClick={()=>handleLeaveAction(leave,"APPROVE")} disabled={loading}>
                                  {loading?<span className="spinner-border spinner-border-sm" />:<><CheckCircle size={12} className="me-1" />APPROVE</>}
                                </button>
                                <button className="btn btn-sm btn-danger rounded-2 d-flex align-items-center justify-content-center fw-semibold shadow-sm" style={{ fontSize:"0.6rem", width:"75px", height:"28px" }} onClick={()=>handleLeaveAction(leave,"REJECT")} disabled={loading}>
                                  {loading?<span className="spinner-border spinner-border-sm" />:<><XCircle size={12} className="me-1" />REJECT</>}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3" style={{ width:"60px" }}>
                              <span className={`badge px-2 py-1 rounded-pill d-inline-flex align-items-center ${getRoleColor(leave.role)}`} style={{ fontSize:"0.25rem" }}>{getRoleIcon(leave.role)}<span style={{ fontSize:"0.60rem" }}>{leave.role}</span></span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>

          {/* ── Approval History ── */}
          <div className="glass-card rounded-4 mt-4">
            <div className={`border-bottom ${isMobile?"p-3":"p-4"} d-flex align-items-center justify-content-between flex-wrap`}>
              <div className="d-flex align-items-center mb-2 mb-sm-0">
                <div className="rounded-circle p-2 me-3" style={{ background:"rgba(31,41,55,0.1)" }}><Clock size={20} style={{ color:"#1f2937" }} /></div>
                <h6 className="mb-0 fw-semibold text-dark">APPROVAL HISTORY</h6>
              </div>
            </div>
            <div className="p-0">
              {historyLoading && <div className="text-center py-5"><div className="spinner-border text-primary" /><p className="mt-2 text-muted">Loading approval history...</p></div>}
              {!historyLoading && approvalHistory.length===0 && <div className="text-center py-5 text-muted"><Clock size={48} className="mb-3 opacity-50" /><p className="mb-0">No approval history found</p><small>Your previous approvals will appear here</small></div>}
              {!historyLoading && approvalHistory.length>0 && (
                <>
                  {isMobile ? (
                    <div className="p-3">
                      {approvalHistory.map(leave=><MobileHistoryCard key={`${leave.id}-${leave.role}`} leave={leave} employeeDetails={employeeDetails} formatEmployeeName={formatEmployeeName} getLeaveTypeDisplayName={getLeaveTypeDisplayName} calculateDuration={calculateDuration} getRoleIcon={getRoleIcon} getRoleColor={getRoleColor} onCancelRejectionAndAccept={handleCancelRejectionAndAccept} cancelRejectionLoading={cancelRejectionLoading} />)}
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm table-hover mb-0 small" style={{ fontSize:"0.75rem" }}>
                        <thead style={{ background:"rgba(211,225,240,0.8)" }}>
                          <tr>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark"><div className="d-flex align-items-center justify-content-center text-center"><div><div className="d-flex align-items-center justify-content-center mb-1"><Clock size={14} className="me-1" /></div><div style={{ fontSize:"0.75rem",lineHeight:"1.1" }}><div>ACTION</div><div>DATE</div></div></div></div></th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark" style={{ width:"120px" }}><div className="d-flex align-items-center"><User size={16} className="me-2" />EMPLOYEE</div></th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark" style={{ width:"130px" }}><div className="d-flex align-items-center justify-content-center text-center"><div><div className="d-flex align-items-center justify-content-center mb-1"><FileText size={14} className="me-1" /></div><div style={{ fontSize:"0.75rem",lineHeight:"1.1" }}><div>LEAVE</div><div>TYPE</div></div></div></div></th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark"><div className="d-flex align-items-center"><Calendar size={16} className="me-2" />DURATION</div></th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark"><div className="d-flex align-items-center justify-content-center text-center"><div><div className="d-flex align-items-center justify-content-center mb-1"><Users size={14} className="me-1" /></div><div style={{ fontSize:"0.75rem",lineHeight:"1.1" }}><div>APPROVAL</div><div>CHAIN</div></div></div></div></th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark"><div className="d-flex align-items-center"><CheckCircle size={16} className="me-2" />ACTION TAKEN</div></th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark"><div className="d-flex align-items-center"><Shield size={16} className="me-2" />YOUR ROLE</div></th>
                            <th className="border-0 py-3 px-1 fw-semibold text-dark"><div className="d-flex align-items-center"><RotateCcw size={16} className="me-2" />REVERSE</div></th>
                          </tr>
                        </thead>
                        <tbody>{approvalHistory.map(leave=>renderHistoryRow(leave))}</tbody>
                      </table>
                    </div>
                  )}
                  {totalPages>1 && !isMobile && (
                    <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top" style={{ backgroundColor:"rgba(248,249,250,0.8)" }}>
                      <div className="d-flex align-items-center">
                        <div className="d-flex align-items-center me-4">
                          <span className="text-sm text-muted me-2">Show:</span>
                          <select value={itemsPerPage} onChange={e=>handleItemsPerPageChange(parseInt(e.target.value))} className="form-select form-select-sm" style={{ width:"80px" }}>
                            <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                          </select>
                          <span className="text-sm text-muted ms-2">entries</span>
                        </div>
                        <div className="text-sm text-muted">Showing <strong>{Math.min((currentPage-1)*itemsPerPage+1,totalRecords)}</strong> to <strong>{Math.min(currentPage*itemsPerPage,totalRecords)}</strong> of <strong>{totalRecords}</strong></div>
                      </div>
                      <div className="d-flex align-items-center">
                        <button onClick={()=>handlePageChange(currentPage-1)} disabled={currentPage===1} className={`btn btn-sm me-2 d-flex align-items-center ${currentPage===1?"btn-outline-secondary disabled":"btn-outline-primary"}`} style={{ fontSize:"0.75rem", padding:"0.25rem 0.75rem" }}><ChevronLeft size={14} className="me-1" />Previous</button>
                        <div className="d-flex align-items-center me-2">{renderPagPages()}</div>
                        <button onClick={()=>handlePageChange(currentPage+1)} disabled={currentPage===totalPages} className={`btn btn-sm d-flex align-items-center ${currentPage===totalPages?"btn-outline-secondary disabled":"btn-outline-primary"}`} style={{ fontSize:"0.75rem", padding:"0.25rem 0.75rem" }}>Next<ChevronRight size={14} className="ms-1" /></button>
                      </div>
                    </div>
                  )}
                  {totalPages>1 && isMobile && (
                    <div className="border-top p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="text-muted small">Page {currentPage} of {totalPages} ({totalRecords} total)</div>
                        <select value={itemsPerPage} onChange={e=>handleItemsPerPageChange(parseInt(e.target.value))} className="form-select form-select-sm" style={{ width:"100px" }}>
                          <option value={5}>Show 5</option><option value={10}>Show 10</option><option value={25}>Show 25</option>
                        </select>
                      </div>
                      <div className="d-flex justify-content-center gap-2">
                        <button onClick={()=>handlePageChange(currentPage-1)} disabled={currentPage===1} className="btn btn-sm btn-outline-primary d-flex align-items-center"><ChevronLeft size={14} className="me-1" />Prev</button>
                        <span className="btn btn-sm btn-primary disabled">{currentPage}/{totalPages}</span>
                        <button onClick={()=>handlePageChange(currentPage+1)} disabled={currentPage===totalPages} className="btn btn-sm btn-outline-primary d-flex align-items-center">Next<ChevronRight size={14} className="ms-1" /></button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Emergency Leave Confirm Modal ── */}
      {emergencyActionModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
          <div style={{ background:"white", borderRadius:"16px", width:"100%", maxWidth:"420px", overflow:"hidden", boxShadow:"0 10px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ background:emergencyActionModal.action==="approve"?"linear-gradient(135deg,#1565c0,#1976d2)":"linear-gradient(135deg,#c62828,#ef5350)", padding:"12px 16px", color:"white", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h2 style={{ margin:0, fontSize:"0.95rem", fontWeight:"700" }}>{emergencyActionModal.action==="approve"?"✅ Approve Emergency Leave":"❌ Reject Emergency Leave"}</h2>
              <button onClick={()=>{setEmergencyActionModal(null);setEmergencyComments("");}} style={{ background:"none", border:"none", color:"white", fontSize:"20px", cursor:"pointer" }}>✖</button>
            </div>
            <div style={{ padding:"14px 16px" }}>
              <div style={{ background:"#f0f4ff", borderRadius:"8px", padding:"10px 12px", marginBottom:"10px", border:"1px solid #c5cae9" }}>
                <div style={{ marginBottom:"3px", fontSize:"12px" }}><strong>Employee:</strong> {emergencyActionModal.req.employeeName}</div>
                <div style={{ marginBottom:"3px", fontSize:"12px" }}><strong>Emergency Days:</strong> <span style={{ color:"#1565c0", fontWeight:"800" }}>+{emergencyActionModal.req.totalDaysToGrant}</span> days (previous year credit)</div>
                <div style={{ fontSize:"12px", color:"#555" }}><strong>Reason:</strong> {emergencyActionModal.req.reason}</div>
              </div>
              {emergencyActionModal.action==="approve" && (
                <div style={{ background:"#e3f2fd", border:"1px solid #90caf9", borderRadius:"8px", padding:"8px 12px", marginBottom:"10px", fontSize:"12px", color:"#1565c0" }}>
                  📋 This grants <strong>{emergencyActionModal.req.totalDaysToGrant} days</strong> of previous year remaining vacation as emergency credit to <strong>{emergencyActionModal.req.employeeName}</strong>.
                </div>
              )}
              <div style={{ marginBottom:"18px" }}>
                <label style={{ display:"block", marginBottom:"6px", fontWeight:"600", fontSize:"13px" }}>
                  Comments {emergencyActionModal.action==="reject" && <span style={{ color:"red" }}>*</span>}
                </label>
                <textarea rows="3" value={emergencyComments} onChange={e=>setEmergencyComments(e.target.value)}
                  placeholder={emergencyActionModal.action==="approve"?"Optional comments…":"Reason for rejection (required)…"}
                  style={{ width:"100%", resize:"vertical", borderRadius:"6px", border:"1px solid #ccc", padding:"8px", fontSize:"13px", boxSizing:"border-box" }} />
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px" }}>
                <button onClick={()=>{setEmergencyActionModal(null);setEmergencyComments("");}} style={{ padding:"9px 22px", borderRadius:"8px", border:"1px solid #ccc", background:"white", cursor:"pointer", fontWeight:"600", fontSize:"13px" }}>Cancel</button>
                <button onClick={()=>{if(emergencyActionModal.action==="reject"&&!emergencyComments.trim()){showMessage("Please provide a reason for rejection.",true);return;}handleEmergencyAction(emergencyActionModal.req.id,emergencyActionModal.action,emergencyComments);}}
                  disabled={emergencyActionLoading===emergencyActionModal.req.id}
                  style={{ padding:"9px 22px", borderRadius:"8px", border:"none", background:emergencyActionModal.action==="approve"?"#109353":"#c62828", color:"white", cursor:"pointer", fontWeight:"700", fontSize:"13px", display:"flex", alignItems:"center", gap:"6px", opacity:emergencyActionLoading===emergencyActionModal.req.id?0.6:1 }}>
                  {emergencyActionLoading===emergencyActionModal.req.id?<span className="spinner-border spinner-border-sm" />:emergencyActionModal.action==="approve"?"✅ Confirm Approve":"❌ Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .glass-card{background:#bccee4f2;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2);box-shadow:0 8px 32px rgba(0,0,0,0.1);}
        .approval-card-mobile,.history-card-mobile{transition:all 0.2s ease;}
        .approval-card-mobile:hover,.history-card-mobile:hover{transform:translateY(-2px);box-shadow:0 4px 20px rgba(0,0,0,0.15)!important;}
        .cancel-rejection-btn{animation:pulse-warning 2s infinite;border:1px solid #e0a800!important;}
        .cancel-rejection-btn:hover:not(:disabled){animation:none;background-color:#ffc107!important;transform:translateY(-1px);box-shadow:0 4px 12px rgba(255,193,7,0.5)!important;}
        @keyframes pulse-warning{0%,100%{box-shadow:0 0 0 0 rgba(255,193,7,0.4)}50%{box-shadow:0 0 0 4px rgba(255,193,7,0)}}
        .table-warning td{background-color:rgba(255,243,205,0.4)!important;}
        .slide-in{animation:slideIn 0.5s ease-out;}
        @keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .table-responsive::-webkit-scrollbar{height:6px;}
        .table-responsive::-webkit-scrollbar-track{background:#f1f1f1;border-radius:10px;}
        .table-responsive::-webkit-scrollbar-thumb{background:#888;border-radius:10px;}
        .spinner-border{animation:spinner-border 0.75s linear infinite;}
        @keyframes spinner-border{to{transform:rotate(360deg)}}
        @media(max-width:991.98px){.main-content{margin-left:0!important;}.glass-card{border-radius:1rem!important;}}
        @media(max-width:576px){.badge{font-size:0.7rem!important;}}
      `}</style>
    </div>
  );
};

export default Approvals;