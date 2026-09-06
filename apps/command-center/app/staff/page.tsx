"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getIncidents, updateIncidentStatus, subscribeToIncidents, supabase } from "../lib/supabase";
import styles from "./staff.module.css";

const SEVERITY_COLOR: Record<number, string> = {
  1: "#ef5350", 2: "#ffa726", 3: "#ffee58", 4: "#4caf50", 5: "#42a5f5",
};
const SEVERITY_LABEL: Record<number, string> = {
  1: "CRITICAL", 2: "HIGH", 3: "MEDIUM", 4: "LOW", 5: "INFO",
};
const TYPE_ICON: Record<string, string> = {
  medical: "🏥", security: "🛡️", spill: "💧", fire: "🔥",
  structural: "🏗️", noise: "🔊", accessibility: "♿", other: "📌",
};

export default function StaffDashboard() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"open" | "done">("open");
  const [showProfile, setShowProfile] = useState(false);
  const [worker, setWorker] = useState({ name: "Staff Member", id: "10001", type: "janitor", section: 102 });

  useEffect(() => {
    const stored = localStorage.getItem("halo_user");
    if (!stored) { router.push("/"); return; }
    const session = JSON.parse(stored);
    if (session.role !== "staff") { router.push("/"); return; }
    setWorker((prev) => ({ ...prev, name: session.email?.split("@")[0] || "Staff Member" }));
  }, [router]);

  const load = useCallback(async () => {
    try {
      const data = await getIncidents();
      setIncidents(data ?? []);
    } catch { setIncidents([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const sub = subscribeToIncidents(() => load());
    return () => { supabase.removeChannel(sub); };
  }, [load]);

  const handleAccept = async (incident: any) => {
    if (!confirm("Accept this " + (incident.parsed_type || "unknown") + " incident at Section " + (incident.section_id || "?") + "?")) return;
    await updateIncidentStatus(incident.id, "in-progress");
    load();
  };

  const handleResolve = async (incident: any) => {
    await updateIncidentStatus(incident.id, "resolved");
    load();
  };

  const handleSignOut = () => {
    localStorage.removeItem("halo_user");
    router.push("/");
  };

  const openIncidents = incidents.filter((i) => i.status !== "resolved");
  const doneIncidents = incidents.filter((i) => i.status === "resolved");
  const displayed = activeTab === "open" ? openIncidents : doneIncidents;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.greeting}>Good Day,</p>
          <h1 className={styles.workerName}>{worker.name}</h1>
          <p className={styles.workerMeta}>ID #{worker.id} · {worker.type} · Section {worker.section}</p>
        </div>
        <button className={styles.avatar} onClick={() => setShowProfile(true)}>
          <span className={styles.avatarText}>{worker.name[0]?.toUpperCase()}</span>
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statPill} style={{ borderColor: "#ef5350" }}>
          <span className={styles.statNum} style={{ color: "#ef5350" }}>{openIncidents.filter((i) => i.severity === 1).length}</span>
          <span className={styles.statLabel}>Critical</span>
        </div>
        <div className={styles.statPill} style={{ borderColor: "#ffa726" }}>
          <span className={styles.statNum} style={{ color: "#ffa726" }}>{openIncidents.length}</span>
          <span className={styles.statLabel}>Open</span>
        </div>
        <div className={styles.statPill} style={{ borderColor: "#4caf50" }}>
          <span className={styles.statNum} style={{ color: "#4caf50" }}>{doneIncidents.length}</span>
          <span className={styles.statLabel}>Resolved</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === "open" ? styles.tabActive : ""}`} onClick={() => setActiveTab("open")}>
          Open Tasks ({openIncidents.length})
        </button>
        <button className={`${styles.tab} ${activeTab === "done" ? styles.tabActive : ""}`} onClick={() => setActiveTab("done")}>
          Done ({doneIncidents.length})
        </button>
      </div>

      {/* Incidents */}
      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : (
        <div className={styles.scroll}>
          {displayed.length === 0 ? (
            <div className={styles.empty}>No tasks here</div>
          ) : displayed.map((incident) => (
            <div key={incident.id} className={styles.card}>
              <div className={styles.severityBar} style={{ backgroundColor: SEVERITY_COLOR[incident.severity] || "#8888a0" }} />
              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardIcon}>{TYPE_ICON[incident.parsed_type] ?? "📌"}</span>
                  <div className={styles.cardTitleBlock}>
                    <div className={styles.cardType}>{incident.parsed_type?.toUpperCase() || "UNKNOWN"}</div>
                    <div className={styles.cardSection}>Section {incident.section_id ?? "—"}</div>
                  </div>
                  <span className={styles.severityTag} style={{ backgroundColor: (SEVERITY_COLOR[incident.severity] || "#888") + "22", color: SEVERITY_COLOR[incident.severity] || "#888" }}>
                    {SEVERITY_LABEL[incident.severity] || "UNKNOWN"}
                  </span>
                </div>
                <p className={styles.cardMessage}>{incident.english_translation ?? incident.raw_text}</p>
                <p className={styles.cardLocation}>{incident.location_description ?? "Location unknown"}</p>
                <div className={styles.cardFooter}>
                  <div className={styles.statusDot}>
                    <div className={styles.dot} style={{ backgroundColor: incident.status === "in-progress" ? "#4caf50" : "#ffa726" }} />
                    <span className={styles.statusText}>{incident.status}</span>
                  </div>
                  {activeTab === "open" && (
                    <div className={styles.actions}>
                      {incident.status !== "in-progress" && (
                        <button className={styles.btnAccept} onClick={() => handleAccept(incident)}>Accept</button>
                      )}
                      <button className={styles.btnResolve} onClick={() => handleResolve(incident)}>Resolve</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Overlay */}
      {showProfile && (
        <div className={styles.profileOverlay}>
          <div className={styles.profileCard}>
            <button className={styles.closeProfile} onClick={() => setShowProfile(false)}>✕</button>
            <div className={styles.profileHeader}>
              <div className={styles.profileAvatar}>
                <span className={styles.profileAvatarText}>{worker.name[0]?.toUpperCase()}</span>
              </div>
              <h2 className={styles.workerName}>{worker.name}</h2>
              <p className={styles.workerMeta}>{worker.type.toUpperCase()}</p>
            </div>
            <div className={styles.profileInfoRow}>
              <div className={styles.profileInfoBox}>
                <span className={styles.profileInfoLabel}>Worker ID</span>
                <span className={styles.profileInfoVal}>#{worker.id}</span>
              </div>
              <div className={styles.profileInfoBox}>
                <span className={styles.profileInfoLabel}>Section</span>
                <span className={styles.profileInfoVal}>{worker.section}</span>
              </div>
            </div>
            <div className={styles.profileInfoRow}>
              <div className={styles.profileInfoBox}>
                <span className={styles.profileInfoLabel}>Status</span>
                <span className={styles.profileInfoVal} style={{ color: "#4caf50" }}>On-Duty</span>
              </div>
              <div className={styles.profileInfoBox}>
                <span className={styles.profileInfoLabel}>Efficiency</span>
                <span className={styles.profileInfoVal}>100%</span>
              </div>
            </div>
            <button className={styles.logoutBtn} onClick={handleSignOut}>
              <span className={styles.logoutText}>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
