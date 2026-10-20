"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import QuickActionMenu from "@/app/bubbles/QuickActionMenu";
import type { Post } from "@/types/post";

import TitleBar from "./TitleBar";
import Ribbon from "./Ribbon";
import FormulaBar from "./FormulaBar";
import ColumnHeaders from "./ColumnHeaders";
import ColumnResizeOverlays from "./ColumnResizeOverlays";
import PostRow from "./PostRow";
import EmptyRow from "./EmptyRow";
import SheetTabs from "./SheetTabs";
import StatusBar from "./StatusBar";

import type { SheetKey, SortKey, TypeFilter } from "./types";
import { useLedgerData } from "./useLedgerData";
import { useCellSelection } from "./useCellSelection";
import { useGridResize } from "./useGridResize";
import { useLedgerEditing, cellRawValue } from "./useLedgerEditing";
import { useLedgerActions } from "./useLedgerActions";
import { EMPTY_ROW_COUNT, EXCEL, FONT_FAMILY, ZOOM_DEFAULT_PCT, ZOOM_MIN_PCT, ZOOM_MAX_PCT } from "./constants";

const FUN_TOAST_MS = 2000;

// UI layout constants for floating page elements (rule 8).
const LOAD_MORE_BOTTOM_PX = 80;
const LOAD_MORE_RIGHT_PX = 24;
const LOAD_MORE_STEP = 25;
const TOAST_TOP_PX = 60;
const TOAST_RIGHT_PX = 20;
const TOAST_MAX_WIDTH_PX = 320;
const FLOATING_Z_INDEX = 100;
const TOAST_Z_INDEX = 9999;
const EMPTY_TEXT_COLOR = "#666";
const EMPTY_PAD_PX = 20;

