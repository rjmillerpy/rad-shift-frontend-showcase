"use client";
import React from "react";
import { APP_WORDMARK, EXCEL, FAKE_WORKBOOK_TITLE, FONT_FAMILY } from "./constants";

/** Fake office-green title bar with a workbook filename. The illusion holds
    the longer a colleague-over-your-shoulder looks. */
export default function TitleBar() {
  return (
    <div
      data-testid="ledger-title-bar"
      style={{
        background: EXCEL.titleBarBg,
        color: EXCEL.titleBarText,
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        userSelect: "none",
      }}
    >
      <span data-testid="ledger-wordmark" style={{ fontWeight: 600 }}>{APP_WORDMARK}</span>
      <span data-testid="ledger-workbook-title">{FAKE_WORKBOOK_TITLE}</span>
      <span style={{ opacity: 0.75, fontSize: 11 }}>Autosave · On</span>
    </div>
  );
}
