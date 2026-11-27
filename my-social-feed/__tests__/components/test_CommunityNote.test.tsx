import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import api from "@/lib/api";
import CommunityNote, { MAX_NOTE_LENGTH } from "@/components/CommunityNote";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
const mockedApi = api as jest.Mocked<typeof api>;

const NOTE = { id: 3, text: "The photo is from 2019.", source_url: "https://example.com/a" };

beforeEach(() => jest.clearAllMocks());

describe("CommunityNote", () => {
  it("shows a helpful note with its source as a safe outbound link", () => {
    render(<CommunityNote postId={1} note={NOTE} canAddNote={false} />);
    const box = screen.getByRole("complementary", { name: "Readers added context" });
    expect(box).toHaveTextContent("The photo is from 2019.");
    const link = screen.getByRole("link", { name: "Source" });
    expect(link).toHaveAttribute("href", "https://example.com/a");
    expect(link).toHaveAttribute("rel", "nofollow ugc noopener noreferrer");
  });

  it("shows nothing for a post without a note, when the reader can't add one", () => {
    const { container } = render(<CommunityNote postId={1} note={null} canAddNote={false} />);
    expect(container).toHaveTextContent("");
    expect(screen.queryByRole("button", { name: "Add context" })).toBeNull();
  });

  it("sends a note and explains when it will show", async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    render(<CommunityNote postId={7} note={null} canAddNote />);

    fireEvent.click(screen.getByRole("button", { name: "Add context" }));
    fireEvent.change(screen.getByLabelText("Context for other readers"), { target: { value: " Old photo. " } });
    fireEvent.change(screen.getByLabelText("Source link (optional)"), { target: { value: "https://x.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("people who usually disagree"));
    expect(mockedApi.post).toHaveBeenCalledWith("/notes/posts/7", { text: "Old photo.", source_url: "https://x.test" });
    expect(screen.getByRole("link", { name: "Rate other notes" })).toHaveAttribute("href", "/notes");
  });

  it("sends no source when the link is left empty", async () => {
    mockedApi.post.mockResolvedValue({ data: {} });
    render(<CommunityNote postId={7} note={null} canAddNote />);
    fireEvent.click(screen.getByRole("button", { name: "Add context" }));
    fireEvent.change(screen.getByLabelText("Context for other readers"), { target: { value: "Context" } });
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledWith("/notes/posts/7", { text: "Context", source_url: null }));
  });

  it("says so when the note is refused", async () => {
    mockedApi.post.mockRejectedValue(new Error("422"));
    render(<CommunityNote postId={7} note={null} canAddNote />);
    fireEvent.click(screen.getByRole("button", { name: "Add context" }));
    fireEvent.change(screen.getByLabelText("Context for other readers"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't add the note");
  });

  it("can't send an empty note, and caps its length like the server", () => {
    render(<CommunityNote postId={7} note={null} canAddNote />);
    fireEvent.click(screen.getByRole("button", { name: "Add context" }));
    expect(screen.getByRole("button", { name: "Add note" })).toBeDisabled();
    expect(screen.getByLabelText("Context for other readers")).toHaveAttribute("maxLength", String(MAX_NOTE_LENGTH));
  });

  it("cancel closes the form", () => {
    render(<CommunityNote postId={7} note={null} canAddNote />);
    fireEvent.click(screen.getByRole("button", { name: "Add context" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Add context" })).toBeInTheDocument();
  });
});
