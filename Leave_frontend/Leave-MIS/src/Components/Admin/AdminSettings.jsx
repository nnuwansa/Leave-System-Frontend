import React, { useState, useCallback } from "react";
import API from "../../API/axios";
import "../CSS/Admin.css";
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaShieldAlt,
} from "react-icons/fa";

function Toast({ toasts, removeToast }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            pointerEvents: "all",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            backgroundColor: t.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${t.type === "success" ? "#86efac" : "#fca5a5"}`,
            borderLeft: `4px solid ${t.type === "success" ? "#22c55e" : "#ef4444"}`,
            borderRadius: "8px",
            padding: "14px 16px",
            minWidth: "280px",
            maxWidth: "380px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
            animation: "toastSlide 0.25s ease",
          }}
        >
          <span style={{ fontSize: "18px", marginTop: "1px", flexShrink: 0 }}>
            {t.type === "success" ? (
              <FaCheckCircle style={{ color: "#22c55e" }} />
            ) : (
              <FaTimesCircle style={{ color: "#ef4444" }} />
            )}
          </span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: "700",
                fontSize: "13px",
                color: t.type === "success" ? "#166534" : "#991b1b",
              }}
            >
              {t.type === "success" ? "Success" : "Error"}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#374151",
                marginTop: "2px",
                lineHeight: "1.5",
              }}
            >
              {t.message}
            </div>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <FaTimes />
          </button>
        </div>
      ))}
      <style>{`@keyframes toastSlide { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  showPassword,
  onToggle,
  error,
  placeholder,
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: "600",
          color: "#374151",
          marginBottom: "8px",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "11px 44px 11px 14px",
            borderRadius: "8px",
            fontSize: "14px",
            border: `1.5px solid ${error ? "#ef4444" : "#d1d5db"}`,
            backgroundColor: error ? "#fef2f2" : "#fff",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9ca3af",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      {error && (
        <p style={{ color: "#ef4444", fontSize: "12px", margin: "5px 0 0" }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label: "6+ chars", ok: password.length >= 6 },
    { label: "8+ chars", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
    { label: "Special", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];
  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "4px",
              borderRadius: "2px",
              backgroundColor: i <= score ? colors[score - 1] : "#e5e7eb",
              transition: "background-color 0.3s",
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "4px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: colors[score - 1] || "#9ca3af",
            fontWeight: "600",
          }}
        >
          {score > 0 ? labels[score - 1] : "Enter password"}
        </span>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {checks.map((c) => (
            <span
              key={c.label}
              style={{ fontSize: "11px", color: c.ok ? "#22c55e" : "#9ca3af" }}
            >
              {c.ok ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const AdminSettings = () => {
  const [toasts, setToasts] = useState([]);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({
    current: false,
    newPw: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }, []);

  const removeToast = useCallback(
    (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  );

  const validate = () => {
    const e = {};
    if (!form.currentPassword)
      e.currentPassword = "Current password is required";
    if (!form.newPassword) e.newPassword = "New password is required";
    else if (form.newPassword.length < 6)
      e.newPassword = "Must be at least 6 characters";
    else if (form.newPassword === form.currentPassword)
      e.newPassword = "Must be different from current password";
    if (!form.confirmPassword)
      e.confirmPassword = "Please confirm your new password";
    else if (form.newPassword !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await API.put("/admin/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password changed successfully!", "success");
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const msg = err.response?.data;
      if (typeof msg === "string" && msg.includes("Current password")) {
        setErrors({ currentPassword: "Current password is incorrect" });
      } else {
        showToast(
          typeof msg === "string" ? msg : "Failed to change password",
          "error",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setErrors({});
    setSuccess(false);
  };

  return (
    <div className="dashboard">
      <Toast toasts={toasts} removeToast={removeToast} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div className="header-heading">
        <h3>Settings</h3>
      </div>
      <div className="dashboard-paragraph">
        <p>Manage your admin account settings.</p>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* LEFT — Change Password Card */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #185a9d 0%, #43cea2 100%)",
              padding: "22px 28px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                backgroundColor: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaLock style={{ color: "#fff", fontSize: "18px" }} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  color: "#fff",
                  fontSize: "17px",
                  fontWeight: "700",
                }}
              >
                Change Password
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "13px",
                }}
              >
                Update your administrator password
              </p>
            </div>
          </div>

          {success && (
            <div
              style={{
                backgroundColor: "#f0fdf4",
                borderBottom: "1px solid #86efac",
                padding: "14px 28px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FaCheckCircle
                style={{ color: "#22c55e", fontSize: "18px", flexShrink: 0 }}
              />
              <div>
                <p
                  style={{
                    margin: 0,
                    fontWeight: "600",
                    color: "#166534",
                    fontSize: "14px",
                  }}
                >
                  Password changed successfully!
                </p>
                <p style={{ margin: 0, color: "#15803d", fontSize: "12px" }}>
                  Your new password is now active.
                </p>
              </div>
            </div>
          )}

          <div style={{ padding: "28px" }}>
            <form onSubmit={handleSubmit}>
              <PasswordField
                label="Current Password"
                value={form.currentPassword}
                onChange={(e) => {
                  setForm({ ...form, currentPassword: e.target.value });
                  setErrors({ ...errors, currentPassword: "" });
                }}
                showPassword={show.current}
                onToggle={() => setShow({ ...show, current: !show.current })}
                error={errors.currentPassword}
                placeholder="Enter your current password"
              />

              <PasswordField
                label="New Password"
                value={form.newPassword}
                onChange={(e) => {
                  setForm({ ...form, newPassword: e.target.value });
                  setErrors({ ...errors, newPassword: "" });
                }}
                showPassword={show.newPw}
                onToggle={() => setShow({ ...show, newPw: !show.newPw })}
                error={errors.newPassword}
                placeholder="Enter your new password"
              />

              <PasswordStrength password={form.newPassword} />

              <PasswordField
                label="Confirm New Password"
                value={form.confirmPassword}
                onChange={(e) => {
                  setForm({ ...form, confirmPassword: e.target.value });
                  setErrors({ ...errors, confirmPassword: "" });
                }}
                showPassword={show.confirm}
                onToggle={() => setShow({ ...show, confirm: !show.confirm })}
                error={errors.confirmPassword}
                placeholder="Confirm your new password"
              />

              {form.confirmPassword && form.newPassword && (
                <div
                  style={{
                    marginBottom: "20px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color:
                      form.newPassword === form.confirmPassword
                        ? "#22c55e"
                        : "#ef4444",
                  }}
                >
                  {form.newPassword === form.confirmPassword ? (
                    <>
                      <FaCheckCircle /> Passwords match
                    </>
                  ) : (
                    <>
                      <FaTimesCircle /> Passwords do not match
                    </>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1.5px solid #d1d5db",
                    backgroundColor: "#f9fafb",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    background: saving
                      ? "#9ca3af"
                      : "linear-gradient(135deg, #185a9d, #43cea2)",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#fff",
                    boxShadow: saving
                      ? "none"
                      : "0 3px 10px rgba(24,90,157,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {saving ? (
                    <>
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid #fff",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />{" "}
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaLock style={{ fontSize: "13px" }} /> Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT — Info Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "14px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #185a9d 0%, #43cea2 100%)",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FaShieldAlt style={{ color: "#fff", fontSize: "15px" }} />
              <h4
                style={{
                  margin: 0,
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "700",
                }}
              >
                Security Tips
              </h4>
            </div>
            <div style={{ padding: "20px" }}>
              {[
                { icon: "✓", text: "Use at least 8 characters", ok: true },
                {
                  icon: "✓",
                  text: "Include uppercase letters (A–Z)",
                  ok: true,
                },
                { icon: "✓", text: "Include numbers (0–9)", ok: true },
                {
                  icon: "✓",
                  text: "Include special characters (!@#$)",
                  ok: true,
                },
                {
                  icon: "✗",
                  text: "Avoid using your name or email",
                  ok: false,
                },
                { icon: "✗", text: "Don't reuse old passwords", ok: false },
              ].map((tip, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      backgroundColor: tip.ok ? "#dcfce7" : "#fee2e2",
                      color: tip.ok ? "#16a34a" : "#dc2626",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "700",
                      marginTop: "1px",
                    }}
                  >
                    {tip.icon}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#374151",
                      lineHeight: "1.5",
                    }}
                  >
                    {tip.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
