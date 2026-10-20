"use client";
import React from "react";
import { EXCEL, FONT_FAMILY } from "./constants";

type Props = {
  value: string;
  align: React.CSSProperties["textAlign"];
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

/** The input rendered inside a cell that's being edited. Enter commits,
    Escape cancels, blur commits (Excel behavior). Click/dblclick are stopped
    so the wrapping cell's select/edit handlers don't fight the input. */
export default function EditableCell({ value, align, onChange, onCommit, onCancel }: Props) {
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); onCommit(); }
        else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
      }}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        outline: "none",
        background: "transparent",
        padding: 0,
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        textAlign: align,
        color: EXCEL.cellText,
      }}
    />
  );
}
