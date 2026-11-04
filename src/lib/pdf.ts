export interface RenderedPage {
  pageNumber: number;
  dataUrl: string;
}

/**
 * Dynamically loads pdfjs-dist on client side and renders each page to JPEG data URL
 */
export async function renderPdfToImages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<RenderedPage[]> {
  if (typeof window === 'undefined') {
    throw new Error('PDF rendering is only supported in browser environment');
  }

  const pdfjsLib = await import('pdfjs-dist');
  // Configure PDF.js worker using unpkg or cdnjs
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const renderedPages: RenderedPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    // 2.0 scale gives high resolution (~150-200 DPI) for handwritten OCR accuracy
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Fill white background before rendering
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    renderedPages.push({
      pageNumber: pageNum,
      dataUrl,
    });

    if (onProgress) {
      onProgress(pageNum, numPages);
    }
  }

  return renderedPages;
}

/**
 * Reads any image file (PNG, JPG, WebP) as base64 data URL
 */
export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
