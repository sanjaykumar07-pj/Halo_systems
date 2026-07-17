"use client";

import { useState } from "react";
import styles from "./management.module.css";
import { addWorker, updateWorker, removeWorker } from "../../lib/supabase";

type Tab = "add" | "edit" | "remove";

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("add");
  const [addForm, setAddForm] = useState({ name: "", email: "", type: "janitor", section: "", status: "off-duty" });
  const [editForm, setEditForm] = useState({ workerId: "", name: "", type: "janitor", section: "", status: "on-duty" });
  const [removeId, setRemoveId] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addWorker({ ...addForm, section: parseInt(addForm.section) || 1 });
      setFeedback(`Worker "${addForm.name}" added successfully as ${addForm.type}`);
      setAddForm({ name: "", email: "", type: "janitor", section: "", status: "off-duty" });
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      console.error(err);
      setFeedback(`Error adding worker`);
    }
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: any = {};
      if (editForm.name) updates.name = editForm.name;
      if (editForm.type) updates.type = editForm.type;
      if (editForm.section) updates.section = parseInt(editForm.section);
      if (editForm.status) updates.status = editForm.status;
      
      await updateWorker(editForm.workerId, updates);
      setFeedback(`Worker ${editForm.workerId} updated successfully`);
    } catch (err) {
      console.error(err);
      setFeedback(`Error updating worker`);
    }
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await removeWorker(removeId);
      setFeedback(`Worker ${removeId} removed from system`);
      setRemoveId("");
    } catch (err) {
      console.error(err);
      setFeedback(`Error removing worker`);
    }
    setTimeout(() => setFeedback(""), 3000);
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Management</h2>
      <p className={styles.subtitle}>Add, Edit, or Remove workers. Push to worker&apos;s dashboard.</p>

      {feedback && <div className={styles.feedback}>{feedback}</div>}

      {/* Tabs */}
      <div className={styles.tabs}>
        {(["add", "edit", "remove"] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "add" && "Add Workers"}
            {tab === "edit" && "Edit Workers Detail"}
            {tab === "remove" && "Remove Workers"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={`glass-card ${styles.formCard}`}>
        {activeTab === "add" && (
          <form onSubmit={handleAdd} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Name</label>
                <input placeholder="Full name" value={addForm.name} onChange={(e) => setAddForm({...addForm, name: e.target.value})} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input type="email" placeholder="worker@halo.com" value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Type</label>
                <select value={addForm.type} onChange={(e) => setAddForm({...addForm, type: e.target.value})}>
                  <option value="janitor">Janitor</option>
                  <option value="medic">Medic</option>
                  <option value="security">Security</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Section</label>
                <input placeholder="Section number" value={addForm.section} onChange={(e) => setAddForm({...addForm, section: e.target.value})} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Status</label>
                <select value={addForm.status} onChange={(e) => setAddForm({...addForm, status: e.target.value})}>
                  <option value="off-duty">Off-Duty</option>
                  <option value="on-duty">On-Duty</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Add</button>
          </form>
        )}

        {activeTab === "edit" && (
          <form onSubmit={handleEdit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Worker ID</label>
                <input placeholder="e.g. 10001" value={editForm.workerId} onChange={(e) => setEditForm({...editForm, workerId: e.target.value})} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Name</label>
                <input placeholder="Updated name" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Type</label>
                <select value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value})}>
                  <option value="janitor">Janitor</option>
                  <option value="medic">Medic</option>
                  <option value="security">Security</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Section</label>
                <input placeholder="Section number" value={editForm.section} onChange={(e) => setEditForm({...editForm, section: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}>
                  <option value="on-duty">On-Duty</option>
                  <option value="off-duty">Off-Duty</option>
                  <option value="completed">Completed</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Edit</button>
          </form>
        )}

        {activeTab === "remove" && (
          <form onSubmit={handleRemove} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Worker ID to Remove</label>
              <input placeholder="e.g. 10001" value={removeId} onChange={(e) => setRemoveId(e.target.value)} required style={{ maxWidth: 300 }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ background: "#c62828" }}>Remove</button>
          </form>
        )}
      </div>
    </div>
  );
}
