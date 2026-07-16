"use client";

import styles from "./settings.module.css";
import { User, Lock, Palette, Bell, Shield, HelpCircle } from "lucide-react";

const SETTINGS_CATEGORIES = [
  { id: "profile", label: "Profile & Personal Info", icon: User, description: "Name, email, avatar, language preferences" },
  { id: "security", label: "Account & Security", icon: Lock, description: "Password, 2FA, login sessions" },
  { id: "appearance", label: "Preferences & Appearance", icon: Palette, description: "Theme, layout, notification sounds" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Email alerts, push notifications, digest frequency" },
  { id: "privacy", label: "Privacy & Data", icon: Shield, description: "Data export, activity logs, GDPR compliance" },
  { id: "help", label: "Help & Support", icon: HelpCircle, description: "Documentation, contact support, report a bug" },
];

export default function SettingsPage() {
  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Settings</h2>

      <div className={styles.grid}>
        {SETTINGS_CATEGORIES.map((cat, i) => (
          <button
            key={cat.id}
            className={`glass-card ${styles.settingCard} animate-fade-in`}
            style={{ animationDelay: `${i * 0.06}s` }}
            id={`settings-${cat.id}`}
          >
            <span className={styles.cardIcon}><cat.icon size={22} className="text-secondary" /></span>
            <div className={styles.cardInfo}>
              <h3 className={styles.cardLabel}>{cat.label}</h3>
              <p className={styles.cardDesc}>{cat.description}</p>
            </div>
            <svg className={styles.arrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
