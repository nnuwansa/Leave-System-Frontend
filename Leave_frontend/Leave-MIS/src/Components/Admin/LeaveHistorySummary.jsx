
import React, { useState, useEffect } from "react";
import {
  FaPlus, FaEdit, FaTrash, FaSave, FaDownload,
  FaUser, FaHistory, FaEye, FaTimes, FaSearch, FaFilter,
} from "react-icons/fa";
import API from "../../API/axios";

const LeaveHistorySummary = () => {
  const [employees, setEmployees]           = useState([]);
  const [allEmployees, setAllEmployees]     = useState([]);
  const [selectedYear, setSelectedYear]     = useState(new Date().getFullYear() - 1);
  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showAddForm, setShowAddForm]       = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [showEmployeeHistory, setShowEmployeeHistory] = useState(false);
  const [selectedEmployee, setSelectedEmployee]       = useState(null);
  const [employeeHistoryData, setEmployeeHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory]           = useState(false);

  const [showSelectedSummary, setShowSelectedSummary]       = useState(false);
  const [selectedEmployees, setSelectedEmployees]           = useState([]);
  const [selectedEmployeesData, setSelectedEmployeesData]   = useState([]);
  const [loadingSelectedSummary, setLoadingSelectedSummary] = useState(false);

  const [searchTerm, setSearchTerm]           = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [departments, setDepartments]         = useState([]);

  // ── Form state — NOTE: year is its OWN field, NOT tied to selectedYear ──
  const [formData, setFormData] = useState({
    employeeEmail: "",
    year: new Date().getFullYear() - 1,  // user picks this independently
    casualUsed:    0,
    casualTotal:   21,
    sickUsed:      0,
    sickTotal:     24,
    dutyUsed:      0,
    shortLeaveMonthlyDetails: {},
    notes: "",
  });

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  // Build year options for the form (last 10 years)
  const formYearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 1; y >= currentYear - 10; y--) {
    formYearOptions.push(y);
  }

  useEffect(() => { fetchAllUsers(); fetchAvailableYears(); initializeShortLeaveData(); }, []);
  useEffect(() => { if (selectedYear) fetchHistoricalData(); }, [selectedYear]);
  useEffect(() => {
    const uniqueDepts = [...new Set(employees.map(e => e.employeeDetails?.department).filter(Boolean))];
    setDepartments(uniqueDepts);
  }, [employees]);

  const initializeShortLeaveData = () => {
    const sl = {};
    months.forEach(m => { sl[m] = { used: 0, total: 2 }; });
    setFormData(prev => ({ ...prev, shortLeaveMonthlyDetails: sl }));
  };

  const fetchAllUsers = async () => {
    try {
      const r = await API.get("/admin/users");
      setAllEmployees(r.data || []);
    } catch { setError("Failed to fetch employees"); }
  };

  const fetchAvailableYears = async () => {
    const years = [];
    for (let y = currentYear - 1; y >= currentYear - 10; y--) years.push(y);
    setAvailableYears(years);
  };

  const fetchHistoricalData = async () => {
    setLoading(true);
    try {
      const r = await API.get(`/admin/historical-leave-summaries/year/${selectedYear}`);
      setEmployees(r.data.success ? (r.data.data || []) : []);
    } catch { setEmployees([]); }
    finally { setLoading(false); }
  };

  const fetchSelectedEmployeesData = async () => {
    if (selectedEmployees.length === 0) { setError("Please select employees"); return; }
    setLoadingSelectedSummary(true);
    try {
      const responses = await Promise.all(
        selectedEmployees.map(email =>
          API.get(`/admin/historical-leave-summaries/employee/${email}/year/${selectedYear}`)
        )
      );
      setSelectedEmployeesData(responses.map((r, i) => ({
        email: selectedEmployees[i],
        data: r.data.success ? r.data.data : null,
        employeeDetails: allEmployees.find(e => e.email === selectedEmployees[i]),
      })));
      setShowSelectedSummary(true);
    } catch { setError("Failed to fetch selected employees data"); }
    finally { setLoadingSelectedSummary(false); }
  };

  const fetchEmployeeHistory = async (email) => {
    setLoadingHistory(true);
    try {
      const r = await API.get(`/admin/historical-leave-summaries/employee/${email}`);
      setEmployeeHistoryData(r.data.success ? (r.data.data || []) : []);
    } catch { setEmployeeHistoryData([]); setError("Failed to fetch employee history"); }
    finally { setLoadingHistory(false); }
  };

  const showEmployeeHistoryModal = async (employee) => {
    const d = employee.employeeDetails || employee;
    setSelectedEmployee(d);
    setShowEmployeeHistory(true);
    await fetchEmployeeHistory(d.email);
  };

  const handleEmployeeSelection = (email, isSelected) => {
    setSelectedEmployees(prev => isSelected ? [...prev, email] : prev.filter(e => e !== email));
  };

  const handleSelectAll = (isSelected) => {
    setSelectedEmployees(isSelected ? filteredEmployees.map(e => e.employeeDetails?.email || e.email) : []);
  };

  const filteredEmployees = employees.filter(emp => {
    const d = emp.employeeDetails || {};
    const name = d.fullName || d.name || "";
    const email = d.email || "";
    const dept = d.department || "";
    return (searchTerm === "" || name.toLowerCase().includes(searchTerm.toLowerCase()) || email.toLowerCase().includes(searchTerm.toLowerCase()))
      && (departmentFilter === "" || dept === departmentFilter);
  });

  const totalEmployees = filteredEmployees.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // formData.year is explicitly set by the user in the form — correct year goes to backend
      const r = await API.post("/admin/historical-leave-summaries/employee", formData);
      if (r.data.success) {
        setSuccessMessage(`✅ Historical leave summary saved for year ${formData.year}`);
        setShowAddForm(false);
        setEditingEmployee(null);
        resetForm();
        fetchHistoricalData();
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setError(r.data.message || "Failed to save historical summary");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save historical summary");
    } finally { setLoading(false); }
  };

  const handleEdit = (employee) => {
    const h = employee.historicalSummary;
    setFormData({
      employeeEmail: h.employeeEmail,
      year:          h.year,          // ← use the ACTUAL year from the record
      casualUsed:    h.casualUsed,
      casualTotal:   h.casualTotal,
      sickUsed:      h.sickUsed,
      sickTotal:     h.sickTotal,
      dutyUsed:      h.dutyUsed,
      shortLeaveMonthlyDetails: h.shortLeaveMonthlyDetails || {},
      notes:         h.notes || "",
    });
    setEditingEmployee(employee);
    setShowAddForm(true);
  };

  const handleDelete = async (email, year) => {
    if (!window.confirm(`Delete historical data for ${email} (${year})?`)) return;
    try {
      const r = await API.delete(`/admin/historical-leave-summaries/employee/${email}/year/${year}`);
      if (r.data.success) {
        setSuccessMessage("Historical summary deleted successfully");
        fetchHistoricalData();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else { setError(r.data.message || "Failed to delete"); }
    } catch (err) { setError(err.response?.data?.message || "Failed to delete"); }
  };

  const resetForm = () => {
    const sl = {};
    months.forEach(m => { sl[m] = { used: 0, total: 2 }; });
    setFormData({
      employeeEmail: "",
      year:          new Date().getFullYear() - 1,
      casualUsed:    0, casualTotal: 21,
      sickUsed:      0, sickTotal:   24,
      dutyUsed:      0,
      shortLeaveMonthlyDetails: sl,
      notes: "",
    });
  };

  const handleShortLeaveChange = (month, field, value) => {
    setFormData(prev => ({
      ...prev,
      shortLeaveMonthlyDetails: {
        ...prev.shortLeaveMonthlyDetails,
        [month]: { ...prev.shortLeaveMonthlyDetails[month], [field]: parseInt(value) || 0 },
      },
    }));
  };

  const exportToCSV = () => {
    if (!filteredEmployees.length) { setError("No data to export"); return; }
    const headers = ["Employee Email","Employee Name","Section","Year","Casual Used","Casual Total","Vacation Used","Vacation Total","Duty Used",...months.map(m=>m.substring(0,3)+" Short"),"Total Short","Notes"];
    const rows = filteredEmployees.map(emp => {
      const s = emp.historicalSummary || {};
      const d = emp.employeeDetails || {};
      const sl = s.shortLeaveMonthlyDetails || {};
      const totalShort = months.reduce((t,m) => t+(sl[m]?.used||0), 0);
      return [d.email||"",d.fullName||d.name||"",d.department||"",selectedYear,s.casualUsed||0,s.casualTotal||21,s.sickUsed||0,s.sickTotal||24,s.dutyUsed||0,...months.map(m=>`${sl[m]?.used||0}/${sl[m]?.total||2}`),totalShort,`"${s.notes||""}"`].join(",");
    });
    const blob = new Blob([[headers.join(","),...rows].join("\n")],{type:"text/csv;charset=utf-8;"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`Leave_Summary_${selectedYear}.csv`; a.click();
  };

  const exportSelectedEmployeesCSV = () => {
    if (!selectedEmployeesData.length) { setError("No selected employees data"); return; }
    const headers = ["Email","Name","Section","Year","Casual Used","Casual Total","Casual Remaining","Vacation Used","Vacation Total","Vacation Remaining","Duty Used",...months.map(m=>m.substring(0,3)+" Short"),"Total Short Used","Short Remaining","Notes"];
    const rows = selectedEmployeesData.filter(ed=>ed.data).map(ed => {
      const s = ed.data; const d = ed.employeeDetails||{}; const sl = s.shortLeaveMonthlyDetails||{};
      const tsu = months.reduce((t,m)=>t+(sl[m]?.used||0),0);
      const tsa = months.reduce((t,m)=>t+(sl[m]?.total||0),0);
      return [d.email||"",d.fullName||d.name||"",d.department||"",selectedYear,s.casualUsed||0,s.casualTotal||21,(s.casualTotal||21)-(s.casualUsed||0),s.sickUsed||0,s.sickTotal||24,(s.sickTotal||24)-(s.sickUsed||0),s.dutyUsed||0,...months.map(m=>`${sl[m]?.used||0}/${sl[m]?.total||2}`),tsu,tsa-tsu,`"${s.notes||""}"`].join(",");
    });
    const blob = new Blob([[headers.join(","),...rows].join("\n")],{type:"text/csv;charset=utf-8;"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`Selected_Leave_Summary_${selectedYear}.csv`; a.click();
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header-heading">
        <h3>Leave Records Management</h3>
        <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
          <button onClick={fetchSelectedEmployeesData} disabled={selectedEmployees.length===0||loadingSelectedSummary}
            style={{ background:"#17a2b8", color:"white", border:"none", padding:"4px 10px", borderRadius:"4px", cursor:selectedEmployees.length===0?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:"5px", opacity:selectedEmployees.length===0?0.5:1, fontSize:"13px" }}>
            <FaDownload /> EXPORT SELECTED ({selectedEmployees.length})
          </button>
          <button onClick={exportToCSV} disabled={!filteredEmployees.length}
            style={{ background:"#28a745", color:"white", border:"none", padding:"5px 10px", borderRadius:"4px", cursor:"pointer", display:"flex", alignItems:"center", gap:"5px", fontSize:"13px" }}>
            <FaDownload /> EXPORT ALL CSV
          </button>
        </div>
      </div>
      <div className="dashboard-paragraph"><p>Manage leave data for previous years</p></div>

      {/* Selection Status + Add Button */}
      <div style={{ background:"#f8f9fa", padding:"15px", borderRadius:"8px", marginBottom:"20px", border:"1px solid #e9ecef" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ color:"#17a2b8" }}>{selectedEmployees.length} EMPLOYEE(S) SELECTED</span>
          <button className="btn-add" onClick={()=>{resetForm();setEditingEmployee(null);setShowAddForm(true);}}
            style={{ background:"#28a745", display:"flex", alignItems:"center", gap:"5px", padding:"8px 15px" }}>
            <FaPlus /> Add Leave Records
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && <div style={{ background:"#d4edda", color:"#155724", padding:"15px", marginBottom:"20px", borderRadius:"4px", border:"1px solid #c3e6cb" }}>{successMessage}</div>}
      {error        && <div style={{ background:"#f8d7da", color:"#721c24", padding:"15px", marginBottom:"20px", borderRadius:"4px", border:"1px solid #f5c6cb" }}>{error}<button onClick={()=>setError(null)} style={{ float:"right", background:"none", border:"none", cursor:"pointer", fontWeight:"bold" }}>✕</button></div>}

      {/* Filters */}
      <div style={{ display:"flex", gap:"15px", marginBottom:"20px", alignItems:"center", background:"white", padding:"15px", borderRadius:"8px", border:"1px solid #e9ecef" }}>
        <div style={{ position:"relative", flex:1 }}>
          <FaSearch style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", color:"#666" }} />
          <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
            style={{ width:"100%", padding:"8px 8px 8px 35px", border:"2px solid #e9ecef", borderRadius:"4px", fontSize:"14px" }} />
        </div>
        <select value={departmentFilter} onChange={e=>setDepartmentFilter(e.target.value)}
          style={{ padding:"8px 12px", border:"2px solid #e9ecef", borderRadius:"4px", fontSize:"14px", minWidth:"150px" }}>
          <option value="">All Sections</option>
          {departments.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select value={selectedYear} onChange={e=>setSelectedYear(Number(e.target.value))}
          style={{ padding:"8px 12px", border:"2px solid #0056b3", borderRadius:"4px", fontSize:"14px", fontWeight:"bold", color:"#0056b3", minWidth:"100px" }}>
          {availableYears.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={()=>{setSearchTerm("");setDepartmentFilter("");setSelectedEmployees([]);}}
          style={{ background:"#6c757d", color:"white", border:"none", padding:"8px 15px", borderRadius:"4px", cursor:"pointer" }}>
          Reset
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"40px", color:"#666" }}>Loading...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th><input type="checkbox" onChange={e=>handleSelectAll(e.target.checked)} checked={selectedEmployees.length===filteredEmployees.length&&filteredEmployees.length>0} /></th>
                <th>Employee</th>
                <th>Section</th>
                <th>Year</th>
                <th>Casual Leave</th>
                <th>Vacation Leave</th>
                <th>Duty Leave</th>
                <th>Short Leave</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign:"center", padding:"30px", color:"#666" }}>No records found for {selectedYear}</td></tr>
              ) : filteredEmployees.map((emp, idx) => {
                const d   = emp.employeeDetails || {};
                const s   = emp.historicalSummary || {};
                const sl  = s.shortLeaveMonthlyDetails || {};
                const totalShort = months.reduce((t,m)=>t+(sl[m]?.used||0),0);
                const email = d.email || emp.email || "";
                const isSelected = selectedEmployees.includes(email);
                return (
                  <tr key={idx} style={{ background:isSelected?"#e8f4fd":"" }}>
                    <td><input type="checkbox" checked={isSelected} onChange={e=>handleEmployeeSelection(email,e.target.checked)} /></td>
                    <td>
                      <div style={{ fontWeight:"bold" }}>{d.fullName||d.name||"N/A"}</div>
                      <div style={{ fontSize:"12px", color:"#666" }}>{email}</div>
                    </td>
                    <td>{d.department||"N/A"}</td>
                    <td>
                      <span style={{ background:"#e3f2fd", color:"#1565c0", padding:"2px 8px", borderRadius:"12px", fontWeight:"700", fontSize:"13px" }}>
                        {s.year || selectedYear}
                      </span>
                    </td>
                    <td>
                      <span style={{ color:s.casualUsed>s.casualTotal?"#dc3545":"#28a745" }}>{s.casualUsed||0}/{s.casualTotal||21}</span>
                      <div style={{ fontSize:"11px", color:"#666" }}>({(s.casualTotal||21)-(s.casualUsed||0)} rem)</div>
                    </td>
                    <td>
                      <span style={{ color:s.sickUsed>s.sickTotal?"#dc3545":"#28a745" }}>{s.sickUsed||0}/{s.sickTotal||24}</span>
                      <div style={{ fontSize:"11px", color:"#666" }}>({(s.sickTotal||24)-(s.sickUsed||0)} rem)</div>
                    </td>
                    <td>{s.dutyUsed||0} <span style={{ fontSize:"11px", color:"#666" }}>(unlimited)</span></td>
                    <td>{totalShort}/{months.length*2} <span style={{ fontSize:"11px", color:"#666" }}>({months.length*2-totalShort} rem)</span></td>
                    <td>
                      <div style={{ display:"flex", gap:"5px" }}>
                        <button onClick={()=>handleEdit(emp)} title="Edit" style={{ background:"#007bff", color:"white", border:"none", padding:"4px 8px", borderRadius:"4px", cursor:"pointer" }}><FaEdit /></button>
                        <button onClick={()=>showEmployeeHistoryModal(emp)} title="History" style={{ background:"#17a2b8", color:"white", border:"none", padding:"4px 8px", borderRadius:"4px", cursor:"pointer" }}><FaHistory /></button>
                        <button onClick={()=>handleDelete(email, s.year||selectedYear)} title="Delete" style={{ background:"#dc3545", color:"white", border:"none", padding:"4px 8px", borderRadius:"4px", cursor:"pointer" }}><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ADD / EDIT FORM MODAL
      ═══════════════════════════════════════════════════════ */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ width:"750px", maxWidth:"95vw", maxHeight:"90vh", overflowY:"auto" }}>
            <div className="modal-header" style={{ background:"linear-gradient(135deg,#0056b3,#007bff)" }}>
              <h3 style={{ color:"white", margin:0 }}>
                {editingEmployee ? "✏️ Edit Leave Records" : "➕ Add Leave Records"}
              </h3>
              <button className="btn-close" onClick={()=>{setShowAddForm(false);setEditingEmployee(null);resetForm();}}>✖</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding:"24px" }}>

              {/* ── Row 1: Employee + Year ── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"20px" }}>

                {/* Employee Email */}
                <div>
                  <label style={{ display:"block", fontWeight:"bold", marginBottom:"6px" }}>
                    Employee Email <span style={{ color:"red" }}>*</span>
                  </label>
                  {editingEmployee ? (
                    <input type="text" value={formData.employeeEmail} readOnly
                      style={{ width:"100%", padding:"8px", border:"1px solid #ccc", borderRadius:"4px", background:"#f8f9fa", color:"#555" }} />
                  ) : (
                    <select value={formData.employeeEmail} onChange={e=>setFormData(p=>({...p,employeeEmail:e.target.value}))}
                      style={{ width:"100%", padding:"8px", border:"2px solid #e9ecef", borderRadius:"4px" }} required>
                      <option value="">— Select Employee —</option>
                      {allEmployees.map(emp=>(
                        <option key={emp.email} value={emp.email}>{emp.fullName||emp.name} ({emp.email})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* ── YEAR SELECTOR — KEY FIX ── */}
                <div>
                  <label style={{ display:"block", fontWeight:"bold", marginBottom:"6px" }}>
                    Year <span style={{ color:"red" }}>*</span>
                    <span style={{ fontWeight:"normal", fontSize:"12px", color:"#e65100", marginLeft:"8px" }}>
                      ← Select the year you are adding records for
                    </span>
                  </label>
                  <select
                    value={formData.year}
                    onChange={e => setFormData(p => ({ ...p, year: Number(e.target.value) }))}
                    style={{ width:"100%", padding:"8px", border:"2px solid #0056b3", borderRadius:"4px",
                      fontWeight:"bold", color:"#0056b3", fontSize:"15px" }}
                    required>
                    {formYearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <div style={{ marginTop:"4px", fontSize:"11px", color:"#888" }}>
                    Currently adding records for: <strong style={{ color:"#0056b3", fontSize:"13px" }}>{formData.year}</strong>
                  </div>
                </div>
              </div>

              {/* ── Year confirmation banner ── */}
              <div style={{ background:"#e3f2fd", border:"1px solid #90caf9", borderRadius:"8px",
                padding:"10px 14px", marginBottom:"20px", fontSize:"13px", color:"#1565c0",
                display:"flex", alignItems:"center", gap:"8px" }}>
                📅 <span>You are adding/editing leave records for year <strong>{formData.year}</strong>. This will update the <strong>{formData.year}</strong> leave entitlement.</span>
              </div>

              {/* ── Leave type cards ── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px", marginBottom:"20px" }}>

                {/* Casual Leave */}
                <div style={{ border:"1px solid #e9ecef", borderRadius:"8px", padding:"16px" }}>
                  <h4 style={{ color:"#007bff", marginTop:0, marginBottom:"12px" }}>Casual Leave</h4>
                  <label style={{ display:"block", marginBottom:"4px", fontSize:"13px" }}>Used Days:</label>
                  <input type="number" min="0" step="0.5" value={formData.casualUsed}
                    onChange={e=>setFormData(p=>({...p,casualUsed:Number(e.target.value)}))}
                    style={{ width:"100%", padding:"6px", border:"1px solid #ccc", borderRadius:"4px", marginBottom:"8px" }} />
                  <label style={{ display:"block", marginBottom:"4px", fontSize:"13px" }}>Total Days:</label>
                  <input type="number" min="0" step="0.5" value={formData.casualTotal}
                    onChange={e=>setFormData(p=>({...p,casualTotal:Number(e.target.value)}))}
                    style={{ width:"100%", padding:"6px", border:"1px solid #ccc", borderRadius:"4px" }} />
                </div>

                {/* Vacation Leave */}
                <div style={{ border:"1px solid #e9ecef", borderRadius:"8px", padding:"16px" }}>
                  <h4 style={{ color:"#28a745", marginTop:0, marginBottom:"12px" }}>Vacation Leave</h4>
                  <label style={{ display:"block", marginBottom:"4px", fontSize:"13px" }}>Used Days:</label>
                  <input type="number" min="0" step="0.5" value={formData.sickUsed}
                    onChange={e=>setFormData(p=>({...p,sickUsed:Number(e.target.value)}))}
                    style={{ width:"100%", padding:"6px", border:"1px solid #ccc", borderRadius:"4px", marginBottom:"8px" }} />
                  <label style={{ display:"block", marginBottom:"4px", fontSize:"13px" }}>Total Days:</label>
                  <input type="number" min="0" step="0.5" value={formData.sickTotal}
                    onChange={e=>setFormData(p=>({...p,sickTotal:Number(e.target.value)}))}
                    style={{ width:"100%", padding:"6px", border:"1px solid #ccc", borderRadius:"4px" }} />
                </div>

                {/* Duty Leave */}
                <div style={{ border:"1px solid #e9ecef", borderRadius:"8px", padding:"16px" }}>
                  <h4 style={{ color:"#dc3545", marginTop:0, marginBottom:"12px" }}>Duty Leave</h4>
                  <label style={{ display:"block", marginBottom:"4px", fontSize:"13px" }}>Used Days:</label>
                  <input type="number" min="0" step="0.5" value={formData.dutyUsed}
                    onChange={e=>setFormData(p=>({...p,dutyUsed:Number(e.target.value)}))}
                    style={{ width:"100%", padding:"6px", border:"1px solid #ccc", borderRadius:"4px" }} />
                  <p style={{ fontSize:"11px", color:"#888", marginTop:"6px" }}>(Unlimited entitlement)</p>
                </div>
              </div>

              {/* ── Short Leave Monthly ── */}
              <div style={{ marginBottom:"20px" }}>
                <h4 style={{ color:"#6f42c1", marginBottom:"12px" }}>Short Leave Monthly Details</h4>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px" }}>
                  {months.map(month => (
                    <div key={month} style={{ border:"1px solid #e9ecef", borderRadius:"6px", padding:"10px" }}>
                      <div style={{ fontWeight:"bold", marginBottom:"6px", fontSize:"13px" }}>{month}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                        <input type="number" min="0"
                          value={formData.shortLeaveMonthlyDetails[month]?.used ?? 0}
                          onChange={e=>handleShortLeaveChange(month,"used",e.target.value)}
                          style={{ width:"45px", padding:"4px", border:"1px solid #ccc", borderRadius:"4px", fontSize:"12px" }} />
                        <span style={{ color:"#888" }}>/</span>
                        <input type="number" min="0"
                          value={formData.shortLeaveMonthlyDetails[month]?.total ?? 2}
                          onChange={e=>handleShortLeaveChange(month,"total",e.target.value)}
                          style={{ width:"45px", padding:"4px", border:"1px solid #ccc", borderRadius:"4px", fontSize:"12px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Notes ── */}
              <div style={{ marginBottom:"20px" }}>
                <label style={{ display:"block", fontWeight:"bold", marginBottom:"6px" }}>Notes</label>
                <textarea rows="3" value={formData.notes} onChange={e=>setFormData(p=>({...p,notes:e.target.value}))}
                  placeholder="Optional notes..."
                  style={{ width:"100%", padding:"8px", border:"1px solid #ccc", borderRadius:"4px", resize:"vertical" }} />
              </div>

              {/* ── Submit ── */}
              <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px" }}>
                <button type="button" onClick={()=>{setShowAddForm(false);setEditingEmployee(null);resetForm();}}
                  style={{ padding:"8px 20px", border:"1px solid #ccc", background:"white", borderRadius:"4px", cursor:"pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  style={{ padding:"8px 20px", background:"#0056b3", color:"white", border:"none", borderRadius:"4px", cursor:"pointer", display:"flex", alignItems:"center", gap:"6px", opacity:loading?0.7:1 }}>
                  <FaSave /> {loading ? "Saving..." : `Save Records for ${formData.year}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          EMPLOYEE HISTORY MODAL
      ═══════════════════════════════════════════════════════ */}
      {showEmployeeHistory && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal" style={{ width:"800px", maxWidth:"95vw", maxHeight:"90vh", overflowY:"auto" }}>
            <div className="modal-header">
              <h3 style={{ color:"white", margin:0 }}>
                <FaHistory style={{ marginRight:"8px" }} />
                {selectedEmployee.fullName||selectedEmployee.name} — All Years History
              </h3>
              <button className="btn-close" onClick={()=>{setShowEmployeeHistory(false);setEmployeeHistoryData([]);}}>✖</button>
            </div>
            <div style={{ padding:"20px" }}>
              {loadingHistory ? (
                <div style={{ textAlign:"center", padding:"30px" }}>Loading...</div>
              ) : employeeHistoryData.length === 0 ? (
                <div style={{ textAlign:"center", padding:"30px", color:"#666" }}>No history found</div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Year</th><th>Casual</th><th>Vacation</th><th>Duty</th><th>Short Leave</th><th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeHistoryData.sort((a,b)=>b.year-a.year).map((h,i)=>{
                        const sl=h.shortLeaveMonthlyDetails||{};
                        const totalShort=months.reduce((t,m)=>t+(sl[m]?.used||0),0);
                        return (
                          <tr key={i}>
                            <td><span style={{ background:"#e3f2fd", color:"#1565c0", padding:"2px 10px", borderRadius:"12px", fontWeight:"700" }}>{h.year}</span></td>
                            <td>{h.casualUsed||0}/{h.casualTotal||21} <span style={{ fontSize:"11px", color:"#666" }}>({(h.casualTotal||21)-(h.casualUsed||0)} rem)</span></td>
                            <td>{h.sickUsed||0}/{h.sickTotal||24} <span style={{ fontSize:"11px", color:"#666" }}>({(h.sickTotal||24)-(h.sickUsed||0)} rem)</span></td>
                            <td>{h.dutyUsed||0}</td>
                            <td>{totalShort}/{months.length*2}</td>
                            <td style={{ fontSize:"12px", color:"#666" }}>{h.notes||"—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SELECTED EMPLOYEES SUMMARY MODAL
      ═══════════════════════════════════════════════════════ */}
      {showSelectedSummary && (
        <div className="modal-overlay">
          <div className="modal" style={{ width:"95%", maxWidth:"1400px", maxHeight:"90vh" }}>
            <div className="modal-header">
              <h3 style={{ color:"white", margin:0 }}>
                <FaUser style={{ marginRight:"10px" }} />
                Selected Employees Leave Summary — {selectedYear}
              </h3>
              <button className="btn-close" onClick={()=>{setShowSelectedSummary(false);setSelectedEmployeesData([]);}}>✖</button>
            </div>
            <div style={{ padding:"20px", overflowY:"auto" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", background:"#f8f9fa", padding:"15px", borderRadius:"8px" }}>
                <div>
                  <h4 style={{ margin:"0 0 4px 0", color:"#0056b3" }}>{selectedEmployeesData.length} Selected Employees</h4>
                  <p style={{ margin:0, color:"#666" }}>Leave summary for {selectedYear}</p>
                </div>
                <button onClick={exportSelectedEmployeesCSV}
                  style={{ background:"#17a2b8", color:"white", border:"none", padding:"10px 15px", borderRadius:"4px", cursor:"pointer", display:"flex", alignItems:"center", gap:"5px" }}>
                  <FaDownload /> Export CSV
                </button>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th><th>Section</th><th>Casual Leave</th><th>Vacation Leave</th><th>Duty Leave</th><th>Short Leave</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployeesData.map((ed, i) => {
                      if (!ed.data) return (
                        <tr key={i}>
                          <td><div style={{ fontWeight:"bold" }}>{ed.employeeDetails?.fullName||ed.employeeDetails?.name||"N/A"}</div><div style={{ fontSize:"12px", color:"#666" }}>{ed.email}</div></td>
                          <td>{ed.employeeDetails?.department||"N/A"}</td>
                          <td colSpan="4" style={{ textAlign:"center", color:"#dc3545" }}>No data for {selectedYear}</td>
                        </tr>
                      );
                      const s=ed.data; const sl=s.shortLeaveMonthlyDetails||{};
                      const tsu=months.reduce((t,m)=>t+(sl[m]?.used||0),0);
                      return (
                        <tr key={i}>
                          <td><div style={{ fontWeight:"bold" }}>{ed.employeeDetails?.fullName||ed.employeeDetails?.name||"N/A"}</div><div style={{ fontSize:"12px", color:"#666" }}>{ed.email}</div></td>
                          <td>{ed.employeeDetails?.department||"N/A"}</td>
                          <td><span style={{ color:s.casualUsed>s.casualTotal?"#dc3545":"#28a745" }}>{s.casualUsed||0}/{s.casualTotal||21}</span><div style={{ fontSize:"11px", color:"#666" }}>({(s.casualTotal||21)-(s.casualUsed||0)} rem)</div></td>
                          <td><span style={{ color:s.sickUsed>s.sickTotal?"#dc3545":"#28a745" }}>{s.sickUsed||0}/{s.sickTotal||24}</span><div style={{ fontSize:"11px", color:"#666" }}>({(s.sickTotal||24)-(s.sickUsed||0)} rem)</div></td>
                          <td>{s.dutyUsed||0}</td>
                          <td>{tsu}/{months.length*2} <span style={{ fontSize:"11px", color:"#666" }}>({months.length*2-tsu} rem)</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeaveHistorySummary;