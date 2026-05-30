"use client";

import { useEffect, useMemo, useState } from "react";
import { formatSlotDate, formatSlotTime } from "@/lib/time";

export default function BookingPage() {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function loadSlots() {
    setLoadingSlots(true);
    setError("");

    try {
      const response = await fetch("/api/slots", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "לא ניתן לטעון מועדים.");

      setSlots(data.slots || []);
      setSelectedSlot(null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    loadSlots();
  }, []);

  const groupedSlots = useMemo(() => {
    return slots.reduce((groups, slot) => {
      const label = formatSlotDate(slot.start);
      groups[label] = groups[label] || [];
      groups[label].push(slot);
      return groups;
    }, {});
  }, [slots]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!selectedSlot) {
      setError("יש לבחור מועד פנוי.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          start: selectedSlot.start,
          end: selectedSlot.end
        })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "לא ניתן לקבוע ביקור.");

      setSuccess(true);
      setName("");
      setPhone("");
      setSelectedSlot(null);
      await loadSlots();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page booking-page">
      <section className="hero booking-hero">
        <div className="hero-copy">
          <p className="eyebrow">ביקור בדירה</p>
          <h1>קביעת ביקור בדירה</h1>
          <p className="subtitle">בחרו מועד פנוי והשאירו פרטים</p>
          <div className="hero-meta" aria-label="פרטי התהליך">
            <span>מועדים מתעדכנים בזמן אמת</span>
            <span>אישור מיידי ביומן</span>
          </div>
        </div>

        <form className="panel booking-form" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <h2>הפרטים שלכם</h2>
            <p>נשתמש בפרטים רק לתיאום הביקור.</p>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">שם פרטי</label>
              <input
                id="name"
                autoComplete="given-name"
                placeholder="לדוגמה: דניאל"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="phone">מספר טלפון</label>
              <input
                id="phone"
                autoComplete="tel"
                inputMode="tel"
                placeholder="לדוגמה: 050-1234567"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="stack">
            {selectedSlot ? (
              <div className="notice">
                המועד שנבחר: {formatSlotDate(selectedSlot.start)},{" "}
                {formatSlotTime(selectedSlot.start)} - {formatSlotTime(selectedSlot.end)}
              </div>
            ) : null}
            <button
              className="primary-button"
              type="submit"
              disabled={submitting || loadingSlots || !selectedSlot}
            >
              {submitting
                ? "קובע ביקור..."
                : selectedSlot
                  ? "קביעת ביקור"
                  : "בחרו מועד כדי להמשיך"}
            </button>
          </div>
        </form>
      </section>

      <section className="stack slots-section" aria-live="polite">
        <div className="section-heading">
          <h2>בחרו מועד פנוי</h2>
          <p>כל מועד נבדק מול ההזמנות הקיימות והיומן.</p>
        </div>

        {loadingSlots ? (
          <div className="notice state-card loading-state">
            <span className="spinner" aria-hidden="true" />
            טוען מועדים פנויים...
          </div>
        ) : null}
        {error ? <div className="notice error">{error}</div> : null}
        {success ? (
          <div className="notice success success-state">
            הביקור נקבע בהצלחה. נתראה בדירה.
          </div>
        ) : null}

        {!loadingSlots && slots.length === 0 ? (
          <div className="notice state-card empty-state">
            <strong>אין כרגע מועדים פנויים</strong>
            <span>אפשר לנסות שוב מאוחר יותר או לפנות אליי ישירות.</span>
          </div>
        ) : null}

        {Object.entries(groupedSlots).map(([dateLabel, daySlots]) => (
          <div className="panel day-panel" key={dateLabel}>
            <div className="day-heading">
              <h3>{dateLabel}</h3>
              <span>{daySlots.length} מועדים פנויים</span>
            </div>
            <div className="slots-grid">
              {daySlots.map((slot) => (
                <button
                  className="slot"
                  type="button"
                  key={`${slot.start}-${slot.end}`}
                  aria-pressed={selectedSlot?.start === slot.start}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <span className="slot-time">
                    {formatSlotTime(slot.start)} - {formatSlotTime(slot.end)}
                  </span>
                  <span className="slot-label">
                    {selectedSlot?.start === slot.start ? "נבחר" : "מועד פנוי"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
