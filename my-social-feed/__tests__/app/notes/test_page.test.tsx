import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import api from "@/lib/api";
import NotesPage from "@/app/notes/page";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
const mockedApi = api as jest.Mocked<typeof api>;

const QUEUE = [
  { id: 1, post_id: 10, text: "First note", source_url: null },
  { id: 2, post_id: 11, text: "Second note", source_url: "https://example.com" },
];

beforeEach(() => jest.clearAllMocks());

describe("NotesPage", () => {
  it("lists notes waiting for ratings with links to their posts", async () => {
    mockedApi.get.mockResolvedValue({ data: { notes: QUEUE } });
    render(<NotesPage />);
    expect(await screen.findByText("First note")).toBeInTheDocument();
    expect(mockedApi.get).toHaveBeenCalledWith("/notes/needs-ratings");
    expect(screen.getAllByRole("link", { name: "See the post" })[1]).toHaveAttribute("href", "/post/11");
  });

  it.each([
    ["Helpful", true],
    ["Not helpful", false],
  ])("%s sends the rating and takes the note off the list", async (label, helpful) => {
    mockedApi.get.mockResolvedValue({ data: { notes: QUEUE } });
    mockedApi.post.mockResolvedValue({ data: {} });
    render(<NotesPage />);
    await screen.findByText("First note");

    fireEvent.click(screen.getAllByRole("button", { name: label })[0]);

    await waitFor(() => expect(screen.queryByText("First note")).toBeNull());
    expect(mockedApi.post).toHaveBeenCalledWith("/notes/1/rating", { helpful });
    expect(screen.getByText("Second note")).toBeInTheDocument();
  });

  it("says when there's nothing to rate", async () => {
    mockedApi.get.mockResolvedValue({ data: { notes: [] } });
    render(<NotesPage />);
    expect(await screen.findByText(/Nothing to rate/)).toBeInTheDocument();
  });

  it("reports a load failure", async () => {
    mockedApi.get.mockRejectedValue(new Error("down"));
    render(<NotesPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load notes");
  });

  it("keeps the note when the rating fails", async () => {
    mockedApi.get.mockResolvedValue({ data: { notes: QUEUE } });
    mockedApi.post.mockRejectedValue(new Error("down"));
    render(<NotesPage />);
    await screen.findByText("First note");
    fireEvent.click(screen.getAllByRole("button", { name: "Helpful" })[0]);
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save that rating");
    expect(screen.getByText("First note")).toBeInTheDocument();
  });
});
