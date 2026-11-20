"use client";

import { useEffect, useId, useRef, useState } from "react";

import { logoutAction } from "@/app/actions/auth";
import type { Dictionary } from "@/lib/i18n";

type MenuUser = {
  email: string;
  username: string;
  trackingId: string;
  name: string | null;
};

export function UserMenu({
  user,
  dict,
}: {
  user: MenuUser;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={wrapRef}>
      <button
        type="button"
        className="logo-btn"
        aria-label={dict.account.menuAria}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="logo-mark">
          <img src="/images/logo.png" alt="" />
        </span>
      </button>

      {open ? (
        <div id={menuId} className="menu-panel">
          <div className="menu-head">
            <strong>{user.name || user.username}</strong>
            <span dir="ltr">{user.email}</span>
          </div>

          <dl className="menu-list">
            <div>
              <dt>{dict.account.username}</dt>
              <dd dir="ltr">@{user.username}</dd>
            </div>
            <div>
              <dt>{dict.account.trackingId}</dt>
              <dd dir="ltr">{user.trackingId}</dd>
            </div>
          </dl>

          <form action={logoutAction}>
            <button className="logout-btn" type="submit">
              {dict.account.logout}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
