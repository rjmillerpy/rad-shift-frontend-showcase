/**
 * Utilities for capturing post screenshots and downloading media.
 */

export function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.-]+/g, "_");
}

export function extensionFromUrl(url: string, fallback = "bin"): string {
  const match = url.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1] : fallback;
}

export function downloadMedia(url: string, filename?: string): void {
  const href = `/api/download?url=${encodeURIComponent(url)}${
    filename ? `&filename=${encodeURIComponent(filename)}` : ""
  }`;
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename || "";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function ensureImagesLoad(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];
  await Promise.all(
    imgs.map((img) => {
      if (!img.crossOrigin) img.crossOrigin = "anonymous";
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );
}

async function waitForImageLoad(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth) return;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

function drawHexagonPath(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const points: [number, number][] = [
    [0.5, 0],
    [0.9, 0.2],
    [1, 0.6],
    [0.75, 1],
    [0.25, 1],
    [0, 0.6],
    [0.1, 0.2],
  ];
  ctx.beginPath();
  ctx.moveTo(points[0][0] * width, points[0][1] * height);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0] * width, points[i][1] * height);
  }
  ctx.closePath();
}

export async function replaceAvatarsForCapture(
  root: HTMLElement
): Promise<() => void> {
  const targets = Array.from(
    root.querySelectorAll('img[data-avatar="hex"]')
  ) as HTMLImageElement[];

  const restores: Array<() => void> = [];

  for (const img of targets) {
    try {
      img.crossOrigin = "anonymous";
      await waitForImageLoad(img);

      const rect = img.getBoundingClientRect();
      const dpr = Math.max(2, window.devicePixelRatio || 2);
      const canvasWidth = Math.max(1, Math.round(rect.width * dpr));
      const canvasHeight = Math.max(1, Math.round(rect.height * dpr));

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d")!;
      drawHexagonPath(ctx, canvasWidth, canvasHeight);
      ctx.clip();
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      const placeholder = document.createElement("img");
      placeholder.src = canvas.toDataURL("image/png");
      placeholder.width = Math.round(rect.width);
      placeholder.height = Math.round(rect.height);
      placeholder.style.position = img.style.position;
      placeholder.style.top = img.style.top;
      placeholder.style.left = img.style.left;
      placeholder.style.marginTop = img.style.marginTop;
      placeholder.style.width = img.style.width;
      placeholder.style.height = img.style.height;
      placeholder.style.objectFit = img.style.objectFit;
      placeholder.setAttribute("data-avatar-placeholder", "true");

      img.style.visibility = "hidden";
      img.parentElement?.insertBefore(placeholder, img);

      restores.push(() => {
        placeholder.remove();
        img.style.visibility = "";
      });
    } catch (err) {
      console.error("Avatar replacement failed:", err);
    }
  }

  return () => restores.forEach((fn) => fn());
}

export async function capturePostScreenshot(
  captureElementId: string,
  postId: number,
  posterUsername: string
): Promise<void> {
  const node = document.getElementById(captureElementId);
  if (!node) return;

  await ensureImagesLoad(node);
  const restoreAvatars = await replaceAvatarsForCapture(node);

  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(node, {
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: false,
      imageTimeout: 5000,
      scale: Math.max(2, window.devicePixelRatio || 2),
    });
    const dataUrl = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `post_${postId}_${sanitizeFilename(posterUsername)}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    restoreAvatars();
  }
}
