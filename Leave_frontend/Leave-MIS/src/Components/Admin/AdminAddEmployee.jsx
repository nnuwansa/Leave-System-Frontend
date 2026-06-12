import { useState, useEffect } from "react";
import API from "../../API/axios";
import "../CSS/Admin.css";

export default function AdminAddEmployee({ onSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    fullName: "",
    department: "",
    otherDepartments: [],  
    designation: "",
    joinDate: "",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    employmentType: "",
    nationalId: "",
    emergencyContact: "",
  });

  const [designations, setDesignations] = useState([]);
  const [newDesignation, setNewDesignation] = useState("");

  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    try {
      const res = await API.get("/designations");
      setDesignations(res.data);
    } catch (err) {
      console.error("Error Fetching Designations", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await API.get("/departments");
      setDepartments(res.data);
    } catch (err) {
      console.error("Error Fetching Departments", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // When primary dept changes, remove it from otherDepartments if already selected there
  const handlePrimaryDeptChange = (e) => {
    const newPrimary = e.target.value;
    setFormData((prev) => ({
      ...prev,
      department: newPrimary,
      otherDepartments: prev.otherDepartments.filter((d) => d !== newPrimary),
    }));
  };

  // Chips list = all departments except the selected primary
  
  // const otherDeptOptions = departments.filter(
  //   (d) => d.name && d.name !== formData.department
  // );

const otherDeptOptions = departments.filter((d) => d.name);


  // Toggle a department chip on/off in otherDepartments
  const toggleOtherDepartment = (deptName) => {
    setFormData((prev) => {
      const already = prev.otherDepartments.includes(deptName);
      return {
        ...prev,
        otherDepartments: already
          ? prev.otherDepartments.filter((d) => d !== deptName)
          : [...prev.otherDepartments, deptName],
      };
    });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!formData.email || !formData.name || !formData.password) {
      setError("⚠️ Email, Name, and Password are required!");
      return;
    }

    try {
      const roles = ["EMPLOYEE"];
      const res = await API.post("/auth/register", { ...formData, roles });
      if (res.status === 200) {
        setMessage("✅ Employee Added Successfully!");
        setFormData({
          email: "",
          name: "",
          password: "",
          fullName: "",
          department: "",
          otherDepartments: [],
          designation: "",
          joinDate: "",
          phoneNumber: "",
          address: "",
          dateOfBirth: "",
          gender: "",
          maritalStatus: "",
          employmentType: "",
          nationalId: "",
          emergencyContact: "",
        });

        if (onSuccess) onSuccess();
      }
    } catch (err) {
      if (err.response && err.response.data) setError(err.response.data);
      else setError("❌ Error Adding Employee");
    }
  };

  const handleAddDesignation = async () => {
    if (!newDesignation) return;
    try {
      await API.post("/designations", { name: newDesignation });
      fetchDesignations();
      setFormData((prev) => ({ ...prev, designation: newDesignation }));
      setNewDesignation("");
    } catch (err) {
      console.error(err);
      alert("❌ Error Adding Designation");
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartment) return;
    try {
      await API.post("/departments", { name: newDepartment });
      fetchDepartments();
      setFormData((prev) => ({ ...prev, department: newDepartment }));
      setNewDepartment("");
    } catch (err) {
      console.error(err);
      alert("❌ Error Adding Department");
    }
  };



  return (
    <div className="add-employee-page">
      <div className="form-header">
        <h6>Add Employee</h6>
      </div>

      <form onSubmit={handleAddEmployee} className="add-employee-form">
        {message && <div className="message success">{message}</div>}
        {error && <div className="message error">{error}</div>}

        <div className="form-row">
          <input
            type="email"
            name="email"
            placeholder="Employee Email"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="text"
            name="name"
            placeholder="Employee Username"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          {/* ── Primary Department (unchanged behaviour) ── */}
          <select
            name="Section"
            value={formData.department}
            onChange={handlePrimaryDeptChange}   // ← changed from handleChange
          >
            <option value="">Select Section</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Add New Section"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
          />
          <button type="button" onClick={handleAddDepartment}>
            ➕ Add
          </button>

          <select
            name="designation"
            value={formData.designation}
            onChange={handleChange}
          >
            <option value="">Select Designation</option>
            {designations.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Add New Designation"
            value={newDesignation}
            onChange={(e) => setNewDesignation(e.target.value)}
          />
          <button type="button" onClick={handleAddDesignation}>
            ➕ Add
          </button>
        </div>

        {/* ── Other Departments multi-select chips ── */}
        <div className="other-dept-section">
          <div className="other-dept-header">
            <span className="other-dept-title">Other Sections</span>
            <span className="other-dept-hint">
              Select additional sections this employee can act as an officer for
            </span>
          </div>

          {!formData.department ? (
            <p className="other-dept-empty">
              Select a primary section first, then choose additional sections here.
            </p>
          ) : otherDeptOptions.length === 0 ? (
            <p className="other-dept-empty">No other sections available.</p>
          ) : (
            <div className="other-dept-chips">
              {otherDeptOptions.map((dept) => {
                const isSelected = formData.otherDepartments.includes(dept.name);
                return (
                  <button
                    key={dept.id || dept.name}
                    type="button"
                    className={`dept-chip ${isSelected ? "dept-chip--selected" : ""}`}
                    onClick={() => toggleOtherDepartment(dept.name)}
                  >
                    <span className="chip-icon">{isSelected ? "✓" : "+"}</span>
                    {dept.name}
                  </button>
                );
              })}
            </div>
          )}

          {formData.otherDepartments.length > 0 && (
            <div className="other-dept-summary">
              <strong>Selected:</strong> {formData.otherDepartments.join(", ")}
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="date-input-wrapper">
            <input
              type="date"
              name="joinDate"
              value={formData.joinDate}
              onChange={handleChange}
            />
            {!formData.joinDate && (
              <span className="date-placeholder">Join Date (MM/DD/YYYY)</span>
            )}
          </div>
          <input
            type="text"
            name="phoneNumber"
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
          />
          <div className="date-input-wrapper">
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
            {!formData.dateOfBirth && (
              <span className="date-placeholder">
                Date of Birth (MM/DD/YYYY)
              </span>
            )}
          </div>
        </div>

        <div className="form-row">
          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
          >
            <option value="">Marital Status</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
          </select>
        </div>

        <div className="form-row">
          <input
            type="text"
            name="employmentType"
            placeholder="Employment Type"
            value={formData.employmentType}
            onChange={handleChange}
          />
          <input
            type="text"
            name="nationalId"
            placeholder="National ID"
            value={formData.nationalId}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <input
            type="text"
            name="emergencyContact"
            placeholder="Emergency Contact"
            value={formData.emergencyContact}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <button type="submit">Add Employee</button>
        </div>
      </form>

      {/* ── Styles for the other-departments section ── */}
      <style>{`
        .other-dept-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 4px 0 8px 0;
        }
        .other-dept-header {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .other-dept-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #374151;
          letter-spacing: 0.3px;
        }
        .other-dept-hint {
          font-size: 0.72rem;
          color: #6b7280;
        }
        .other-dept-empty {
          font-size: 0.78rem;
          color: #9ca3af;
          font-style: italic;
          padding: 8px 12px;
          background: #f9fafb;
          border: 1px dashed #d1d5db;
          border-radius: 6px;
          margin: 0;
        }
        .other-dept-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
          max-height: 130px;
          overflow-y: auto;
        }
        .dept-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 20px;
          border: 1.5px solid #d1d5db;
          background: #ffffff;
          color: #374151;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
        }
        .dept-chip:hover {
          border-color: #7c3aed;
          color: #7c3aed;
          background: #f5f3ff;
        }
        .dept-chip--selected {
          background: #7c3aed;
          border-color: #7c3aed;
          color: #ffffff;
        }
        .dept-chip--selected:hover {
          background: #6d28d9;
          border-color: #6d28d9;
          color: #ffffff;
        }
        .chip-icon {
          font-size: 0.72rem;
          font-weight: 800;
          line-height: 1;
        }
        .other-dept-summary {
          font-size: 0.75rem;
          color: #6b7280;
          padding: 5px 10px;
          background: #f3e8ff;
          border-radius: 6px;
        }
        .other-dept-summary strong {
          color: #7c3aed;
        }
      `}</style>
    </div>
  );
}