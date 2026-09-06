"use client";

import { useState } from "react";
import { XIcon } from "@/components/Icons";

export function DashboardShell({
  logo,
  nav,
  footer,
  headerActions,
  children,
}: {
  logo: React.ReactNode;
  nav: React.ReactNode;
  footer: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className="dash-shell">
      <div className="dash-mobile-bar">
        <button
          type="button"
          className="dash-menu-toggle"
          onClick={() => setMenuOuvert(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOuvert}
        >
          <span />
          <span />
          <span />
        </button>
        {logo}
        <div className="dash-mobile-bar-actions">{headerActions}</div>
      </div>

      <aside className={`dash-sidebar ${menuOuvert ? "dash-sidebar-open" : ""}`}>
        <div className="dash-sidebar-desktop-logo">{logo}</div>
        <button
          type="button"
          className="dash-sidebar-close"
          onClick={() => setMenuOuvert(false)}
          aria-label="Fermer le menu"
        >
          <XIcon size={18} />
        </button>
        <nav className="dash-nav" onClick={() => setMenuOuvert(false)}>
          {nav}
        </nav>
        {footer}
      </aside>

      {menuOuvert && (
        <div className="dash-sidebar-backdrop" onClick={() => setMenuOuvert(false)} aria-hidden="true" />
      )}

      <div className="dash-content">
        <div className="dash-topbar">
          <div className="dash-topbar-actions">{headerActions}</div>
        </div>
        <main className="dash-main">{children}</main>
      </div>
    </div>
  );
}

