"use client";
import React, { forwardRef, useState } from "react";
import type { SortKey, TypeFilter } from "./types";
import { SORT_KEYS, TYPE_FILTERS } from "./types";
import {
  EXCEL,
  FONT_FAMILY,
  RIBBON_TABS,
  SORT_LABELS,
  TITLEBAR_BOTTOM_GAP_PX,
  TYPE_FILTER_LABELS,
  type FunButton,
  type RibbonTab,
} from "./constants";
import { TAB_TOOLBAR_GROUPS } from "./toolbarTabs";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (v: TypeFilter) => void;
  loading: boolean;
  onRefresh: () => void;
  onFunAction: (message: string) => void;
};

const CONTROL_HEIGHT_PX = 26;
const SEARCH_WIDTH_PX = 200;
const TAB_HEIGHT_PX = 30;
const TOOLBAR_HEIGHT_PX = 66;

const controlStyle: React.CSSProperties = {
  height: CONTROL_HEIGHT_PX,
  border: `1px solid ${EXCEL.formulaBarBorder}`,
  borderRadius: 2,
  padding: "0 8px",
  fontSize: 12,
  fontFamily: FONT_FAMILY,
  background: "#fff",
  color: EXCEL.cellText,
};

/** One decorative fake button. It doesn't do anything real but does show a
    toast so the illusion has feedback. */
function FunButtonEl({ btn, onFire }: { btn: FunButton; onFire: (msg: string) => void }) {
  return (
    <button
      data-testid={`ledger-fun-${btn.key}`}
      title={btn.title}
      onClick={() => onFire(btn.toast)}
      style={{
        height: CONTROL_HEIGHT_PX,
        minWidth: CONTROL_HEIGHT_PX,
        border: `1px solid transparent`,
        borderRadius: 2,
        padding: "0 6px",
        fontSize: 12,
        fontWeight: btn.bold ? 700 : 400,
        fontFamily: FONT_FAMILY,
        background: "transparent",
        color: EXCEL.cellText,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#e6e6e6")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {btn.label}
    </button>
  );
}

/** Excel-style ribbon: menu tab strip on top + toolbar with fake buttons +
    the real search/sort/type/refresh controls. forwardRef exposes the search
    <input> so keyboard shortcuts can focus it. */
const Ribbon = forwardRef<HTMLInputElement, Props>(function Ribbon(props, searchRef) {
  const {
    search, onSearchChange,
    sort, onSortChange,
    typeFilter, onTypeFilterChange,
    loading, onRefresh, onFunAction,
  } = props;

  const [activeTab, setActiveTab] = useState<RibbonTab>("Home");
  const groups = TAB_TOOLBAR_GROUPS[activeTab];

  return (
    <div data-testid="ledger-ribbon" style={{ fontFamily: FONT_FAMILY }}>
      {/* Thin gap strip so the tab labels don't kiss the green title bar. */}
      <div style={{ height: TITLEBAR_BOTTOM_GAP_PX, background: EXCEL.ribbonBg }} />

      {/* Menu tab strip (File / Home / Insert / ...) */}
      <div
        data-testid="ledger-ribbon-tabs"
        style={{
          background: EXCEL.header,
          borderBottom: `1px solid ${EXCEL.gridLine}`,
          display: "flex",
          height: TAB_HEIGHT_PX,
          alignItems: "center",
          padding: "0 8px",
          gap: 2,
        }}
      >
        {RIBBON_TABS.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              data-testid={`ledger-tab-${tab.toLowerCase()}`}
              onClick={() => setActiveTab(tab)}
              style={{
                height: TAB_HEIGHT_PX,
                padding: "0 14px",
                border: "none",
                background: isActive ? "#fff" : "transparent",
                borderBottom: isActive ? `2px solid ${EXCEL.green}` : "2px solid transparent",
                fontSize: 13,
                fontFamily: FONT_FAMILY,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? EXCEL.green : EXCEL.cellText,
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Toolbar: fake button groups (per active tab) then the real controls */}
      <div
        data-testid={`ledger-toolbar-${activeTab.toLowerCase()}`}
        style={{
          background: EXCEL.ribbonBg,
          borderBottom: `1px solid ${EXCEL.gridLine}`,
          height: TOOLBAR_HEIGHT_PX,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 8px",
          overflowX: "auto",
        }}
      >
        {groups.map((group) => (
          <div
            key={group.title}
            data-testid={`ledger-group-${group.title.toLowerCase()}`}
            style={{
              display: "flex",
              flexDirection: "column",
              borderRight: `1px solid ${EXCEL.gridLine}`,
              paddingRight: 6,
              marginRight: 2,
              height: TOOLBAR_HEIGHT_PX - 6,
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {group.buttons.map((btn) => (
                <FunButtonEl key={btn.key} btn={btn} onFire={onFunAction} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: EXCEL.subtleText, textAlign: "center", marginBottom: 2 }}>
              {group.title}
            </div>
          </div>
        ))}

        {/* Real controls, right-aligned */}
        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: EXCEL.subtleText }}>Search</span>
          <input
            ref={searchRef}
            data-testid="ledger-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Find in workbook"
            style={{ ...controlStyle, width: SEARCH_WIDTH_PX }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: EXCEL.subtleText }}>Sort</span>
          <select
            data-testid="ledger-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            style={controlStyle}
          >
            {SORT_KEYS.map((k) => (<option key={k} value={k}>{SORT_LABELS[k]}</option>))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: EXCEL.subtleText }}>Type</span>
          <select
            data-testid="ledger-type"
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as TypeFilter)}
            style={controlStyle}
          >
            {TYPE_FILTERS.map((k) => (<option key={k} value={k}>{TYPE_FILTER_LABELS[k]}</option>))}
          </select>
        </div>

        <button
          data-testid="ledger-refresh"
          onClick={onRefresh}
          disabled={loading}
          style={{ ...controlStyle, cursor: loading ? "wait" : "pointer", padding: "0 12px" }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </div>
  );
});

export default Ribbon;
