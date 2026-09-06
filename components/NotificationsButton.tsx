"use client";

import { useEffect, useRef, useState } from "react";
import { BellIcon } from "@/components/Icons";
import { chargerNotifications, type Notification } from "@/lib/notifications";

export function NotificationsButton() {
  const [ouvert, setOuvert] = useState(false);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert || notifications !== null) return;
    chargerNotifications().then(setNotifications);
  }, [ouvert, notifications]);

  useEffect(() => {
    if (!ouvert) return;

    function surClicExterieur(e: MouseEvent) {
      if (!conteneurRef.current?.contains(e.target as Node)) setOuvert(false);
    }
    function surEchap(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("mousedown", surClicExterieur);
    document.addEventListener("keydown", surEchap);
    return () => {
      document.removeEventListener("mousedown", surClicExterieur);
      document.removeEventListener("keydown", surEchap);
    };
  }, [ouvert]);

  const aDesNotifications = (notifications?.length ?? 0) > 0;

  return (
    <div className="notif-wrap" ref={conteneurRef}>
      <button
        type="button"
        className="notif-btn"
        aria-label="Notifications"
        aria-expanded={ouvert}
        onClick={() => setOuvert((v) => !v)}
      >
        <BellIcon size={19} />
        {aDesNotifications && <span className="notif-dot" aria-hidden="true" />}
      </button>

      {ouvert && (
        <div className="notif-popover" role="menu">
          <div className="notif-popover-title">Notifications</div>
          {notifications === null ? (
            <div className="notif-empty">Chargement...</div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty">Aucune notification pour le moment.</div>
          ) : (
            <ul className="notif-list">
              {notifications.map((n) => (
                <li key={n.id} className="notif-item">
                  {n.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
