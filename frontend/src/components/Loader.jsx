import React from "react";

export default function Loader({ size = "sm" }) {
  const cls = size === "lg" ? "spinner-border" : "spinner-border spinner-border-sm";
  return <span className={cls} role="status" aria-hidden="true" />;
}