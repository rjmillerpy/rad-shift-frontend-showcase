"use client";
import React, { useId } from "react";

/** The two kinds of row every settings page is made of. */

type RangeProps = {
  label: React.ReactNode;
  /** The current value as shown beside the label ("0.25", "16px"). */
  display: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  testId: string;
  /** Captions under the two ends of the slider. */
  hints?: readonly [React.ReactNode, React.ReactNode];
  fontSize?: number;
};

export function RangeSetting({ label, display, value, min, max, step, onChange, testId, hints, fontSize = 14 }: Readonly<RangeProps>) {
  const id = useId();
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={{ display: "flex", justifyContent: "space-between", fontSize }}>
        <span>{label}</span>
        <span style={{ fontWeight: "bold" }}>{display}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
        data-testid={testId}
      />
      {hints && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999" }}>
          <span>{hints[0]}</span>
          <span>{hints[1]}</span>
        </div>
      )}
    </div>
  );
}

type CheckboxProps<K extends string> = {
  options: ReadonlyArray<{ key: K; label: string }>;
  isChecked: (key: K) => boolean;
  onChange: (key: K, checked: boolean) => void;
  fontSize?: number;
  /** Space below each row, px. */
  spacing?: number;
};

export function CheckboxSettings<K extends string>({ options, isChecked, onChange, fontSize = 14, spacing = 12 }: Readonly<CheckboxProps<K>>) {
  return (
    <>
      {options.map(({ key, label }) => (
        <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: spacing }}>
          <input
            type="checkbox"
            checked={isChecked(key)}
            onChange={(e) => onChange(key, e.target.checked)}
            data-testid={`toggle-${key}`}
          />
          <span style={{ fontSize }}>{label}</span>
        </label>
      ))}
    </>
  );
}
