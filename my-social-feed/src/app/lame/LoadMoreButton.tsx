"use client";

type LoadMoreButtonProps = {
  /** True while the next page is being fetched: the button is disabled. */
  loading: boolean;
  onLoadMore: () => void;
};

/** The round "load more" button shown under a feed that has another page. */
export default function LoadMoreButton({ loading, onLoadMore }: LoadMoreButtonProps) {
  return (
    <div style={{ textAlign: "center", margin: "20px 0" }}>
      <button
        onClick={onLoadMore}
        disabled={loading}
        title="Load more"
        style={{
          border: "none",
          background: "none",
          cursor: loading ? "wait" : "pointer",
          padding: "8px",
          opacity: loading ? 0.5 : 1,
        }}
      >
        <img
          src="/paginate.png"
          alt="Load more"
          width={112}
          height={112}
          style={{ borderRadius: "50%", objectFit: "cover" }}
        />
      </button>
    </div>
  );
}
