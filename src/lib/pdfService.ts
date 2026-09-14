// Polyfills for browser compatibility with pdfjs-dist
if (typeof (Promise as any).withResolvers === "undefined") {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

if (typeof (Promise as any).try === "undefined") {
  (Promise as any).try = function (fn: (...args: any[]) => any, ...args: any[]) {
    return new Promise((resolve) => {
      resolve(fn(...args));
    });
  };
}

import * as pdfjsLib from "pdfjs-dist";

// Set worker source to same-origin local worker
if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  } catch (e) {
    console.warn("Could not set pdfjs worker source", e);
  }
}

export interface RenderedPdfPage {
  pageNo: number;
  dataUrl: string; // Base64 JPEG data URL
  width: number;
  height: number;
  text: string;
}

/**
 * Parses an uploaded PDF File or image and renders each page to a dataURL image + extracts text.
 */
export async function renderPdfToPages(
  fileOrBuffer: File | ArrayBuffer,
  onProgress?: (current: number, total: number) => void
): Promise<RenderedPdfPage[]> {
  // Support direct image upload (PNG / JPEG)
  if (fileOrBuffer instanceof File) {
    const isImage =
      fileOrBuffer.type.startsWith("image/") ||
      /\.(png|jpe?g|webp|bmp|tiff)$/i.test(fileOrBuffer.name);

    if (isImage) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBuffer);
      });

      return [
        {
          pageNo: 1,
          dataUrl,
          width: 850,
          height: 1100,
          text: `Image document: ${fileOrBuffer.name}`,
        },
      ];
    }
  }

  const arrayBuffer =
    fileOrBuffer instanceof File
      ? await fileOrBuffer.arrayBuffer()
      : fileOrBuffer;

  const uint8Data = new Uint8Array(arrayBuffer);

  let pdf;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      cMapUrl: "/cmaps/",
      cMapPacked: true,
      useSystemFonts: true,
    });
    pdf = await loadingTask.promise;
  } catch (workerErr) {
    console.warn("Worker loading encountered issue, trying fallback mode...", workerErr);
    // Try fallback with disabled worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    const fallbackTask = pdfjsLib.getDocument({
      data: uint8Data,
      useSystemFonts: true,
    });
    pdf = await fallbackTask.promise;
  }

  const numPages = pdf.numPages;
  const renderedPages: RenderedPdfPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) {
      onProgress(i, numPages);
    }

    const page = await pdf.getPage(i);
    // Use scale 1.6 for crisp accounting scan readability
    const viewport = page.getViewport({ scale: 1.6 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      await page.render({
        canvas,
        canvasContext: context,
        viewport,
      }).promise;
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    // Extract text from the page
    let pageText = "";
    try {
      const textContent = await page.getTextContent();
      pageText = textContent.items
        .map((item: any) => item.str || "")
        .join(" ");
    } catch {
      // Scanned images may have empty text layers
    }

    renderedPages.push({
      pageNo: i,
      dataUrl,
      width: viewport.width,
      height: viewport.height,
      text: pageText,
    });
  }

  return renderedPages;
}
