"use client";

import { useEffect, useState } from "react";

const emptyForm = {
  date: "",
  start_time: "17:00",
  end_time: "19:00",
  slot_duration_minutes: 30,
  is_active: true
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [windows, setWindows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function adminHeaders() {
    return {
      "Content-Type": "application/json",
      "x-admin-password": password
    };
  }

  async function apiRequest(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        ...adminHeaders(),
        ...(options.headers || {})
      }
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "הפעולה נכשלה.");
    return data;
  }

  async function loadWindows() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/api/admin/availability");
      setWindows(data.availabilityWindows || []);
      setIsUnlocked(true);
    } catch (loadError) {
      setError(loadError.message);
      setIsUnlocked(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedPassword = sessionStorage.getItem("flatVisitAdminPassword");
    if (savedPassword) setPassword(savedPassword);
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    sessionStorage.setItem("flatVisitAdminPassword", password);
    await loadWindows();
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(window) {
    setEditingId(window.id);
    setForm({
      date: window.date,
      start_time: window.start_time.slice(0, 5),
      end_time: window.end_time.slice(0, 5),
      slot_duration_minutes: window.slot_duration_minutes,
      is_active: window.is_active
    });
    setMessage("");
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (editingId) {
        await apiRequest(`/api/admin/availability/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });
        setMessage("חלון הזמינות עודכן.");
      } else {
        await apiRequest("/api/admin/availability", {
          method: "POST",
          body: JSON.stringify(form)
        });
        setMessage("חלון זמינות נוצר.");
      }

      resetForm();
      await loadWindows();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(window) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await apiRequest(`/api/admin/availability/${window.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...window, is_active: !window.is_active })
      });
      setMessage(window.is_active ? "חלון הזמינות כובה." : "חלון הזמינות הופעל.");
      await loadWindows();
    } catch (toggleError) {
      setError(toggleError.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteWindow(id) {
    const confirmed = window.confirm("למחוק את חלון הזמינות?");
    if (!confirmed) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await apiRequest(`/api/admin/availability/${id}`, { method: "DELETE" });
      setMessage("חלון הזמינות נמחק.");
      await loadWindows();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="topbar">
        <div>
          <p className="eyebrow">ניהול</p>
          <h1>חלונות זמינות</h1>
          <p className="subtitle">הגדרה ידנית של מועדי ביקור אפשריים</p>
        </div>
        <a href="/">לעמוד ההזמנה</a>
      </div>

      {!isUnlocked ? (
        <form className="panel" onSubmit={handleLogin}>
          <div className="field">
            <label htmlFor="admin-password">סיסמת מנהל</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="stack">
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "בודק..." : "כניסה לניהול"}
            </button>
            {error ? <div className="notice error">{error}</div> : null}
          </div>
        </form>
      ) : (
        <section className="admin-grid">
          <form className="panel" onSubmit={handleSubmit}>
            <h2>{editingId ? "עריכת חלון זמינות" : "יצירת חלון זמינות"}</h2>
            <div className="stack">
              <div className="field">
                <label htmlFor="date">תאריך</label>
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(event) => updateField("date", event.target.value)}
                  required
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="start-time">שעת התחלה</label>
                  <input
                    id="start-time"
                    type="time"
                    value={form.start_time}
                    onChange={(event) => updateField("start_time", event.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="end-time">שעת סיום</label>
                  <input
                    id="end-time"
                    type="time"
                    value={form.end_time}
                    onChange={(event) => updateField("end_time", event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="duration">משך כל ביקור בדקות</label>
                <input
                  id="duration"
                  type="number"
                  min="10"
                  max="180"
                  step="5"
                  value={form.slot_duration_minutes}
                  onChange={(event) =>
                    updateField("slot_duration_minutes", Number(event.target.value))
                  }
                  required
                />
              </div>
              <label className="field">
                <span>פעיל</span>
                <select
                  value={form.is_active ? "true" : "false"}
                  onChange={(event) =>
                    updateField("is_active", event.target.value === "true")
                  }
                >
                  <option value="true">כן</option>
                  <option value="false">לא</option>
                </select>
              </label>
              <div className="window-actions">
                <button className="primary-button" type="submit" disabled={loading}>
                  {editingId ? "שמירת שינויים" : "יצירת חלון"}
                </button>
                {editingId ? (
                  <button className="secondary-button" type="button" onClick={resetForm}>
                    ביטול עריכה
                  </button>
                ) : null}
              </div>
              {message ? <div className="notice success">{message}</div> : null}
              {error ? <div className="notice error">{error}</div> : null}
            </div>
          </form>

          <div className="panel">
            <h2>חלונות קיימים</h2>
            <div className="window-list">
              {windows.length === 0 ? (
                <div className="notice">עוד אין חלונות זמינות.</div>
              ) : null}
              {windows.map((window) => (
                <article className="window-row" key={window.id}>
                  <div className="window-summary">
                    <div>
                      <h3>{window.date}</h3>
                      <p>
                        {window.start_time.slice(0, 5)} -{" "}
                        {window.end_time.slice(0, 5)} ·{" "}
                        {window.slot_duration_minutes} דקות
                      </p>
                    </div>
                    <span className="badge">{window.is_active ? "פעיל" : "כבוי"}</span>
                  </div>
                  <div className="window-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => startEdit(window)}
                    >
                      עריכה
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => toggleActive(window)}
                    >
                      {window.is_active ? "כיבוי" : "הפעלה"}
                    </button>
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => deleteWindow(window.id)}
                    >
                      מחיקה
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
