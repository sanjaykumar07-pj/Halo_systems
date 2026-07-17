"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../login.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    clientId: "",
    password: "",
    role: "admin",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate auth registration — in production, this calls Supabase Auth (signUp)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Store demo session
    localStorage.setItem("halo_user", JSON.stringify({
      email: formData.email,
      role: formData.role,
      clientId: formData.clientId,
      name: formData.name || "New Operations User",
    }));

    if (formData.role === "staff") {
      window.open("http://localhost:8084", "_blank");
      setIsLoading(false);
    } else if (formData.role === "fan") {
      window.open("http://localhost:8082", "_blank");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
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
              <span>Unified Account Creation</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureDot} />
              <span>Secure Role Management</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureDot} />
              <span>End-to-end Encryption</span>
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

      {/* Right panel — register form */}
      <div className={styles.formPanel}>
        <div className={styles.formWrapper}>
          <h2 className={styles.formTitle}>Create an account</h2>
          <p className={styles.formSubtitle}>Join the HALO Operation Network</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

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
                minLength={8}
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

            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              style={{ marginTop: "1rem" }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.spinner} />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className={styles.createAccount}>
            Already have an account?{" "}
            <Link href="/" className={styles.createLink}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
