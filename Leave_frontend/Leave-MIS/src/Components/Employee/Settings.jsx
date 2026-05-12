import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Edit2,
  Save,
  X,
} from "lucide-react";
import Navbar from "../Navbar/Navbar";
import EmployeeSidebar from "../Navbar/EmployeeSidebar";
import EmployeeDashboard from "./EmployeeDashboard";
import API from "../../utils/apiUtils";
import "../CSS/EmployeeDashboard.css";

const Settings = ({ user, showMessage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [activeSection, setActiveSection] = useState("profile");
  const [currentUser, setCurrentUser] = useState(user || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const email =
    localStorage?.getItem("email") ||
    localStorage?.getItem("userEmail") ||
    null;
  const token = localStorage?.getItem("token") || null;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (token && email) fetchCurrentUser();
  }, [token, email]);

  useEffect(() => {
    setCurrentUser(user || null);
  }, [user]);

  const fetchCurrentUser = async () => {
    if (!email) return;
    try {
      setLoading(true);
      let userData;
      try {
        userData = await API.get(`/admin/users/${email}`);
      } catch {
        userData = await API.get(`/employee/me`);
      }
      setCurrentUser(userData);
    } catch (err) {
      if (showMessage) showMessage("Failed to fetch user data.", true);
    } finally {
      setLoading(false);
    }
  };

  // ── Field definitions ────────────────────────────────────────────────────

  // Admin-only: cannot be changed by employee
  const adminOnlyFields = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "department", label: "Section" },
    { key: "designation", label: "Designation" },
  ];

  // Employee-editable fields
  const editableFields = [
    { key: "fullName", label: "Full Name", type: "text" },
    { key: "phoneNumber", label: "Phone Number", type: "tel" },
    { key: "address", label: "Address", type: "text" },
    { key: "dateOfBirth", label: "Date of Birth", type: "date" },
    {
      key: "gender",
      label: "Gender",
      type: "select",
      options: ["", "MALE", "FEMALE", "OTHER"],
    },
    {
      key: "maritalStatus",
      label: "Marital Status",
      type: "select",
      options: ["", "SINGLE", "MARRIED"],
    },
    { key: "employmentType", label: "Employment Type", type: "text" },
    { key: "nationalId", label: "NIC No", type: "text" },
    { key: "emergencyContact", label: "Emergency Contact", type: "text" },
  ];

  const handleStartEdit = () => {
    const form = {};
    editableFields.forEach(({ key }) => {
      form[key] = currentUser?.[key] || "";
    });
    setEditForm(form);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await API.put(`/employee/update-profile/${email}`, editForm);
      setCurrentUser({ ...currentUser, ...editForm });
      setIsEditing(false);
      setEditForm({});
      if (showMessage) showMessage("Profile updated successfully!");
    } catch (err) {
      if (showMessage)
        showMessage("Failed to update profile. Please try again.", true);
    } finally {
      setSaving(false);
    }
  };

  // ── Password ─────────────────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
  e.preventDefault();
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    if (showMessage) showMessage("Passwords do not match", true);
    return;
  }
  try {
    setLoading(true);
    await API.put(`/employee/change-password`, {   
      email,                                         
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    if (showMessage) showMessage("Password changed successfully!");
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
  } catch (err) {
    const msg = err.message?.toLowerCase().includes("incorrect") ||
                err.message?.toLowerCase().includes("wrong")
      ? "Current password is incorrect"
      : err.message || "Failed to change password";
    if (showMessage) showMessage(msg, true);
  } finally {
    setLoading(false);
  }
};


  const isPasswordFormValid = () =>
    passwordForm.oldPassword &&
    passwordForm.newPassword &&
    passwordForm.confirmPassword &&
    passwordForm.newPassword.length >= 6 &&
    passwordForm.newPassword === passwordForm.confirmPassword;

  // ── Styles ───────────────────────────────────────────────────────────────
  const fs = isMobile ? "13px" : "14px";
  const h = isMobile ? "40px" : "42px";

  const readOnlyStyle = {
    backgroundColor: "#f0f2f5",
    fontSize: fs,
    height: h,
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    color: "#6c757d",
  };

  const editableStyle = {
    fontSize: fs,
    height: h,
    border: "2px solid #0d6efd",
    borderRadius: "8px",
    backgroundColor: "#fff",
  };

  const viewStyle = {
    backgroundColor: "#f8f9fa",
    fontSize: fs,
    height: h,
    border: "1px solid #dee2e6",
    borderRadius: "8px",
  };

  const labelStyle = {
    fontSize: isMobile ? "12px" : "13px",
    marginBottom: "4px",
    fontWeight: "500",
  };

  const badge = (text, color, bg) => (
    <span
      className="ms-2 badge"
      style={{
        fontSize: "10px",
        backgroundColor: bg,
        color,
        fontWeight: "500",
        padding: "2px 7px",
        borderRadius: "4px",
        verticalAlign: "middle",
      }}
    >
      {text}
    </span>
  );

  if (!token || !email) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="alert alert-warning">
          <Lock size={16} className="me-2" />
          Authentication required. Please log in.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #88b3df 0%, #b5cce7 50%, #75e3c0 100%)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Navbar */}
      <div
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1030 }}
      >
        <Navbar setSidebarOpen={setSidebarOpen} />
      </div>

      {/* Desktop Sidebar */}
      <div
        className="d-none d-lg-block position-fixed"
        style={{
          top: "60px",
          left: 0,
          bottom: 0,
          width: "280px",
          zIndex: 1020,
        }}
      >
        <EmployeeSidebar sidebarOpen={true} setSidebarOpen={setSidebarOpen} />
      </div>
      {isMobile && (
        <EmployeeSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      )}

      {/* Main Content */}
      <div
        className="main-content"
        style={{
          marginLeft: isMobile ? "0" : "280px",
          marginTop: "60px",
          minHeight: "calc(100vh - 60px)",
          padding: isMobile ? "15px" : "20px",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <EmployeeDashboard />
        </div>

        <div className={`container-fluid ${isMobile ? "px-0" : "px-4"} py-4`}>
          <div
            className="rounded-4 slide-in"
            style={{
              backgroundColor: "#bccee4f2",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            }}
          >
            {/* Header */}
            <div className={`border-bottom p-${isMobile ? "3" : "4"}`}>
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle p-2 me-3"
                  style={{ background: "rgba(31,41,55,0.1)" }}
                >
                  <SettingsIcon size={20} style={{ color: "#1f2937" }} />
                </div>
                <h5
                  className="mb-0 fw-semibold text-dark"
                  style={{ fontSize: isMobile ? "1.1rem" : "1.25rem" }}
                >
                  SETTINGS
                </h5>
              </div>
            </div>

            {/* Tab Nav */}
            <div
              className="border-bottom"
              style={{ backgroundColor: "rgba(219,233,247,0.5)" }}
            >
              <div className={`px-${isMobile ? "2" : "4"} py-2 d-flex gap-2`}>
                {[
                  { id: "profile", label: "Profile" },
                  { id: "security", label: "Security" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className="border-0"
                    style={{
                      padding: isMobile ? "8px 16px" : "10px 24px",
                      borderRadius: "8px",
                      fontSize: isMobile ? "13px" : "14px",
                      fontWeight: activeSection === s.id ? "700" : "500",
                      color: activeSection === s.id ? "#000" : "#666",
                      backgroundColor:
                        activeSection === s.id ? "#9faebd" : "transparent",
                      border:
                        activeSection === s.id
                          ? "2px solid #0056b3"
                          : "1px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className={`p-${isMobile ? "3" : "4"}`}>
              {/* ── PROFILE ── */}
              {activeSection === "profile" && (
                <div>
                  {/* Title + Edit button */}
                  <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                    <h6
                      className="fw-semibold text-dark mb-0"
                      style={{ fontSize: isMobile ? "1rem" : "1.1rem" }}
                    >
                      Profile Information
                    </h6>
                    {!isEditing ? (
                      <button
                        className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                        onClick={handleStartEdit}
                        disabled={loading || !currentUser}
                        style={{ borderRadius: "8px", padding: "8px 18px" }}
                      >
                        <Edit2 size={14} /> Edit Profile
                      </button>
                    ) : (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                          onClick={handleCancelEdit}
                          disabled={saving}
                          style={{ borderRadius: "8px" }}
                        >
                          <X size={14} /> Cancel
                        </button>
                        <button
                          className="btn btn-success btn-sm d-flex align-items-center gap-1"
                          onClick={handleSaveProfile}
                          disabled={saving}
                          style={{ borderRadius: "8px" }}
                        >
                          {saving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={14} />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" />
                      <p className="mt-2 text-muted small">
                        Loading profile...
                      </p>
                    </div>
                  ) : currentUser ? (
                    <>
                      {/* Edit mode banner */}
                      {isEditing && (
                        <div
                          className="d-flex align-items-start gap-2 rounded-3 p-3 mb-4"
                          style={{
                            backgroundColor: "#e3f2fd",
                            fontSize: "13px",
                            color: "#1565c0",
                            border: "1px solid #90caf9",
                          }}
                        >
                          <Edit2 size={15} className="mt-1 flex-shrink-0" />
                          <div>
                            Fields marked <strong>editable</strong> can be
                            updated by you. Fields marked{" "}
                            <strong>admin only</strong> can only be changed by
                            an administrator.
                          </div>
                        </div>
                      )}

                      {/* ── ADMIN-ONLY FIELDS (always read-only) ── */}
                      <div className="mb-2">
                        <p
                          className="text-muted fw-semibold mb-2"
                          style={{
                            fontSize: "12px",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                          }}
                        >
                          🔒 Administrator Managed
                        </p>
                        <div className="row g-3 mb-4">
                          {adminOnlyFields.map(({ key, label }) => (
                            <div
                              key={key}
                              className={isMobile ? "col-12" : "col-md-3"}
                            >
                              <label
                                className="form-label text-dark"
                                style={labelStyle}
                              >
                                {label}
                                {badge("admin only", "#721c24", "#f8d7da")}
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={currentUser[key] || ""}
                                readOnly
                                style={readOnlyStyle}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── EDITABLE FIELDS ── */}
                      <div>
                        <p
                          className="text-muted fw-semibold mb-2"
                          style={{
                            fontSize: "12px",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                          }}
                        >
                          ✏️ Your Information
                        </p>
                        <div className="row g-3">
                          {editableFields.map(
                            ({ key, label, type, options }) => (
                              <div
                                key={key}
                                className={isMobile ? "col-12" : "col-md-4"}
                              >
                                <label
                                  className="form-label text-dark"
                                  style={labelStyle}
                                >
                                  {label}
                                  {isEditing &&
                                    badge("editable", "#0c5460", "#d1ecf1")}
                                </label>

                                {type === "select" && isEditing ? (
                                  <select
                                    className="form-select"
                                    value={editForm[key]}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        [key]: e.target.value,
                                      })
                                    }
                                    style={editableStyle}
                                  >
                                    {options.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt === ""
                                          ? `Select ${label}`
                                          : opt.charAt(0) +
                                            opt.slice(1).toLowerCase()}
                                      </option>
                                    ))}
                                  </select>
                                ) : type === "select" ? (
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={
                                      currentUser[key]
                                        ? currentUser[key].charAt(0) +
                                          currentUser[key]
                                            .slice(1)
                                            .toLowerCase()
                                        : ""
                                    }
                                    readOnly
                                    style={viewStyle}
                                  />
                                ) : (
                                  <input
                                    type={type || "text"}
                                    className="form-control"
                                    value={
                                      isEditing
                                        ? editForm[key]
                                        : currentUser[key] || ""
                                    }
                                    readOnly={!isEditing}
                                    onChange={
                                      isEditing
                                        ? (e) =>
                                            setEditForm({
                                              ...editForm,
                                              [key]: e.target.value,
                                            })
                                        : undefined
                                    }
                                    style={
                                      isEditing ? editableStyle : viewStyle
                                    }
                                    placeholder={
                                      isEditing
                                        ? `Enter ${label.toLowerCase()}`
                                        : ""
                                    }
                                  />
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Info note when not editing */}
                      {!isEditing && (
                        <div
                          className="d-flex align-items-center gap-2 rounded-3 p-3 mt-4"
                          style={{
                            backgroundColor: "#fff8e1",
                            fontSize: "13px",
                            color: "#856404",
                            border: "1px solid #ffe082",
                          }}
                        >
                          <User size={15} className="flex-shrink-0" />
                          Click <strong className="mx-1">
                            Edit Profile
                          </strong>{" "}
                          to update your personal information. Name, Email,
                          Section and Designation can only be changed by an
                          administrator.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="alert alert-warning">
                        Unable to load profile. Please refresh.
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={fetchCurrentUser}
                        disabled={loading}
                      >
                        {loading ? "Loading..." : "Retry"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── SECURITY ── */}
              {activeSection === "security" && (
                <div>
                  <h6
                    className="fw-semibold mb-4 text-dark"
                    style={{ fontSize: isMobile ? "1rem" : "1.1rem" }}
                  >
                    Security Settings
                  </h6>

                  <div
                    className="card border-0"
                    style={{
                      backgroundColor: "rgba(248,249,250,0.85)",
                      borderRadius: "12px",
                      maxWidth: "500px",
                    }}
                  >
                    <div className={`card-body p-${isMobile ? "3" : "4"}`}>
                      <h6 className="d-flex align-items-center gap-2 mb-4">
                        <Lock size={18} className="text-primary" />
                        Change Password
                      </h6>

                      {/* Current Password */}
                      <div className="mb-3">
                        <label
                          className="form-label fw-medium"
                          style={{ fontSize: fs }}
                        >
                          Current Password
                        </label>
                        <div className="input-group">
                          <input
                            type={showOldPassword ? "text" : "password"}
                            className="form-control"
                            name="oldPassword"
                            value={passwordForm.oldPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                oldPassword: e.target.value,
                              })
                            }
                            placeholder="Enter current password"
                            disabled={loading}
                            style={{
                              fontSize: "16px",
                              height: isMobile ? "44px" : "42px",
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                          >
                            {showOldPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="mb-3">
                        <label
                          className="form-label fw-medium"
                          style={{ fontSize: fs }}
                        >
                          New Password
                        </label>
                        <div className="input-group">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            className="form-control"
                            name="newPassword"
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                newPassword: e.target.value,
                              })
                            }
                            placeholder="Enter new password"
                            disabled={loading}
                            style={{
                              fontSize: "16px",
                              height: isMobile ? "44px" : "42px",
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                        <small className="text-muted">
                          Minimum 6 characters
                        </small>
                        {passwordForm.newPassword &&
                          passwordForm.newPassword.length < 6 && (
                            <small className="text-danger d-block">
                              Password is too short
                            </small>
                          )}
                      </div>

                      {/* Confirm Password */}
                      <div className="mb-4">
                        <label
                          className="form-label fw-medium"
                          style={{ fontSize: fs }}
                        >
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          placeholder="Confirm new password"
                          disabled={loading}
                          style={{
                            fontSize: "16px",
                            height: isMobile ? "44px" : "42px",
                          }}
                        />
                        {passwordForm.newPassword &&
                          passwordForm.confirmPassword &&
                          passwordForm.newPassword !==
                            passwordForm.confirmPassword && (
                            <small className="text-danger">
                              Passwords do not match
                            </small>
                          )}
                      </div>

                      {/* Buttons */}
                      <div
                        className={`d-flex gap-2 ${isMobile ? "flex-column" : "justify-content-end"}`}
                      >
                        <button
                          type="button"
                          className={`btn btn-outline-secondary ${isMobile ? "w-100" : ""}`}
                          onClick={() =>
                            setPasswordForm({
                              oldPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            })
                          }
                          disabled={loading}
                          style={{ minHeight: "42px", borderRadius: "8px" }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className={`btn btn-primary ${isMobile ? "w-100" : ""}`}
                          onClick={handlePasswordChange}
                          disabled={loading || !isPasswordFormValid()}
                          style={{ minHeight: "42px", borderRadius: "8px" }}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Shield size={15} className="me-2" />
                              Update Password
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slide-in {
          animation: slideIn 0.4s ease-out;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 991.98px) {
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
