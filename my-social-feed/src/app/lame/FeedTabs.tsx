"use client";
import React from "react";

const TAB_LABELS: Record<string, string> = {
  algo: "Algo",
  following: "Following",
};

type Props = {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
};

export default function FeedTabs({ tabs, activeTab, onChange }: Props) {
  return (
    <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            marginRight: "10px",
            padding: "10px",
            backgroundColor: activeTab === tab ? "#ccc" : "#fff",
            border: "1px solid #ccc",
            color: activeTab === tab ? "#000" : "#333",
            cursor: "pointer",
            textTransform: "capitalize",
          }}
        >
          {TAB_LABELS[tab] ?? tab}
        </button>
      ))}
    </div>
  );
}
