"use client";
import { useCallback, useState } from "react";
import Modal from "./Modal";

// The grid shows this many images inline; anything beyond gets a "+N" overlay
// on the last cell (rule 8 — same value referenced three times).
const GALLERY_VISIBLE_CELLS = 4;

type ImageGalleryProps = {
  images: string[];
  maxHeight?: number;
};

export default function ImageGallery({ images, maxHeight = 400 }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  if (!images || images.length === 0) return null;

  // Single image — no gallery controls needed
  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt="Post"
        crossOrigin="anonymous"
        onClick={() => setLightboxOpen(true)}
        style={{
          maxWidth: "100%",
          maxHeight,
          borderRadius: "10px",
          marginTop: "10px",
          cursor: "pointer",
          display: "block",
        }}
      />
    );
  }

  return (
    <>
      {/* Gallery grid */}
      <div
        data-testid="image-gallery"
        style={{
          display: "grid",
          gridTemplateColumns: images.length === 2 ? "1fr 1fr" : images.length === 3 ? "2fr 1fr" : "1fr 1fr",
          gridTemplateRows: images.length > 2 ? "1fr 1fr" : "1fr",
          gap: "4px",
          marginTop: "10px",
          borderRadius: "10px",
          overflow: "hidden",
          maxHeight,
        }}
      >
        {images.slice(0, GALLERY_VISIBLE_CELLS).map((url, i) => (
          <button
            type="button"
            key={i}
            data-testid={`gallery-image-${i}`}
            aria-label={`Open image ${i + 1} of ${images.length}`}
            onClick={() => { setActiveIndex(i); setLightboxOpen(true); }}
            style={{
              // A real button (focusable, Enter/Space), styled like the plain cell it was.
              padding: 0,
              border: "none",
              background: "none",
              display: "block",
              width: "100%",
              position: "relative",
              cursor: "pointer",
              gridRow: images.length === 3 && i === 0 ? "1 / 3" : undefined,
              overflow: "hidden",
            }}
          >
            <img
              src={url}
              alt={`Image ${i + 1}`}
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                minHeight: "100px",
              }}
            />
            {/* Show +N overlay on 4th image if more exist */}
            {i === GALLERY_VISIBLE_CELLS - 1 && images.length > GALLERY_VISIBLE_CELLS && (
              <div style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "24px",
                fontWeight: "bold",
              }}>
                +{images.length - GALLERY_VISIBLE_CELLS}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Modal
          label="Image viewer"
          testId="image-lightbox"
          onClose={closeLightbox}
          backdropColor="rgba(0,0,0,0.9)"
          zIndex={10000}
          panelStyle={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}
        >
            <img
              src={images[activeIndex]}
              alt={`Image ${activeIndex + 1}`}
              crossOrigin="anonymous"
              style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", display: "block", borderRadius: "4px" }}
            />

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "12px" }}>
              <button
                data-testid="lightbox-prev"
                onClick={() => setActiveIndex((p) => (p - 1 + images.length) % images.length)}
                style={{ background: "none", border: "1px solid #666", color: "#fff", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "16px" }}
              >
                ←
              </button>
              <span style={{ color: "#ccc", fontSize: "14px" }}>
                {activeIndex + 1} / {images.length}
              </span>
              <button
                data-testid="lightbox-next"
                onClick={() => setActiveIndex((p) => (p + 1) % images.length)}
                style={{ background: "none", border: "1px solid #666", color: "#fff", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "16px" }}
              >
                →
              </button>
            </div>

            {/* Close */}
            <button
              data-testid="lightbox-close"
              aria-label="Close image viewer"
              onClick={closeLightbox}
              style={{ position: "absolute", top: "-40px", right: 0, background: "none", border: "none", color: "#fff", fontSize: "28px", cursor: "pointer" }}
            >
              ✕
            </button>
        </Modal>
      )}
    </>
  );
}
