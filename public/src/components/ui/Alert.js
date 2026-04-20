// src/components/ui/Alert.js
import React from "react";

const ICONS = { error: "⚠", success: "✓", info: "ℹ" };

export default function Alert({ type = "error", children }) {
  return (
    <div className={`alert alert-${type}`}>
      <span>{ICONS[type]}</span>
      <span>{children}</span>
    </div>
  );
}
