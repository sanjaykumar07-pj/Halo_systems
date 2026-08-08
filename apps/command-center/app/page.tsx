"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { signInWithGoogle, signInWithEmail } from "./lib/supabase";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    if (!formData.email.toLowerCase().endsWith("@gmail.com")) {
      alert("Please use a valid Google email address (@gmail.com).");
      setIsLoading(false);
      return;
    }
    
    try {
      await signInWithEmail(formData.email, formData.password);
      
      // Route based on role
      if (formData.role === "staff") {
        window.location.href = process.env.NEXT_PUBLIC_STAFF_APP_URL || "http://localhost:8084";
      } else if (formData.role === "fan") {
        window.location.href = process.env.NEXT_PUBLIC_FAN_APP_URL || "http://localhost:8082";
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      // Supabase handles the redirect automatically if successful
    } catch (err) {
      console.error(err);
      setIsLoading(false);
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

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className={`btn ${styles.submitBtn}`}
              disabled={isLoading}
              style={{ marginTop: "1rem", backgroundColor: "#fff", color: "#333", border: "1px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              <img src="https://authjs.dev/img/providers/google.svg" alt="Google" width="20" height="20" />
              Sign in with Google
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
