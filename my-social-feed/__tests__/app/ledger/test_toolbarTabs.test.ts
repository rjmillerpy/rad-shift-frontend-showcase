import { RIBBON_TABS } from "@/app/ledger/constants";
import { TAB_TOOLBAR_GROUPS } from "@/app/ledger/toolbarTabs";

describe("TAB_TOOLBAR_GROUPS", () => {
  it("has an entry for every ribbon tab", () => {
    for (const tab of RIBBON_TABS) {
      expect(TAB_TOOLBAR_GROUPS[tab]).toBeDefined();
    }
  });

  it("every tab has at least one group with at least one button", () => {
    for (const tab of RIBBON_TABS) {
      const groups = TAB_TOOLBAR_GROUPS[tab];
      expect(groups.length).toBeGreaterThan(0);
      for (const g of groups) {
        expect(g.buttons.length).toBeGreaterThan(0);
      }
    }
  });

  it("every button has a non-empty toast so the illusion has feedback", () => {
    for (const tab of RIBBON_TABS) {
      for (const g of TAB_TOOLBAR_GROUPS[tab]) {
        for (const btn of g.buttons) {
          expect(btn.toast.length).toBeGreaterThan(0);
          expect(btn.key.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
