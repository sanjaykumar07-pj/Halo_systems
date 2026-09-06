"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    clientId: "",
    password: "",
    role: "admin",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      alert("Please enter your email and password.");
      setIsLoading(false);
      return;
    }

    // Store session locally and route based on role
    const session = {
      email: formData.email,
      role: formData.role,
      clientId: formData.clientId,
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem("halo_user", JSON.stringify(session));

    setTimeout(() => {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      
      if (formData.role === "staff") {
        window.location.href = `${protocol}//${hostname}:8084`;
      } else if (formData.role === "fan") {
        window.location.href = `${protocol}//${hostname}:8082`;
      } else {
        router.push("/dashboard");
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className={styles.container}>
      {/* Left panel — branding */}
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logoWrapper}>
            <div className={styles.logoIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="#c62828" strokeWidth="2.5" />
                <circle cx="24" cy="24" r="14" stroke="#c62828" strokeWidth="1.5" opacity="0.6" />
                <circle cx="24" cy="24" r="6" fill="#c62828" />
                <line x1="24" y1="2" x2="24" y2="10" stroke="#c62828" strokeWidth="1.5" />
                <line x1="24" y1="38" x2="24" y2="46" stroke="#c62828" strokeWidth="1.5" />
                <line x1="2" y1="24" x2="10" y2="24" stroke="#c62828" strokeWidth="1.5" />
                <line x1="38" y1="24" x2="46" y2="24" stroke="#c62828" strokeWidth="1.5" />
              </svg>
            </div>
            <h1 className={styles.logoText}>HALO</h1>
          </div>
          <p className={styles.tagline}>Stadium Operations System</p>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <span className={styles.featureDot} />
              <span>Operation Command - Staff</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureDot} />
              <span>Real-time Incident Tracking</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureDot} />
              <span>AI-Powered Staff Dispatch</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureDot} />
              <span>75% Fan Safety</span>
            </div>
          </div>
        </div>

        {/* Animated background rings */}
        <div className={styles.bgRings}>
          <div className={styles.ring1} />
          <div className={styles.ring2} />
          <div className={styles.ring3} />
        </div>
      </div>

      {/* Right panel — login form */}
      <div className={styles.formPanel}>
        <div className={styles.formWrapper}>
          <h2 className={styles.formTitle}>Sign in to your account</h2>
          <p className={styles.formSubtitle}>Access the Operation Command Center</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="admin@halo-stadium.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="clientId">Client ID</label>
              <input
                id="clientId"
                type="text"
                placeholder="HALO-2026-001"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="role">Role</label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="admin">Operation Command</option>
                <option value="staff">Staff</option>
                <option value="fan">Fan</option>
              </select>
            </div>

            <div className={styles.formOptions}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Remember me</span>
              </label>
              <a href="#" className={styles.forgotLink}>Forgot Password?</a>
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.spinner} />
              ) : (
                "Sign In"
              )}
            </button>


          </form>

          <p className={styles.createAccount}>
            Don&apos;t have an account?{" "}
            <a href="/register" className={styles.createLink}>Create account</a>
          </p>
        </div>
      </div>
    </div>
  );
}
