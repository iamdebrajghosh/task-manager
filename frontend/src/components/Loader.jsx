import React from "react";

export default function Loader({ size = "sm", label }) {
  const cls = size === "lg" ? "spinner-border" : "spinner-border spinner-border-sm";
  return (
    <span className="d-inline-flex align-items-center gap-2">
      <span className={cls} role="status" aria-hidden="true" />
      {label ? <span className="small text-muted">{label}</span> : null}
    </span>
  );
}
