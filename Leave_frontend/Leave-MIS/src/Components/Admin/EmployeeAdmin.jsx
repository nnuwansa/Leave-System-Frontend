import React, { useEffect, useState, useCallback } from "react";
import API from "../../API/axios";
import AddEmployee from "./AdminAddEmployee";
import "../CSS/Admin.css";
import { FaEllipsisH, FaCheckCircle, FaTimesCircle, FaTimes, FaTrashAlt } from "react-icons/fa";

// ── Toast Notification ────────────────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div style={{
      position: "fixed", top: "20px", right: "20px", zIndex: 9999,
      display: "flex", flexDirection: "column", gap: "10px", pointerEvents: "none",
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          pointerEvents: "all",
          display: "flex", alignItems: "flex-start", gap: "12px",
          backgroundColor: t.type === "success" ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${t.type === "success" ? "#86efac" : "#fca5a5"}`,
          borderLeft: `4px solid ${t.type === "success" ? "#22c55e" : "#ef4444"}`,
          borderRadius: "8px", padding: "14px 16px",
          minWidth: "280px", maxWidth: "380px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
          animation: "toastSlide 0.25s ease",
        }}>
          <span style={{ fontSize: "18px", marginTop: "1px", flexShrink: 0 }}>
            {t.type === "success"
              ? <FaCheckCircle style={{ color: "#22c55e" }} />
              : <FaTimesCircle style={{ color: "#ef4444" }} />}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "700", fontSize: "13px", color: t.type === "success" ? "#166534" : "#991b1b" }}>
              {t.type === "success" ? "Success" : "Error"}
            </div>
            <div style={{ fontSize: "13px", color: "#374151", marginTop: "2px", lineHeight: "1.5" }}>
              {t.message}
            </div>
          </div>
          <button onClick={() => removeToast(t.id)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, flexShrink: 0 }}>
            <FaTimes />
          </button>
        </div>
      ))}
      <style>{`@keyframes toastSlide { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        backgroundColor: "#fff", borderRadius: "12px", padding: "28px 32px",
        maxWidth: "380px", width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🗑️</div>
        <h3 style={{ margin: "0 0 10px", fontSize: "17px", color: "#111827" }}>Confirm Delete</h3>
        <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#6b7280", lineHeight: "1.5" }}>{message}</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button onClick={onCancel} style={{
            padding: "9px 24px", borderRadius: "6px", border: "1px solid #d1d5db",
            backgroundColor: "#f9fafb", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#374151",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: "9px 24px", borderRadius: "6px", border: "none",
            backgroundColor: "#ef4444", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#fff",
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeAdmin() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // { email, onConfirm }

  const [departmentsFromDB, setDepartmentsFromDB] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const API_BASE = "/admin/users";

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get(API_BASE);
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error("❌ Fetch users error:", err.response?.data || err.message);
      showToast("Failed to fetch users", "error");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await API.get("/departments");
      setDepartmentsFromDB(res.data);
    } catch (err) {
      console.error("❌ Fetch departments error:", err.response?.data || err.message);
    }
  };

  useEffect(() => { fetchUsers(); fetchDepartments(); }, []);

  useEffect(() => {
    let data = [...users];
    if (emailSearch) data = data.filter((u) => u.email?.toLowerCase().includes(emailSearch.toLowerCase()));
    if (departmentFilter) data = data.filter((u) => u.department?.toLowerCase() === departmentFilter.toLowerCase());
    if (roleFilter) data = data.filter((u) => u.roles?.some((r) => r.toLowerCase() === roleFilter.toLowerCase()));
    if (designationFilter) data = data.filter((u) => u.designation?.toLowerCase() === designationFilter.toLowerCase());
    setFilteredUsers(data);
    setCurrentPage(1);
  }, [emailSearch, departmentFilter, roleFilter, designationFilter, users]);

  const deleteUser = async (email) => {
    setConfirmDelete({
      email,
      message: `Are you sure you want to delete user "${email}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDelete(null);
        try {
          await API.delete(`${API_BASE}/${email}`);
          showToast("User deleted successfully", "success");
          fetchUsers();
        } catch (err) {
          console.error("❌ Delete error:", err.response?.data || err.message);
          showToast("Failed to delete user", "error");
        }
      },
    });
  };

  const departments = [...new Set(users.map((u) => u.department).filter(Boolean))];
  const roles = [...new Set(users.flatMap((u) => u.roles || []))];
  const designations = [...new Set(users.map((u) => u.designation).filter(Boolean))];

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredUsers.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  // ── EditEmployee ────────────────────────────────────────────────────────────
  const EditEmployee = ({ user, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ ...user, otherDepartments: user.otherDepartments || [] });
    const [newEmail, setNewEmail] = useState(user.email || "");
    const [emailChanged, setEmailChanged] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleEmailChange = (e) => {
      setNewEmail(e.target.value);
      setEmailChanged(e.target.value !== user.email);
    };

    const handleDepartmentChange = (e) => {
      const newPrimary = e.target.value;
      setFormData({
        ...formData, department: newPrimary,
        otherDepartments: (formData.otherDepartments || []).filter((d) => d !== newPrimary),
      });
    };

    const handleOtherDeptToggle = (deptName) => {
      const current = formData.otherDepartments || [];
      const updated = current.includes(deptName) ? current.filter((d) => d !== deptName) : [...current, deptName];
      setFormData({ ...formData, otherDepartments: updated });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
        await API.put(`/admin/users/${user.email}`, { ...formData, email: user.email });
        if (emailChanged && newEmail && newEmail !== user.email) {
          await API.put(`/admin/users/${user.email}/change-email`, { newEmail });
          showToast(`Employee updated. Email changed to: ${newEmail}`, "success");
        } else {
          showToast("Employee updated successfully", "success");
        }
        onSuccess();
      } catch (err) {
        console.error("❌ Update error:", err.response?.data || err.message);
        showToast("Failed to update employee: " + (err.response?.data || err.message), "error");
      } finally {
        setSaving(false);
      }
    };

    const availableForOther = departmentsFromDB.filter((dept) => dept.name !== formData.department);

    return (
      <form onSubmit={handleSubmit} className="edit-employee-form">
        <label>
          Email:
          <input name="email" value={newEmail} onChange={handleEmailChange} type="email"
            style={{ border: emailChanged ? "2px solid #f59e0b" : "", backgroundColor: emailChanged ? "#fffbeb" : "" }} />
          {emailChanged && (
            <small style={{ color: "#d97706", fontSize: "11px", display: "block", marginTop: "3px" }}>
              ⚠️ Email will be changed from <strong>{user.email}</strong> to <strong>{newEmail}</strong>
            </small>
          )}
        </label>

        <label>Name: <input name="name" value={formData.name || ""} onChange={handleChange} /></label>

        <label>
          Password:
          <input name="password" value={formData.password || ""} onChange={handleChange}
            type="password" placeholder="Leave blank to keep current password" />
        </label>

        <label>
          Roles (comma separated):
          <input name="roles" value={formData.roles?.join(", ") || ""}
            onChange={(e) => setFormData({ ...formData, roles: e.target.value.split(",").map((r) => r.trim()) })} />
        </label>

        <label>Full Name: <input name="fullName" value={formData.fullName || ""} onChange={handleChange} /></label>

        <label>
          Section:
          <select name="department" value={formData.department || ""} onChange={handleDepartmentChange}>
            <option value="">Select Department</option>
            {departmentsFromDB.map((dept) => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
          </select>
        </label>

        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
            Other Sections
            <span style={{ fontWeight: "normal", color: "#888", fontSize: "12px", marginLeft: "8px" }}>
              (this employee can act as officer for these sections too)
            </span>
          </div>
          {!formData.department ? (
            <p style={{ color: "#aaa", fontSize: "13px", margin: "6px 0 0" }}>Select a primary section first.</p>
          ) : availableForOther.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: "13px", margin: "6px 0 0" }}>No other sections available.</p>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: "6px", padding: "10px", border: "1px solid #ddd", borderRadius: "6px",
              backgroundColor: "#f8f9fa", maxHeight: "190px", overflowY: "auto",
            }}>
              {availableForOther.map((dept) => {
                const isChecked = (formData.otherDepartments || []).includes(dept.name);
                return (
                  <label key={dept.id} style={{
                    display: "flex", alignItems: "center", gap: "8px", fontSize: "13px",
                    cursor: "pointer", padding: "5px 8px", borderRadius: "4px", fontWeight: "normal",
                    backgroundColor: isChecked ? "#e3f2fd" : "transparent",
                    border: isChecked ? "1px solid #90caf9" : "1px solid transparent",
                    transition: "all 0.15s ease",
                  }}>
                    <input type="checkbox" checked={isChecked} onChange={() => handleOtherDeptToggle(dept.name)}
                      style={{ cursor: "pointer", accentColor: "#1976d2" }} />
                    {dept.name}
                  </label>
                );
              })}
            </div>
          )}
          {(formData.otherDepartments || []).length > 0 && (
            <div style={{
              marginTop: "8px", fontSize: "12px", color: "#1565c0",
              backgroundColor: "#e3f2fd", padding: "6px 10px", borderRadius: "4px", border: "1px solid #90caf9",
            }}>
              ✓ {formData.otherDepartments.length} department{formData.otherDepartments.length !== 1 ? "s" : ""} selected: {formData.otherDepartments.join(", ")}
            </div>
          )}
        </div>

        <label>Designation: <input name="designation" value={formData.designation || ""} onChange={handleChange} /></label>
        <label>Join Date: <input type="date" name="joinDate" value={formData.joinDate || ""} onChange={handleChange} /></label>
        <label>Phone Number: <input name="phoneNumber" value={formData.phoneNumber || ""} onChange={handleChange} /></label>
        <label>Address: <input name="address" value={formData.address || ""} onChange={handleChange} /></label>
        <label>Date of Birth: <input type="date" name="dateOfBirth" value={formData.dateOfBirth || ""} onChange={handleChange} /></label>

        <label>
          Gender:
          <select name="gender" value={formData.gender || ""} onChange={handleChange}>
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label>
          Marital Status:
          <select name="maritalStatus" value={formData.maritalStatus || ""} onChange={handleChange}>
            <option value="">Select Marital Status</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
          </select>
        </label>

        <label>Employment Type: <input name="employmentType" value={formData.employmentType || ""} onChange={handleChange} /></label>
        <label>National ID: <input name="nationalId" value={formData.nationalId || ""} onChange={handleChange} /></label>
        <label>Emergency Contact: <input name="emergencyContact" value={formData.emergencyContact || ""} onChange={handleChange} /></label>

        <div className="edit-actions">
          <button type="button" onClick={onClose} className="btn-cancel" disabled={saving}>Cancel</button>
          <button type="submit" className="btn-save" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" className="btn-delete" disabled={saving}
            onClick={() => { deleteUser(user.email); onClose(); }}>
            Delete
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="dashboard">
      {/* Toast Notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          message={confirmDelete.message}
          onConfirm={confirmDelete.onConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="header-heading"><h3>Employee Management</h3></div>
      <div className="dashboard-paragraph"><p>Manage your team members and their account permissions here.</p></div>

      <div className="filters">
        <input type="text" placeholder="🔍 Search by email..." value={emailSearch}
          onChange={(e) => setEmailSearch(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", minWidth: "220px" }} />

        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
          <option value="">All Sections</option>
          {departments.map((dep) => <option key={dep} value={dep}>{dep}</option>)}
        </select>

        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>

        <select value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value)}>
          <option value="">All Designations</option>
          {designations.map((des) => <option key={des} value={des}>{des}</option>)}
        </select>

        <button className="btn-reset" onClick={() => { setEmailSearch(""); setDepartmentFilter(""); setRoleFilter(""); setDesignationFilter(""); }}>
          Reset
        </button>
      </div>

      <div className="add-employee">
        <button className="btn-add" onClick={() => setIsAdding(true)}>Add Employee</button>
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>Email</th><th>Name</th><th>Full Name</th><th>Section</th>
            <th>Designation</th><th>Join Date</th><th>Roles</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentRows.length > 0 ? currentRows.map((user) => (
            <tr key={user.email}>
              <td>{user.email}</td>
              <td>{user.name}</td>
              <td>{user.fullName}</td>
              <td>{user.department}</td>
              <td>{user.designation}</td>
              <td>{user.joinDate}</td>
              <td>{user.roles?.join(", ")}</td>
              <td className="actions-cell">
                <FaEllipsisH className="icon-btn update-icon" onClick={() => setSelectedUser(user)} title="Update Employee" />
              </td>
            </tr>
          )) : (
            <tr><td colSpan="8" className="no-users">No users found</td></tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        <label>
          Rows per page:{" "}
          <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
        </label>
        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
      </div>

      {isAdding && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <button className="btn-close" onClick={() => setIsAdding(false)}>✖</button>
            </div>
            <AddEmployee onSuccess={() => { fetchUsers(); setIsAdding(false); showToast("Employee added successfully", "success"); }} departments={departmentsFromDB} />
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <button className="btn-close" onClick={() => setSelectedUser(null)}>✖</button>
            </div>
            <EditEmployee user={selectedUser} onClose={() => setSelectedUser(null)}
              onSuccess={() => { fetchUsers(); setSelectedUser(null); }} />
          </div>
        </div>
      )}
    </div>
  );
}