export default function LedgerPage() {
  const { token } = useAuth();

  const [sheet, setSheet] = useState<SheetKey>("algo");
  const [sort, setSort] = useState<SortKey>("recent");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [zoomPct, setZoomPct] = useState(ZOOM_DEFAULT_PCT);
  const [contextMenu, setContextMenu] = useState<{ post: Post; x: number; y: number } | null>(null);
  const [funToast, setFunToast] = useState<string | null>(null);

  const { rows, loading, totalLikes, totalAvailable, hasMore, loadMore, refresh } =
    useLedgerData({ sheet, sort, typeFilter, search, token });

  const { getColWidth, getRowHeight, startColResize, startRowResize } = useGridResize();

  const {
    editing, editDraft, setEditDraft,
    getEdit, startEdit, commitEdit, cancelEdit,
  } = useLedgerEditing({ rows, resetKey: sheet });

  // Clear the toast after a short delay; rule 71 — clean up the timer on
  // unmount or when the message changes.
  useEffect(() => {
    if (!funToast) return;
    const timer = setTimeout(() => setFunToast(null), FUN_TOAST_MS);
    return () => clearTimeout(timer);
  }, [funToast]);

  const searchRef = useRef<HTMLInputElement>(null);
  const focusSearch = useCallback(() => searchRef.current?.focus(), []);

  // Pressing Enter on the selected cell edits it. We use a ref for the current
  // selection column so the cell-selection hook's stable keydown listener
  // doesn't need to re-register on every arrow-key change.
  const editSelectedRef = useRef<(rowIndex: number) => void>(() => {});
  const editSelectedCell = useCallback((rowIndex: number) => {
    editSelectedRef.current(rowIndex);
  }, []);

  const { selection, selectCell } = useCellSelection({
    rowCount: rows.length,
    onOpenRow: editSelectedCell,
    onFocusSearch: focusSearch,
  });

  editSelectedRef.current = (rowIndex: number) => startEdit(rowIndex, selection.col);

  const selectedRow = rows[selection.row];
  const selectedRowNumber = rows.length > 0 ? selection.row + 1 : 0;
  const isEditingSelected =
    editing && editing.row === selection.row && editing.col === selection.col;
  const formulaText = isEditingSelected
    ? editDraft
    : (getEdit(selection.row, selection.col) ?? cellRawValue(selectedRow, selection.col));

  const closeContextMenu = useCallback(() => setContextMenu(null), []);
  const handleQuickAction = useLedgerActions(closeContextMenu);

  const openContextMenu = useCallback((rowIndex: number, x: number, y: number) => {
    const row = rows[rowIndex];
    if (row) setContextMenu({ post: row.post, x, y });
  }, [rows]);

  const handleZoomChange = useCallback((v: number) => {
    setZoomPct(Math.max(ZOOM_MIN_PCT, Math.min(ZOOM_MAX_PCT, v)));
  }, []);

  const zoomStyle = useMemo<React.CSSProperties>(() => ({
    // Whole-workbook zoom: scale the grid area's font-size.
    fontSize: (12 * zoomPct) / ZOOM_DEFAULT_PCT,
  }), [zoomPct]);

  return (
    <div
      data-testid="ledger-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
      }}
    >
      <TitleBar />
      <Ribbon
        ref={searchRef}
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        loading={loading}
        onRefresh={refresh}
        onFunAction={setFunToast}
      />
      <FormulaBar coord={selection} rowNumber={selectedRowNumber} cellText={formulaText} />

      <div style={{ ...zoomStyle, overflow: "auto", flex: 1 }}>
        {/* Inner wrapper is position:relative + fit-content so the absolute
            ColumnResizeOverlays span the true content height and width. */}
        <div style={{ position: "relative", width: "fit-content", minWidth: "100%" }}>
        <ColumnHeaders getColWidth={getColWidth} />
        {rows.length === 0 && !loading && (
          <div data-testid="ledger-empty" style={{ padding: EMPTY_PAD_PX, color: EMPTY_TEXT_COLOR }}>
            No posts to display.
          </div>
        )}
        {rows.map((row, i) => (
          <PostRow
            key={row.post.id}
            row={row}
            rowIndex={i}
            rowNumber={i + 1}
            selected={i === selection.row}
            selectedCol={selection.col}
            height={getRowHeight(i)}
            editingCol={editing?.row === i ? editing.col : null}
            editDraft={editDraft}
            getEdit={getEdit}
            getColWidth={getColWidth}
            onRowResizeStart={startRowResize}
            onSelectCell={selectCell}
            onStartEdit={startEdit}
            onChangeEdit={setEditDraft}
            onCommitEdit={commitEdit}
            onCancelEdit={cancelEdit}
            onContextMenu={openContextMenu}
          />
        ))}
        {/* Empty filler rows below the last post so the sheet keeps going. */}
        {Array.from({ length: EMPTY_ROW_COUNT }, (_, i) => {
          const emptyIdx = rows.length + i;
          return (
            <EmptyRow
              key={`empty-${emptyIdx}`}
              rowIndex={emptyIdx}
              rowNumber={emptyIdx + 1}
              height={getRowHeight(emptyIdx)}
              editingCol={editing?.row === emptyIdx ? editing.col : null}
              editDraft={editDraft}
              getEdit={getEdit}
              getColWidth={getColWidth}
              onRowResizeStart={startRowResize}
              onStartEdit={startEdit}
              onChangeEdit={setEditDraft}
              onCommitEdit={commitEdit}
              onCancelEdit={cancelEdit}
            />
          );
        })}
        <ColumnResizeOverlays getColWidth={getColWidth} onColResizeStart={startColResize} />
        </div>
      </div>

      <SheetTabs active={sheet} onChange={setSheet} />
      <StatusBar
        loading={loading}
        rowCount={rows.length}
        selectedRowNumber={selectedRowNumber}
        totalLikes={totalLikes}
        zoomPct={zoomPct}
        onZoomChange={handleZoomChange}
      />

      {contextMenu && (
        <QuickActionMenu
          post={contextMenu.post}
          x={contextMenu.x}
          y={contextMenu.y}
          onAction={handleQuickAction}
          onClose={closeContextMenu}
        />
      )}

      {hasMore && (
        <button
          data-testid="ledger-load-more"
          onClick={loadMore}
          style={{
            position: "fixed",
            bottom: LOAD_MORE_BOTTOM_PX,
            right: LOAD_MORE_RIGHT_PX,
            fontFamily: FONT_FAMILY,
            fontSize: 13,
            padding: "10px 20px",
            background: EXCEL.green,
            color: "#fff",
            border: "none",
            borderRadius: 24,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            zIndex: FLOATING_Z_INDEX,
          }}
        >
          Load {Math.min(LOAD_MORE_STEP, totalAvailable - rows.length)} more rows
          <span style={{ marginLeft: 8, opacity: 0.8 }}>
            ({rows.length} of {totalAvailable})
          </span>
        </button>
      )}

      {funToast && (
        <div
          data-testid="ledger-fun-toast"
          style={{
            position: "fixed",
            top: TOAST_TOP_PX,
            right: TOAST_RIGHT_PX,
            padding: "10px 16px",
            background: EXCEL.cellText,
            color: "#fff",
            borderRadius: 3,
            fontFamily: FONT_FAMILY,
            fontSize: 13,
            zIndex: TOAST_Z_INDEX,
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            maxWidth: TOAST_MAX_WIDTH_PX,
          }}
        >
          {funToast}
        </div>
      )}
    </div>
  );
}
