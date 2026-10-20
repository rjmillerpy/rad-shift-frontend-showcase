import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));
jest.mock("next/link", () => ({ children, href, ...props }: any) => React.createElement("a", { href, ...props }, children));

import FeedChooserPage from "@/app/page";

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe("FeedChooserPage", () => {
  describe("Rendering", () => {
    it("shows RadShift title", () => {
      render(<FeedChooserPage />);
      expect(screen.getByText("RadShift")).toBeInTheDocument();
    });

    it("shows choose your experience subtitle", () => {
      render(<FeedChooserPage />);
      expect(screen.getByText("Choose your experience")).toBeInTheDocument();
    });

    it("shows all six feed options", () => {
      render(<FeedChooserPage />);
      expect(screen.getByTestId("feed-bubbles")).toBeInTheDocument();
      expect(screen.getByTestId("feed-chronicle")).toBeInTheDocument();
      expect(screen.getByTestId("feed-agora")).toBeInTheDocument();
      expect(screen.getByTestId("feed-mosaic")).toBeInTheDocument();
      expect(screen.getByTestId("feed-ledger")).toBeInTheDocument();
      expect(screen.getByTestId("feed-amble")).toBeInTheDocument();
    });

    it("shows feed names and descriptions", () => {
      render(<FeedChooserPage />);
      expect(screen.getByText("Bubbles")).toBeInTheDocument();
      expect(screen.getByText("Chronicle")).toBeInTheDocument();
      expect(screen.getByText("Agora")).toBeInTheDocument();
      expect(screen.getByText("Mosaic")).toBeInTheDocument();
      expect(screen.getByText("Ledger")).toBeInTheDocument();
      expect(screen.getByText("Amble")).toBeInTheDocument();
      expect(screen.getByText(/Floating topic bubbles/)).toBeInTheDocument();
      expect(screen.getByText(/narrated as a story/)).toBeInTheDocument();
      expect(screen.getByText(/Classic forum-style/)).toBeInTheDocument();
      expect(screen.getByText(/visual moodboard/)).toBeInTheDocument();
      expect(screen.getByText(/disguised as a spreadsheet/)).toBeInTheDocument();
      expect(screen.getByText(/Wander a top-down town/)).toBeInTheDocument();
    });

    it("shows remember choice checkbox", () => {
      render(<FeedChooserPage />);
      expect(screen.getByTestId("remember-choice")).toBeInTheDocument();
      expect(screen.getByText("Remember my choice")).toBeInTheDocument();
    });

    it("shows login/signup links when not authenticated", () => {
      render(<FeedChooserPage />);
      expect(screen.getByText("Log In")).toBeInTheDocument();
      expect(screen.getByText("Sign Up")).toBeInTheDocument();
    });

    it("shows profile/blog/search links when authenticated", () => {
      localStorage.setItem("token", "test-token");
      render(<FeedChooserPage />);
      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Blog")).toBeInTheDocument();
      expect(screen.getByText("Search")).toBeInTheDocument();
      expect(screen.getByText("Classic Feed")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("navigates to bubbles when clicked (authenticated)", () => {
      localStorage.setItem("token", "test-token");
      render(<FeedChooserPage />);
      fireEvent.click(screen.getByTestId("feed-bubbles"));
      expect(mockPush).toHaveBeenCalledWith("/bubbles");
    });

    it("navigates to chronicle when clicked (authenticated)", () => {
      localStorage.setItem("token", "test-token");
      render(<FeedChooserPage />);
      fireEvent.click(screen.getByTestId("feed-chronicle"));
      expect(mockPush).toHaveBeenCalledWith("/chronicle");
    });

    it("navigates to agora when clicked (authenticated)", () => {
      localStorage.setItem("token", "test-token");
      render(<FeedChooserPage />);
      fireEvent.click(screen.getByTestId("feed-agora"));
      expect(mockPush).toHaveBeenCalledWith("/agora");
    });

    it("redirects to login with redirect param when not authenticated", () => {
      render(<FeedChooserPage />);
      fireEvent.click(screen.getByTestId("feed-bubbles"));
      expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Fbubbles");
    });

    it("redirects to login with chronicle redirect when not authenticated", () => {
      render(<FeedChooserPage />);
      fireEvent.click(screen.getByTestId("feed-chronicle"));
      expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Fchronicle");
    });
  });

  describe("Remember choice", () => {
    it("saves preferred feed to localStorage when remember is checked", () => {
      localStorage.setItem("token", "test-token");
      render(<FeedChooserPage />);

      fireEvent.click(screen.getByTestId("remember-choice"));
      fireEvent.click(screen.getByTestId("feed-agora"));

      expect(localStorage.getItem("preferred_feed")).toBe("agora");
    });

    it("does not save preference when remember is unchecked", () => {
      localStorage.setItem("token", "test-token");
      render(<FeedChooserPage />);

      fireEvent.click(screen.getByTestId("feed-agora"));

      expect(localStorage.getItem("preferred_feed")).toBeNull();
    });

    it("auto-redirects when preferred feed is saved", () => {
      localStorage.setItem("token", "test-token");
      localStorage.setItem("preferred_feed", "chronicle");

      render(<FeedChooserPage />);

      expect(mockReplace).toHaveBeenCalledWith("/chronicle");
    });

    it("does not auto-redirect without token even with preference", () => {
      localStorage.setItem("preferred_feed", "chronicle");

      render(<FeedChooserPage />);

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("does not auto-redirect with invalid preference", () => {
      localStorage.setItem("token", "test-token");
      localStorage.setItem("preferred_feed", "nonexistent");

      render(<FeedChooserPage />);

      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe("Hover effects", () => {
    it("applies hover state on mouse enter", () => {
      render(<FeedChooserPage />);
      const card = screen.getByTestId("feed-bubbles");

      fireEvent.mouseEnter(card);
      expect(card.style.transform).toContain("translateY");

      fireEvent.mouseLeave(card);
    });
  });

  describe("Security", () => {
    it("unauthenticated users cannot bypass to feeds", () => {
      render(<FeedChooserPage />);

      // All feeds should redirect to login
      FEEDS_KEYS.forEach((key) => {
        fireEvent.click(screen.getByTestId(`feed-${key}`));
      });

      expect(mockPush).toHaveBeenCalledTimes(6);
      mockPush.mock.calls.forEach((call: string[]) => {
        expect(call[0]).toContain("/login?redirect=");
      });
    });
  });
});

const FEEDS_KEYS = ["bubbles", "chronicle", "agora", "mosaic", "ledger", "amble"];
