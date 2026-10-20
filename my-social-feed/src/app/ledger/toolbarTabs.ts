import type { FunButtonGroup, RibbonTab } from "./constants";
import { TOOLBAR_GROUPS } from "./constants";

/**
 * Per-tab fake toolbar content. The Home tab reuses the original
 * Clipboard/Font/Alignment/Number/Insert groups. Every other tab is pure
 * decoration — clicking a button fires a short toast so the illusion feels
 * alive without doing anything real.
 *
 * Kept as a flat data structure (rule 44) so adding a tab means adding one
 * entry here, not touching the Ribbon render code.
 */
export const TAB_TOOLBAR_GROUPS: Record<RibbonTab, FunButtonGroup[]> = {
  File: [
    {
      title: "File",
      buttons: [
        { key: "new",     label: "🗎 New",     title: "New Workbook", toast: "New workbook created (in a parallel universe)" },
        { key: "open",    label: "📂 Open",    title: "Open",         toast: "Recent files: hopes_and_dreams_2019.xlsx" },
        { key: "save",    label: "💾 Save",    title: "Save",         toast: "Autosaved ✓" },
        { key: "saveas",  label: "Save As",    title: "Save As",      toast: "Save As \"FINAL_final_v3_actually_final.xlsx\"" },
        { key: "print",   label: "🖨 Print",   title: "Print",        toast: "Sent 47 pages to Printer 3-Floor" },
        { key: "share",   label: "🔗 Share",   title: "Share",        toast: "Link copied — send it to Karen" },
        { key: "export",  label: "📤 Export",  title: "Export",       toast: "Exported to PDF (in your dreams)" },
        { key: "close",   label: "✕ Close",    title: "Close",        toast: "Nope, we're not letting you leave" },
      ],
    },
  ],

  Home: TOOLBAR_GROUPS,

  Insert: [
    {
      title: "Tables",
      buttons: [
        { key: "table",  label: "▦ Table",       title: "Table",       toast: "Table inserted" },
        { key: "pivot2", label: "PivotTable",    title: "PivotTable",  toast: "PivotTable summoned" },
      ],
    },
    {
      title: "Illustrations",
      buttons: [
        { key: "pic",    label: "🖼 Picture",    title: "Picture",     toast: "Insert picture from device (jk no)" },
        { key: "shape",  label: "◆ Shape",       title: "Shape",       toast: "🔷 shape inserted" },
        { key: "icon",   label: "★ Icon",        title: "Icon",        toast: "Icon library opened" },
        { key: "3dmodel",label: "🎲 3D Model",   title: "3D Model",    toast: "Rotating your 3D pivot chart" },
      ],
    },
    {
      title: "Charts",
      buttons: [
        { key: "chart2",  label: "📊 Column",    title: "Column Chart", toast: "📊 chart inserted" },
        { key: "line",    label: "📈 Line",      title: "Line Chart",   toast: "📈 up-and-to-the-right chart inserted" },
        { key: "pie",     label: "🥧 Pie",       title: "Pie Chart",    toast: "Everyone gets a slice" },
      ],
    },
  ],

  Draw: [
    {
      title: "Tools",
      buttons: [
        { key: "pen",     label: "✒ Pen",         title: "Pen",         toast: "Pen selected — draw at your own risk" },
        { key: "hilite",  label: "🖍 Highlighter", title: "Highlighter", toast: "Neon yellow ready" },
        { key: "eraser",  label: "🧽 Eraser",     title: "Eraser",      toast: "Cannot erase your mistakes, only ink" },
        { key: "lasso",   label: "○ Lasso",       title: "Lasso Select",toast: "Yeehaw" },
      ],
    },
    {
      title: "Convert",
      buttons: [
        { key: "ink2shape", label: "Ink → Shape", title: "Ink to Shape", toast: "Your squiggle is now a rectangle" },
        { key: "ink2text",  label: "Ink → Text",  title: "Ink to Text",  toast: "Handwriting: 'help me'" },
      ],
    },
  ],

  Formulas: [
    {
      title: "Function Library",
      buttons: [
        { key: "autosum", label: "Σ AutoSum",   title: "AutoSum",     toast: "=SUM(A1:A?) — 0" },
        { key: "recent",  label: "Recent",      title: "Recently Used",toast: "=IF, =VLOOKUP, =PIVOT_MY_LIFE" },
        { key: "fin",     label: "$ Financial", title: "Financial",   toast: "=NPV(0.05, layoffs)" },
        { key: "logic",   label: "? Logical",   title: "Logical",     toast: "=IF(boss_looking, LOOK_BUSY(), SCROLL())" },
        { key: "text",    label: "A Text",      title: "Text",        toast: "=CONCAT(gossip, more_gossip)" },
        { key: "date",    label: "📅 Date&Time",title: "Date & Time", toast: "=TODAY() → Monday. Always Monday." },
        { key: "lookup",  label: "🔎 Lookup",   title: "Lookup",      toast: "=VLOOKUP(that_email, inbox, 2, FALSE)" },
      ],
    },
    {
      title: "Auditing",
      buttons: [
        { key: "trace",   label: "→ Trace",      title: "Trace Precedents", toast: "Tracing… everything leads back to Bob" },
        { key: "showall", label: "Show Formulas",title: "Show Formulas",    toast: "Now you see them" },
        { key: "eval",    label: "▶ Evaluate",   title: "Evaluate Formula", toast: "Evaluated to #REF!" },
      ],
    },
  ],

  Data: [
    {
      title: "Get Data",
      buttons: [
        { key: "getweb",   label: "🌐 From Web",   title: "From Web",   toast: "Pulling from web (definitely secure)" },
        { key: "getfile",  label: "📄 From File",  title: "From File",  toast: "Which file? There are 4,203" },
        { key: "getdb",    label: "🗄 From DB",    title: "From Database", toast: "Contact IT for credentials" },
      ],
    },
    {
      title: "Sort & Filter",
      buttons: [
        { key: "sortaz",   label: "A→Z",         title: "Sort A to Z", toast: "Sorted ascending" },
        { key: "sortza",   label: "Z→A",         title: "Sort Z to A", toast: "Sorted descending" },
        { key: "filter",   label: "🔽 Filter",    title: "Filter",     toast: "Filter dropdowns added to headers" },
        { key: "clear",    label: "✕ Clear",     title: "Clear Filter",toast: "Filters cleared" },
      ],
    },
    {
      title: "Tools",
      buttons: [
        { key: "text2col", label: "Text to Cols", title: "Text to Columns", toast: "Split by commas — poorly" },
        { key: "dedup",    label: "Remove Dupes", title: "Remove Duplicates", toast: "Removed 0 duplicates" },
        { key: "whatif",   label: "What-If",     title: "What-If Analysis", toast: "What if you took the day off?" },
      ],
    },
  ],

  Review: [
    {
      title: "Proofing",
      buttons: [
        { key: "spell",   label: "ABC Spelling",  title: "Spell Check", toast: "\"teh\" → \"the\" (fixed)" },
        { key: "thesaur", label: "📚 Thesaurus",  title: "Thesaurus",   toast: "\"synergy\" → \"buzzword\"" },
        { key: "trans",   label: "🌍 Translate",  title: "Translate",   toast: "Translated to Corporate Speak" },
      ],
    },
    {
      title: "Comments",
      buttons: [
        { key: "newcom",  label: "💬 New",        title: "New Comment", toast: "Added: \"per my last email\"" },
        { key: "delcom",  label: "🗑 Delete",     title: "Delete Comment", toast: "Comment deleted (screenshot saved)" },
        { key: "next",    label: "▶ Next",        title: "Next Comment", toast: "Next passive-aggressive note" },
      ],
    },
    {
      title: "Protect",
      buttons: [
        { key: "protsh",  label: "🔒 Protect Sheet", title: "Protect Sheet", toast: "Password: 'password' (nice)" },
        { key: "protwb",  label: "🔐 Protect Workbook", title: "Protect Workbook", toast: "Workbook locked from your future self" },
      ],
    },
  ],

  View: [
    {
      title: "Workbook Views",
      buttons: [
        { key: "normal",  label: "▤ Normal",       title: "Normal",       toast: "Normal view" },
        { key: "pagelay", label: "📄 Page Layout", title: "Page Layout",  toast: "Page Layout view — cramped" },
        { key: "pageprv", label: "🔍 Page Preview",title: "Page Preview", toast: "58 pages. Cancel!" },
      ],
    },
    {
      title: "Show",
      buttons: [
        { key: "grid",    label: "⌗ Gridlines",    title: "Gridlines",    toast: "Gridlines toggled" },
        { key: "headers2",label: "Headings",       title: "Headings",     toast: "Row/col headings toggled" },
        { key: "fbar",    label: "fx Formula Bar", title: "Formula Bar",  toast: "Formula Bar toggled" },
      ],
    },
    {
      title: "Window",
      buttons: [
        { key: "freeze",  label: "❄ Freeze",       title: "Freeze Panes", toast: "Top row frozen" },
        { key: "split",   label: "◫ Split",        title: "Split",        toast: "Window split — chaos" },
        { key: "arrange", label: "🗔 Arrange",     title: "Arrange All",  toast: "Arranged all 8 open workbooks" },
      ],
    },
  ],

  Automate: [
    {
      title: "Scripts",
      buttons: [
        { key: "rec",     label: "⏺ Record",     title: "Record Macro", toast: "Recording… (say something interesting)" },
        { key: "stop",    label: "⏹ Stop",       title: "Stop Recording", toast: "Recording saved as Macro1" },
        { key: "run",     label: "▶ Run",        title: "Run Macro",    toast: "Macro1 ran successfully. Nothing happened." },
        { key: "vba",     label: "VBA Editor",   title: "VBA Editor",   toast: "Sub HelloWorld() ' TODO: everything" },
      ],
    },
    {
      title: "Cloud",
      buttons: [
        { key: "flow",    label: "⚡ Power Automate", title: "Power Automate", toast: "Flow created: When X then Y" },
        { key: "aiscript",label: "🤖 AI Script",     title: "AI Script",      toast: "AI wrote 400 lines. 3 work." },
      ],
    },
  ],

  Help: [
    {
      title: "Help",
      buttons: [
        { key: "search",  label: "🔍 Search",     title: "Search Help",  toast: "Try: 'how do I quit'" },
        { key: "contact", label: "☎ Contact",     title: "Contact Us",   toast: "Wait time: 47 minutes" },
        { key: "feedback",label: "💌 Feedback",   title: "Send Feedback",toast: "Feedback sent to /dev/null" },
        { key: "about",   label: "ⓘ About",       title: "About",        toast: "Sheets v1.0.0 — Now with fewer crashes" },
        { key: "whatsnew",label: "✨ What's New", title: "What's New",   toast: "New: The same features, but different" },
      ],
    },
  ],
};
