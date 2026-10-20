import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ImageGallery from "@/components/ImageGallery";

describe("ImageGallery", () => {
  describe("Single image", () => {
    it("renders a single image without gallery controls", () => {
      render(<ImageGallery images={["https://img.com/1.jpg"]} />);
      const img = screen.getByAltText("Post");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://img.com/1.jpg");
      expect(screen.queryByTestId("image-gallery")).not.toBeInTheDocument();
    });
  });

  describe("Multiple images", () => {
    const images = [
      "https://img.com/1.jpg",
      "https://img.com/2.jpg",
      "https://img.com/3.jpg",
    ];

    it("renders gallery grid for multiple images", () => {
      render(<ImageGallery images={images} />);
      expect(screen.getByTestId("image-gallery")).toBeInTheDocument();
      expect(screen.getByTestId("gallery-image-0")).toBeInTheDocument();
      expect(screen.getByTestId("gallery-image-1")).toBeInTheDocument();
      expect(screen.getByTestId("gallery-image-2")).toBeInTheDocument();
    });

    it("opens lightbox on image click", () => {
      render(<ImageGallery images={images} />);
      fireEvent.click(screen.getByTestId("gallery-image-0"));
      expect(screen.getByTestId("image-lightbox")).toBeInTheDocument();
    });

    it("navigates between images in lightbox", () => {
      render(<ImageGallery images={images} />);
      fireEvent.click(screen.getByTestId("gallery-image-0"));

      expect(screen.getByText("1 / 3")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("lightbox-next"));
      expect(screen.getByText("2 / 3")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("lightbox-next"));
      expect(screen.getByText("3 / 3")).toBeInTheDocument();

      // Wraps around
      fireEvent.click(screen.getByTestId("lightbox-next"));
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("navigates backward in lightbox", () => {
      render(<ImageGallery images={images} />);
      fireEvent.click(screen.getByTestId("gallery-image-0"));

      fireEvent.click(screen.getByTestId("lightbox-prev"));
      expect(screen.getByText("3 / 3")).toBeInTheDocument();
    });

    it("closes lightbox on close button", () => {
      render(<ImageGallery images={images} />);
      fireEvent.click(screen.getByTestId("gallery-image-0"));
      expect(screen.getByTestId("image-lightbox")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("lightbox-close"));
      expect(screen.queryByTestId("image-lightbox")).not.toBeInTheDocument();
    });

    it("closes lightbox on backdrop click", () => {
      render(<ImageGallery images={images} />);
      fireEvent.click(screen.getByTestId("gallery-image-0"));

      fireEvent.pointerDown(screen.getByTestId("image-lightbox"));
      expect(screen.queryByTestId("image-lightbox")).not.toBeInTheDocument();
    });

    it("closes the lightbox on Escape, and the thumbnails are keyboard buttons", () => {
      render(<ImageGallery images={images} />);
      const thumb = screen.getByRole("button", { name: `Open image 1 of ${images.length}` });
      fireEvent.click(thumb);
      expect(screen.getByRole("dialog", { name: "Image viewer" })).toBeInTheDocument();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByTestId("image-lightbox")).not.toBeInTheDocument();
    });

    it("opens lightbox at clicked image index", () => {
      render(<ImageGallery images={images} />);
      fireEvent.click(screen.getByTestId("gallery-image-2"));
      expect(screen.getByText("3 / 3")).toBeInTheDocument();
    });
  });

  describe("Four+ images", () => {
    const images = [
      "https://img.com/1.jpg", "https://img.com/2.jpg",
      "https://img.com/3.jpg", "https://img.com/4.jpg",
      "https://img.com/5.jpg",
    ];

    it("shows +N overlay on 4th image when more than 4", () => {
      render(<ImageGallery images={images} />);
      expect(screen.getByText("+1")).toBeInTheDocument();
    });

    it("only renders first 4 images in grid", () => {
      render(<ImageGallery images={images} />);
      expect(screen.getByTestId("gallery-image-0")).toBeInTheDocument();
      expect(screen.getByTestId("gallery-image-3")).toBeInTheDocument();
      expect(screen.queryByTestId("gallery-image-4")).not.toBeInTheDocument();
    });

    it("lightbox shows all images", () => {
      render(<ImageGallery images={images} />);
      fireEvent.click(screen.getByTestId("gallery-image-0"));
      expect(screen.getByText("1 / 5")).toBeInTheDocument();
    });
  });

  describe("Empty", () => {
    it("returns null for empty array", () => {
      const { container } = render(<ImageGallery images={[]} />);
      expect(container.innerHTML).toBe("");
    });
  });
});
