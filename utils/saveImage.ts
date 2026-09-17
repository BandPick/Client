export async function saveImageBlob(blob: Blob, filename: string, mimeType: string) {
  const file = new File([blob], filename, { type: mimeType });
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string }) => Promise<void>;
  };

  if (typeof nav.canShare === "function" && nav.canShare({ files: [file] })) {
    try {
      await nav.share?.({ files: [file], title: filename });
      return;
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") {
        return;
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const isIos =
    /iP(hone|od|ad)/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIos) {
    const opened = window.open(url, "_blank");
    if (opened) {
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return;
    }
  }

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

export function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("jpeg-failed"));
        return;
      }
      resolve(blob);
    }, "image/jpeg", quality);
  });
}
