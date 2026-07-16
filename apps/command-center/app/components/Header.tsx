"use client";

import { useState } from "react";
import styles from "./Header.module.css";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.searchWrapper}>
        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search workers, sections, incidents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
          id="global-search"
        />
      </div>

      <div className={styles.headerRight}>
        <span className={styles.roleTag}>Operation Command · Staff</span>
        
        <button className={styles.notifBtn} id="header-notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className={styles.notifDot} />
        </button>

        <div style={{ position: "relative" }}>
          <div 
            className={styles.avatar} 
            id="user-avatar" 
            onClick={() => setShowProfile(!showProfile)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          {showProfile && (
            <div className={styles.profileDropdown}>
              <div className={styles.profileHeader}>
                <div className={styles.profileAvatarLarge}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <div className={styles.profileName}>Commander Admin</div>
                  <div className={styles.profileRole}>Operation Command</div>
                </div>
              </div>
              
              <div className={styles.profileSection}>
                <div className={styles.profileItem}>
                  <span className={styles.profileLabel}>Status</span>
                  <span className={styles.profileValueActive}>Active</span>
                </div>
                <div className={styles.profileItem}>
                  <span className={styles.profileLabel}>System ID</span>
                  <span className={styles.profileValue}>CMD-001</span>
                </div>
              </div>

              <div className={styles.profileActions}>
                <button className={styles.profileBtn} onClick={() => alert("Settings opened")}>Settings</button>
                <button 
                  className={styles.profileBtnDanger} 
                  onClick={() => {
                    localStorage.removeItem("halo_user");
                    window.location.href = "/";
                  }}
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
