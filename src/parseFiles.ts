import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

export interface ParsedFileResult {
  fileName: string;
  extractedText: string;
  fileSize: number;
}

export async function parseDocumentFile(file: File): Promise<ParsedFileResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  let text = '';
  if (extension === 'pdf') {
    text = await parsePdfFile(file);
  } else if (extension === 'pptx') {
    text = await parsePptxFile(file);
  } else if (extension === 'txt' || extension === 'md') {
    text = await parseTextFile(file);
  } else {
    throw new Error(
      `Unsupported file type: .${extension}. Please upload a .pdf, .pptx, .txt, or .md file.`
    );
  }

  if (!text || text.trim().length === 0) {
    throw new Error(`No readable text could be extracted from "${file.name}".`);
  }

  return {
    fileName: file.name,
    extractedText: text.trim(),
    fileSize: file.size,
  };
}

// Configure pdfjs worker for Vite client-side bundle
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function parsePdfFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;

  const textSnippets: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();

    if (pageText.length > 0) {
      textSnippets.push(`--- Page ${pageNum} ---\n${pageText}`);
    }
  }

  return textSnippets.join('\n\n');
}

export async function parsePptxFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideFiles = Object.keys(zip.files).filter((filename) =>
    filename.match(/^ppt\/slides\/slide\d+\.xml$/i)
  );

  slideFiles.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    return numA - numB;
  });

  const slideTexts: string[] = [];
  const parser = new DOMParser();

  for (let i = 0; i < slideFiles.length; i++) {
    const slidePath = slideFiles[i];
    const xmlContent = await zip.files[slidePath].async('string');
    const doc = parser.parseFromString(xmlContent, 'application/xml');

    // PowerPoint XML stores text runs in <a:t> elements
    const textNodes = doc.getElementsByTagName('a:t');
    const slideWords: string[] = [];

    for (let j = 0; j < textNodes.length; j++) {
      const text = textNodes[j].textContent?.trim();
      if (text) {
        slideWords.push(text);
      }
    }

    if (slideWords.length > 0) {
      slideTexts.push(`--- Slide ${i + 1} ---\n${slideWords.join(' ')}`);
    }
  }

  return slideTexts.join('\n\n');
}

export async function parseTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      reject(new Error(`Failed to read text file: ${file.name}`));
    };
    reader.readAsText(file);
  });
}
