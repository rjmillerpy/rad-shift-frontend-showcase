import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f0f1a",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
    }}>
      <h1 style={{ fontSize: "72px", margin: "0 0 8px 0", color: "#666" }}>404</h1>
      <p style={{ fontSize: "18px", color: "#888", margin: "0 0 24px 0" }}>Page not found</p>
      <Link href="/" style={{ color: "#007bff", textDecoration: "none", fontSize: "16px" }}>
        &larr; Back to RadShift
      </Link>
    </div>
  );
}
