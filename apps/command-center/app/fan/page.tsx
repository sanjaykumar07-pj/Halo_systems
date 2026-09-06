"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import styles from "./fan.module.css";

const LANGUAGES = [
  { code: "en", label: "🇬🇧 English" },
  { code: "es", label: "🇪🇸 Español" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "ar", label: "🇸🇦 العربية" },
  { code: "zh", label: "🇨🇳 中文" },
  { code: "ja", label: "🇯🇵 日本語" },
  { code: "pt", label: "🇧🇷 Português" },
  { code: "de", label: "🇩🇪 Deutsch" },
  { code: "hi", label: "🇮🇳 हिन्दी" },
];

const CATEGORIES = [
  { key: "medical", label: "Medical", icon: "🏥", color: "#ef5350" },
  { key: "security", label: "Security", icon: "🛡️", color: "#ffa726" },
  { key: "spill", label: "Spill", icon: "💧", color: "#42a5f5" },
  { key: "accessibility", label: "Accessibility", icon: "♿", color: "#ab47bc" },
  { key: "structural", label: "Structural", icon: "🏗️", color: "#78909c" },
  { key: "noise", label: "Noise", icon: "🔊", color: "#ffee58" },
  { key: "other", label: "Other", icon: "📌", color: "#8888a0" },
];

type Screen = "home" | "report" | "success";

export default function FanDashboard() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("home");
  const [lang, setLang] = useState("en");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [incidentRef, setIncidentRef] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("halo_user");
    if (!stored) { router.push("/"); return; }
    const session = JSON.parse(stored);
    if (session.role !== "fan") { router.push("/"); return; }
    setName(session.email?.split("@")[0] || "");
  }, [router]);

  const handleSubmit = async () => {
    if (!message.trim() || !name.trim()) {
      alert("Please enter your name and describe the issue.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await supabase.functions.invoke("process-report", {
        body: {
          reporter_name: name,
          raw_text: message,
          detected_language: lang,
          section_id: section ? parseInt(section) : undefined,
        },
      });
      if (result.error) throw result.error;
      setIncidentRef((result.data?.id || "").slice(0, 8).toUpperCase());
      setScreen("success");
    } catch {
      alert("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setScreen("home");
    setCategory("");
    setMessage("");
    setSection("");
  };

  const handleSignOut = () => {
    localStorage.removeItem("halo_user");
    router.push("/");
  };

  // ─── Home Screen ────────────────────────────
  if (screen === "home") return (
    <div className={styles.container}>
      <div className={styles.homeContent}>
        <div className={styles.homeHeader}>
          <div className={styles.stadiumIcon}>🏟️</div>
          <h1 className={styles.homeTitle}>HALO Fan</h1>
          <p className={styles.homeSubtitle}>Your stadium companion</p>
          <div className={styles.liveChip}>
            <div className={styles.liveDot} />
            <span className={styles.liveText}>LIVE — Match Day</span>
          </div>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            <span className={styles.signOutText}>Sign Out</span>
          </button>
        </div>

        <h3 className={styles.sectionTitle}>Language / اللغة / 语言</h3>
        <div className={styles.langScroll}>
          {LANGUAGES.map((l) => (
            <button key={l.code} className={`${styles.langChip} ${lang === l.code ? styles.langChipActive : ""}`} onClick={() => setLang(l.code)}>
              {l.label}
            </button>
          ))}
        </div>

        <button className={styles.emergencyBtn} onClick={() => { setCategory("medical"); setScreen("report"); }}>
          <span className={styles.emergencyIcon}>🚨</span>
          <span className={styles.emergencyText}>EMERGENCY</span>
          <span className={styles.emergencySubtext}>Tap for immediate help</span>
        </button>

        <h3 className={styles.sectionTitle}>Report an Issue</h3>
        <div className={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <button key={cat.key} className={styles.categoryCard} onClick={() => { setCategory(cat.key); setScreen("report"); }}>
              <div className={styles.catIconCircle} style={{ backgroundColor: cat.color + "22" }}>
                {cat.icon}
              </div>
              <span className={styles.catLabel}>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.infoRow}>
          <div className={styles.infoCard}>
            <span className={styles.infoNum}>50</span>
            <span className={styles.infoLabel}>Staff On-Duty</span>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoNum}>3 min</span>
            <span className={styles.infoLabel}>Avg. Response</span>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoNum}>16</span>
            <span className={styles.infoLabel}>Stadium Sections</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Report Screen ──────────────────────────
  if (screen === "report") return (
    <div className={styles.container}>
      <div className={styles.reportContent}>
        <button className={styles.backBtn} onClick={() => setScreen("home")}>← Back</button>
        <h1 className={styles.reportTitle}>Report an Issue</h1>
        <p className={styles.reportSubtitle}>Your report goes directly to stadium operations. Response time ~3 min.</p>

        <label className={styles.fieldLabel}>Category</label>
        <div className={styles.catChipRow}>
          {CATEGORIES.map((cat) => (
            <button key={cat.key}
              className={`${styles.catChip} ${category === cat.key ? styles.catChipActive : ""}`}
              style={category === cat.key ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
              onClick={() => setCategory(cat.key)}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <label className={styles.fieldLabel}>Your Name</label>
        <input className={styles.input} placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />

        <label className={styles.fieldLabel}>Section Number (optional)</label>
        <input className={styles.input} placeholder="e.g. 203" value={section} onChange={(e) => setSection(e.target.value)} type="number" />

        <label className={styles.fieldLabel}>Describe the Issue ({lang.toUpperCase()})</label>
        <textarea className={`${styles.input} ${styles.textArea}`} placeholder="Describe what's happening..." value={message} onChange={(e) => setMessage(e.target.value)} />

        <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Sending…" : "Send Report"} {!submitting && "✉️"}
        </button>
      </div>
    </div>
  );

  // ─── Success Screen ─────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.successContent}>
        <div className={styles.successIcon}>✅</div>
        <h1 className={styles.successTitle}>Report Sent!</h1>
        <p className={styles.successRef}>Ref # {incidentRef}</p>
        <p className={styles.successMsg}>Stadium staff have been notified. A team member will respond within ~3 minutes.</p>
        <div className={styles.etaCard}>
          <span className={styles.etaNum}>~3 min</span>
          <span className={styles.etaLabel}>Estimated Response Time</span>
        </div>
        <button className={styles.submitBtn} onClick={resetForm} style={{ maxWidth: 300 }}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
