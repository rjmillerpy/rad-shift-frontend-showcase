import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import FileUploader, { UploadFile } from "@/components/FileUploader";

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => "blob:preview");
  global.URL.revokeObjectURL = jest.fn();
  Object.defineProperty(global, "crypto", {
    value: { randomUUID: jest.fn(() => "test-uuid-" + Math.random()) },
  });
});

beforeEach(() => jest.clearAllMocks());

describe("FileUploader", () => {
  const setup = (files: UploadFile[] = []) => {
    const onChange = jest.fn();
    render(<FileUploader files={files} onFilesChange={onChange} />);
    return { onChange };
  };

  it("renders drop zone with instructions", () => {
    setup();
    expect(screen.getByText(/Drop files here/i)).toBeInTheDocument();
  });

  it("accepts valid files via file input", () => {
    const { onChange } = setup();
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["hello"], "test.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onChange).toHaveBeenCalled();
    const addedFiles = onChange.mock.calls[0][0];
    expect(addedFiles).toHaveLength(1);
    expect(addedFiles[0].file.name).toBe("test.jpg");
    expect(addedFiles[0].error).toBeNull();
  });

  it("rejects files with disallowed extensions", () => {
    const { onChange } = setup();
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["evil"], "hack.exe", { type: "application/x-msdownload" });
    fireEvent.change(input, { target: { files: [file] } });
    const addedFiles = onChange.mock.calls[0][0];
    expect(addedFiles[0].error).toBeTruthy();
  });

  it("rejects files exceeding 50MB", () => {
    const { onChange } = setup();
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const bigFile = new File(["x".repeat(100)], "big.jpg", { type: "image/jpeg" });
    Object.defineProperty(bigFile, "size", { value: 51 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [bigFile] } });
    const addedFiles = onChange.mock.calls[0][0];
    expect(addedFiles[0].error).toContain("50MB");
  });

  it("shows remove button for each file", () => {
    const existingFile: UploadFile = {
      file: new File(["a"], "doc.pdf", { type: "application/pdf" }),
      id: "file-1",
      preview: null,
      error: null,
    };
    const { onChange } = setup([existingFile]);
    expect(screen.getByText("doc.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Remove file"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("shows image preview for image files", () => {
    const imgFile: UploadFile = {
      file: new File(["img"], "photo.png", { type: "image/png" }),
      id: "file-2",
      preview: "blob:preview",
      error: null,
    };
    setup([imgFile]);
    const img = document.querySelector("img[src='blob:preview']");
    expect(img).toBeInTheDocument();
  });

  it("shows error styling for invalid files", () => {
    const badFile: UploadFile = {
      file: new File(["x"], "bad.exe", { type: "" }),
      id: "file-3",
      preview: null,
      error: "File type not allowed",
    };
    setup([badFile]);
    expect(screen.getByText("File type not allowed")).toBeInTheDocument();
  });

  it("highlights drop zone on drag over", () => {
    setup();
    const zone = screen.getByRole("button", { name: /Drop files here/i });
    fireEvent.dragOver(zone);
    expect(screen.getByText(/Release to upload/i)).toBeInTheDocument();
  });

  it("un-highlights drop zone on drag leave", () => {
    setup();
    const zone = screen.getByRole("button", { name: /Drop files here/i });
    fireEvent.dragOver(zone);
    fireEvent.dragLeave(zone);
    expect(screen.getByText(/Drop files here/i)).toBeInTheDocument();
  });

  it("drop event adds dropped files", () => {
    const { onChange } = setup();
    const zone = screen.getByRole("button", { name: /Drop files here/i });
    const file = new File(["x"], "dropped.png", { type: "image/png" });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onChange).toHaveBeenCalled();
    const added = onChange.mock.calls[0][0];
    expect(added[0].file.name).toBe("dropped.png");
  });

  it("drop with no files is a no-op", () => {
    const { onChange } = setup();
    const zone = screen.getByRole("button", { name: /Drop files here/i });
    fireEvent.drop(zone, { dataTransfer: { files: [] } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("respects maxFiles cap", () => {
    const existing: UploadFile[] = Array.from({ length: 20 }, (_, i) => ({
      file: new File(["a"], `file${i}.txt`, { type: "text/plain" }),
      id: `id-${i}`, preview: null, error: null,
    }));
    const { onChange } = render(<FileUploader files={existing} onFilesChange={jest.fn()} maxFiles={20} />) as unknown as { onChange: jest.Mock };
    // Directly invoke via setup — simpler
    const onFilesChange = jest.fn();
    render(<FileUploader files={existing} onFilesChange={onFilesChange} maxFiles={20} />);
    const input = document.querySelectorAll("input[type='file']")[1] as HTMLInputElement;
    const newFile = new File(["b"], "extra.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [newFile] } });
    const result = onFilesChange.mock.calls[0][0];
    expect(result).toHaveLength(20); // cap enforced
  });

  it("revokes object URL when removing an image file", () => {
    const revokeSpy = global.URL.revokeObjectURL as jest.Mock;
    revokeSpy.mockClear();
    const imgFile: UploadFile = {
      file: new File(["img"], "photo.png", { type: "image/png" }),
      id: "revoke-test",
      preview: "blob:xxxxx",
      error: null,
    };
    const onChange = jest.fn();
    render(<FileUploader files={[imgFile]} onFilesChange={onChange} />);
    fireEvent.click(screen.getByTitle("Remove file"));
    expect(revokeSpy).toHaveBeenCalledWith("blob:xxxxx");
  });
});
