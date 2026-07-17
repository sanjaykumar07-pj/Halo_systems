"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./notifications.module.css";
import { getIncidents, subscribeToIncidents, updateIncidentStatus, getWorkers, assignIncident } from "../../lib/supabase";
import { Stethoscope, ShieldAlert, Droplet, Flame, Building, Volume2, Accessibility, Pin } from "lucide-react";

const SEVERITY_COLOR: Record<number, string> = { 1: "#ef5350", 2: "#ffa726", 3: "#ffee58", 4: "#4caf50", 5: "#42a5f5" };
const SEVERITY_LABEL: Record<number, string> = { 1: "Critical", 2: "High", 3: "Medium", 4: "Low", 5: "Info" };
const TYPE_ICON: Record<string, React.ElementType> = {
  medical: Stethoscope, security: ShieldAlert, spill: Droplet,
  fire: Flame, structural: Building, noise: Volume2, accessibility: Accessibility, other: Pin,
};

export default function NotificationsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "assigned" | "in-progress" | "resolved">("all");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [workers, setWorkers] = useState<any[]>([]);
  
  // Dispatch form state
  const [dispatchWorker, setDispatchWorker] = useState<string>("");
  const [dispatchInstructions, setDispatchInstructions] = useState<string>("");

  const loadIncidents = useCallback(async () => {
    try {
      const data = await getIncidents();
      setIncidents(data ?? []);
      if (data && data.length > 0 && !selectedId) setSelectedId(data[0].id);
      
      const wData = await getWorkers();
      setWorkers(wData ?? []);
    } catch (e) { 
      console.error("SUPABASE ERROR:", JSON.stringify(e, null, 2)); 
      console.error(e); 
    }
    finally { setLoading(false); }
  }, [selectedId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadIncidents();
    // Subscribe to realtime updates
    const channel = subscribeToIncidents(() => loadIncidents());
    return () => { channel.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = incidents.filter((i) => filter === "all" || i.status === filter);
  const selected = incidents.find((i) => i.id === selectedId);
  const newCount = incidents.filter((i) => i.status === "new").length;

  const formatTime = (ts: string) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return `${Math.round(diff)}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    return `${Math.round(diff / 3600)}h ago`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>
            Incident Notifications
            {newCount > 0 && <span className={styles.unreadBadge}>{newCount} new</span>}
          </h2>
          <p className={styles.subtitle}>Live from Crisis-Bridge pipeline · Real-time updates</p>
        </div>
        {/* Filter tabs */}
        <div className={styles.filterTabs}>
          {(["all","new","assigned","in-progress","resolved"] as const).map((f) => (
            <button key={f} className={`${styles.tab} ${filter === f ? styles.tabActive : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={styles.tabCount}>{f === "all" ? incidents.length : incidents.filter((i) => i.status === f).length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.splitView}>
        {/* Message List */}
        <div className={`glass-card ${styles.listPanel}`}>
          {loading ? (
            <div className={styles.loadingRows}>
              {[...Array(5)].map((_, i) => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : filtered.map((inc) => (
            <button
              key={inc.id}
              className={`${styles.messageItem} ${selectedId === inc.id ? styles.selected : ""} ${inc.status === "new" ? styles.unread : ""}`}
              onClick={() => setSelectedId(inc.id)}
            >
              <div className={styles.msgHeader}>
                <span className={styles.msgIcon}>
                  {(() => {
                    const IconComp = TYPE_ICON[inc.parsed_type] ?? Pin;
                    return <IconComp size={18} />;
                  })()}
                </span>
                <span className={styles.msgSender}>{inc.reporter_name}</span>
                <span className={styles.msgTime}>{formatTime(inc.created_at)}</span>
              </div>
              <p className={styles.msgPreview}>{inc.raw_text}</p>
              <div className={styles.msgMeta}>
                <span className={`badge badge-${inc.status}`}>{inc.status}</span>
                <span className={styles.severityTag} style={{ color: SEVERITY_COLOR[inc.severity] }}>
                  {SEVERITY_LABEL[inc.severity]}
                </span>
                {inc.detected_language !== "en" && (
                  <span className={styles.langTag}>{inc.detected_language?.toUpperCase()}</span>
                )}
              </div>
              {inc.status === "new" && <span className={styles.unreadDot} />}
            </button>
          ))}
          {!loading && filtered.length === 0 && (
            <div className={styles.emptyState}>No incidents in this category.</div>
          )}
        </div>

        {/* Incident Detail */}
        <div className={`glass-card ${styles.detailPanel}`}>
          {loading ? (
            <div className={styles.loadingRows}><div className={styles.skeleton} style={{ height: 200 }} /></div>
          ) : selected ? (
            <div className={styles.detailContent}>
              {/* Header */}
              <div className={styles.detailHeader}>
                <span className={styles.detailIcon}>
                  {(() => {
                    const IconComp = TYPE_ICON[selected.parsed_type] ?? Pin;
                    return <IconComp size={24} />;
                  })()}
                </span>
                <div className={styles.detailMeta}>
                  <h3 className={styles.detailSender}>{selected.reporter_name}</h3>
                  <span className={styles.detailTime}>{formatTime(selected.created_at)}</span>
                </div>
                <div className={styles.detailBadges}>
                  <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                  <span className={styles.severityBadge} style={{ background: `${SEVERITY_COLOR[selected.severity]}20`, color: SEVERITY_COLOR[selected.severity], border: `1px solid ${SEVERITY_COLOR[selected.severity]}40` }}>
                    {SEVERITY_LABEL[selected.severity]}
                  </span>
                </div>
              </div>

              {/* Original Message */}
              <div className={styles.detailSection}>
                <label className={styles.detailLabel}>Original Report ({selected.detected_language?.toUpperCase()})</label>
                <div className={styles.messageBox}>{selected.raw_text}</div>
              </div>

              {/* English Translation */}
              {selected.english_translation && selected.detected_language !== "en" && (
                <div className={styles.detailSection}>
                  <label className={styles.detailLabel}>English Translation</label>
                  <div className={styles.messageBox} style={{ opacity: 0.8 }}>{selected.english_translation}</div>
                </div>
              )}

              {/* Info Grid */}
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}><span>Type</span><strong style={{ textTransform: "capitalize" }}>{selected.parsed_type}</strong></div>
                <div className={styles.infoItem}><span>Section</span><strong>{selected.section_id ?? "—"}</strong></div>
                <div className={styles.infoItem}><span>Location</span><strong>{selected.location_description ?? "—"}</strong></div>
                <div className={styles.infoItem}><span>Confidence</span><strong>{selected.confidence ? `${(selected.confidence * 100).toFixed(0)}%` : "—"}</strong></div>
              </div>

              {/* AI Reasoning if available */}
              {selected.ai_reasoning && (
                <div className={styles.detailSection}>
                  <label className={styles.detailLabel}>AI Analysis</label>
                  <div className={styles.aiBox}>{selected.ai_reasoning}</div>
                </div>
              )}

              {/* Actions */}
              <div className={styles.detailActions}>
                {selected.status === 'new' || selected.status === 'processing' ? (
                  <div className={styles.dispatchBox}>
                    <h4 className={styles.detailLabel}>Dispatch Ratio Staff</h4>
                    <div className={styles.dispatchForm}>
                      <select 
                        className={styles.dispatchSelect}
                        value={dispatchWorker}
                        onChange={(e) => setDispatchWorker(e.target.value)}
                      >
                        <option value="">Select Worker...</option>
                        {workers.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.type}) {w.status !== 'on-duty' ? ` - ${w.status}` : ''}
                          </option>
                        ))}
                      </select>
                      <input 
                        type="text" 
                        placeholder="Instructions (e.g. Bring mop)"
                        className={styles.dispatchInput}
                        value={dispatchInstructions}
                        onChange={(e) => setDispatchInstructions(e.target.value)}
                      />
                      <button 
                        className="btn btn-primary" 
                        id={`dispatch-${selected.id}`}
                        disabled={actionLoading === 'dispatch' || !dispatchWorker}
                        onClick={async () => {
                          setActionLoading('dispatch');
                          try {
                            await assignIncident(selected.id, dispatchWorker, dispatchInstructions);
                            setDispatchWorker("");
                            setDispatchInstructions("");
                          } catch(e) {
                            console.error(e);
                          } finally {
                            setActionLoading(null);
                          }
                        }}
                      >
                        {actionLoading === 'dispatch' ? 'Dispatching...' : 'Dispatch Staff'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="btn btn-secondary" 
                    id={`resolve-${selected.id}`}
                    disabled={actionLoading === 'resolve' || selected.status === 'resolved'}
                    onClick={async () => {
                      setActionLoading('resolve');
                      try {
                        await updateIncidentStatus(selected.id, 'resolved');
                      } catch(e) {
                        console.error(e);
                      } finally {
                        setActionLoading(null);
                      }
                    }}
                  >
                    {actionLoading === 'resolve' ? 'Resolving...' : 'Mark Resolved'}
                  </button>
                )}
                <button className="btn btn-ghost" id={`map-${selected.id}`}>View on Map</button>
              </div>
            </div>
          ) : (
            <div className={styles.emptyDetail}><p>Select an incident to view details</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
