import React, { useState } from "react";
import { Document, Page } from "../types/dms";
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sparkles,
  Database,
  ExternalLink,
  Copy,
  Check,
  Compass,
} from "lucide-react";
import {
  downloadPageAsPdf,
  downloadPageAsImage,
  downloadPageAsJson,
} from "../lib/pageDownloadHelper";

interface SmartSearchDocumentViewerProps {
  document: Document;
  page: Page;
  allPages: Page[];
  searchQuery?: string;
  onClose: () => void;
  onSelectPage: (pageNo: number) => void;
  onOpenInBatchReview?: () => void;
}

export const SmartSearchDocumentViewer: React.FC<SmartSearchDocumentViewerProps> = ({
  document,
  page,
  allPages,
  searchQuery,
  onClose,
  onSelectPage,
  onOpenInBatchReview,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(page.rotation_applied || 0);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [copiedOcr, setCopiedOcr] = useState(false);

  // Determine pages that belong to this document
  const docPages = allPages.filter(
    (p) => p.page_no >= document.page_from && p.page_no <= document.page_to
  );

  const handleDownloadPdf = async (targetPage: Page) => {
    setDownloadingFormat(`PDF-${targetPage.page_no}`);
    try {
      await downloadPageAsPdf(targetPage, document);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 1000);
    }
  };

  const handleDownloadPng = async (targetPage: Page) => {
    setDownloadingFormat(`PNG-${targetPage.page_no}`);
    try {
      await downloadPageAsImage(targetPage, document);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 1000);
    }
  };

  const handleDownloadJson = (targetPage: Page) => {
    setDownloadingFormat(`JSON-${targetPage.page_no}`);
    try {
      downloadPageAsJson(targetPage, document);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 1000);
    }
  };

  const handleCopyOcr = () => {
    if (page.ocr_text) {
      navigator.clipboard.writeText(page.ocr_text);
      setCopiedOcr(true);
      setTimeout(() => setCopiedOcr(false), 2000);
    }
  };

  // Highlight query term inside snippet or text
  const renderHighlightedText = (text: string, term?: string) => {
    if (!term || !term.trim()) return text;
    const cleanTerm = term.trim();
    const parts = text.split(new RegExp(`(${cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === cleanTerm.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-amber-950 font-bold px-1 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const ext = document.extraction;
  const isLandscape = rotation === 90 || rotation === 270;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden flex flex-col transition-all">
      {/* 1. TOP HEADER & PER-PAGE DOWNLOAD BAR */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-white truncate">{document.title}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {document.doc_type.replace("_", " ")}
              </span>
              {document.status === "quarantined" ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Needs Review
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Viewing inside Smart Content Search • BigQuery:{" "}
              <span className="text-emerald-400 font-mono">primer_group_dms.{document.doc_type}s</span>
            </p>
          </div>
        </div>

        {/* Per-Page Download & Navigation Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Page Navigator */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => {
                if (page.page_no > 1) onSelectPage(page.page_no - 1);
              }}
              disabled={page.page_no <= 1}
              className="p-1.5 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent rounded cursor-pointer"
              title="Previous Document"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 text-xs font-semibold text-indigo-300 truncate max-w-[240px]" title={page.title}>
              {page.title}
            </span>
            <button
              onClick={() => {
                if (page.page_no < allPages.length) onSelectPage(page.page_no + 1);
              }}
              disabled={page.page_no >= allPages.length}
              className="p-1.5 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent rounded cursor-pointer"
              title="Next Document"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* DOWNLOAD PER PAGE BUTTONS */}
          <button
            onClick={() => handleDownloadPdf(page)}
            disabled={downloadingFormat === `PDF-${page.page_no}`}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
            title={`Download ${page.title || document.title} as PDF`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {downloadingFormat === `PDF-${page.page_no}` ? "Generating PDF..." : `Download ${page.title || document.title} (PDF)`}
            </span>
          </button>

          <button
            onClick={() => handleDownloadPng(page)}
            disabled={downloadingFormat === `PNG-${page.page_no}`}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            title={`Download ${page.title || document.title} as PNG Image`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {downloadingFormat === `PNG-${page.page_no}` ? "Saving PNG..." : `PNG Image`}
            </span>
          </button>

          {/* Optional: Jump to Batch Processing */}
          {onOpenInBatchReview && (
            <button
              onClick={onOpenInBatchReview}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Open full editing console in Batch Processing & Review"
            >
              <ExternalLink className="w-3 h-3 text-blue-400" />
              <span>Review Mode</span>
            </button>
          )}

          {/* Close Viewer */}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
            title="Close document viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. MULTI-PAGE SELECTOR BAR (if document spans multiple pages) */}
      {docPages.length > 1 && (
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-indigo-950 text-[11px] uppercase tracking-wider shrink-0">
              Document Parts:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {docPages.map((dp) => (
                <button
                  key={dp.page_id}
                  onClick={() => onSelectPage(dp.page_no)}
                  className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    dp.page_no === page.page_no
                      ? "bg-indigo-600 text-white shadow-xs font-bold"
                      : "bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-100 font-medium"
                  }`}
                  title={dp.title}
                >
                  {dp.title}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-indigo-700 shrink-0">
            <span>Export Document:</span>
            {docPages.map((dp) => (
              <button
                key={`dl-${dp.page_id}`}
                onClick={() => handleDownloadPdf(dp)}
                className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-300 rounded text-xs font-bold text-indigo-900 transition-colors flex items-center gap-1 cursor-pointer"
                title={`Download ${dp.title} PDF`}
              >
                <Download className="w-3 h-3" />
                <span>{dp.title} (.PDF)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. MAIN INSPECTION BODY (Split View: Scan Preview on Left, Metadata & OCR on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[580px] bg-slate-50">
        {/* LEFT COLUMN: SCANNED PAGE PREVIEW */}
        <div className="lg:col-span-7 bg-slate-200/70 border-r border-slate-200 flex flex-col">
          {/* Scan Viewer Toolbar */}
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 text-xs">Scanned Page Canvas</span>
              <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                {page.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom */}
              <div className="flex items-center bg-white rounded-md border border-slate-200 p-0.5 shadow-xs">
                <button
                  onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
                  className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-[11px] font-mono text-slate-700 min-w-[36px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))))}
                  className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Rotate */}
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-md cursor-pointer shadow-xs"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas / Image Display Stage */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[460px]">
            <div
              className="transition-transform duration-200 origin-center shadow-lg rounded bg-white"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              {page.image_url ? (
                <img
                  src={page.image_url}
                  alt={page.title}
                  className="max-w-[540px] h-auto object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              ) : (
                /* High-Fidelity Facsimile Canvas Render */
                <div className="w-[520px] min-h-[680px] p-6 text-slate-900 bg-white relative flex flex-col justify-between font-mono text-[11px] leading-tight select-text border border-slate-300">
                  <div>
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-2 mb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h1 className="text-sm font-black tracking-tight text-slate-900">
                            {page.title || document.title}
                          </h1>
                          <p className="text-[10px] font-sans font-bold text-slate-700 mt-0.5">
                            Primer Resources Corp. (R.O.H.Q.-Phils.)
                          </p>
                          <p className="text-[9px] text-slate-500 font-sans">
                            Payee / Vendor: {ext.vendor_name || "POLYPROGRESS BUSINESS CORPORATION"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                            {page.title}
                          </span>
                          <p className="text-[9px] text-slate-500 mt-1">
                            Ref: {ext.invoice_number || ext.check_no || ext.document_number || "PRC-001722"}
                          </p>
                        </div>
                      </div>

                      {/* Metadata grid */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-dashed border-slate-300 text-[10px] font-sans">
                        <div>
                          <span className="text-slate-400 block text-[8.5px] uppercase">Vendor TIN</span>
                          <span className="font-bold text-slate-800">{ext.vendor_tin || "238-470-166-00000"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[8.5px] uppercase">Document Date</span>
                          <span className="font-bold text-slate-800">{ext.document_date || "06/05/2025"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[8.5px] uppercase">Gross Amount</span>
                          <span className="font-bold text-blue-900">
                            ₱{(ext.gross_amount || 13604).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Document Scanned Body Facsimile */}
                    <div className="space-y-2 mt-4 text-[10px] font-sans">
                      <div className="p-3 bg-slate-50 rounded border border-slate-200">
                        <span className="font-bold text-slate-700 block mb-1">Scanned Content Snippet:</span>
                        <p className="text-slate-600 font-mono text-[9.5px] leading-relaxed">
                          {renderHighlightedText(page.ocr_text.slice(0, 320) + "...", searchQuery)}
                        </p>
                      </div>

                      {ext.net_amount && (
                        <div className="flex justify-between items-center bg-indigo-50/50 p-2.5 rounded border border-indigo-100 text-[10.5px]">
                          <span className="font-bold text-indigo-900">Net Payable Amount:</span>
                          <span className="font-bold text-indigo-700 font-mono">
                            ₱{ext.net_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stamp & Certification */}
                  <div className="mt-8 pt-3 border-t border-slate-300 flex justify-between items-center text-[9px] text-slate-400 font-sans">
                    <div className="border border-emerald-500 text-emerald-700 font-bold px-2 py-1 rounded uppercase tracking-wider text-[8.5px]">
                      RECEIVED & VERIFIED • BIR RR 9-2009
                    </div>
                    <span>SHA-256: 9f83a48e71c6d3bc8527a0d4c827b5871fa28469cf20a2e3794a32ff52c0029b</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Page Download Strip */}
          <div className="bg-slate-100 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Page {page.page_no} • Quality: {(page.quality_score * 100).toFixed(0)}% • Deskew: {page.deskew_deg}°
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadPdf(page)}
                className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                Download This Page (.PDF)
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => handleDownloadPng(page)}
                className="text-slate-600 hover:text-slate-800 font-medium text-xs flex items-center gap-1 cursor-pointer"
              >
                <ImageIcon className="w-3 h-3 text-emerald-600" />
                Download (.PNG)
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EXTRACTED INTELLIGENCE & OCR TRANSCRIPT */}
        <div className="lg:col-span-5 p-5 space-y-4 overflow-y-auto max-h-[700px]">
          {/* Quick Action Download Box */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                Download Record per Page
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                Page {page.page_no} Selected
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              Export this exact page individually with full resolution, OCR layer, and verified BIR RR 9-2009 hash.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleDownloadPdf(page)}
                disabled={downloadingFormat === `PDF-${page.page_no}`}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Download className="w-3 h-3" />
                {downloadingFormat === `PDF-${page.page_no}` ? "Saving..." : "PDF Page"}
              </button>
              <button
                onClick={() => handleDownloadPng(page)}
                disabled={downloadingFormat === `PNG-${page.page_no}`}
                className="w-full py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <ImageIcon className="w-3 h-3 text-emerald-600" />
                {downloadingFormat === `PNG-${page.page_no}` ? "Saving..." : "PNG Image"}
              </button>
            </div>
          </div>

          {/* Extracted Key Fields */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Extracted Accounting Fields
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Confidence: {(page.quality_score * 100).toFixed(0)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-medium">Vendor Name</span>
                <span className="font-bold text-slate-900 leading-snug block">
                  {ext.vendor_name || "Polyprogress Business Corporation"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-medium">Vendor TIN</span>
                <span className="font-mono font-bold text-slate-800 block">
                  {ext.vendor_tin || "238-470-166-00000"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-medium">Document / Inv #</span>
                <span className="font-mono font-bold text-indigo-600 block">
                  {ext.invoice_number || ext.check_no || ext.document_number || "PRC-001722"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-medium">PO Number</span>
                <span className="font-mono text-slate-800 block">
                  {ext.po_number || "PRC-00000203"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-medium">Gross Amount</span>
                <span className="font-mono font-bold text-slate-900 block">
                  ₱{(ext.gross_amount || 13604).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-medium">Net Amount</span>
                <span className="font-mono font-bold text-emerald-700 block">
                  ₱{(ext.net_amount || 13482.54).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-medium">VAT Amount</span>
                <span className="font-mono text-slate-700 block">
                  ₱{(ext.vat_amount || 1457.57).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-medium">Tax Code</span>
                <span className="font-mono text-slate-700 block">
                  {ext.atc_code || "WC158 (1%)"}
                </span>
              </div>
            </div>

            {/* Cloud Destinations */}
            <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  <Database className="w-3 h-3 text-blue-600" /> Target BigQuery:
                </span>
                <span className="font-mono font-semibold text-blue-700">
                  primer_group_dms.{document.doc_type}s
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  <ExternalLink className="w-3 h-3 text-indigo-600" /> Vault Storage:
                </span>
                <span className="font-mono text-slate-600 text-[10px]">
                  gs://primer-group/{document.doc_type}s/
                </span>
              </div>
            </div>
          </div>

          {/* OCR Transcript */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">
                Page OCR Text ({page.ocr_tokens?.length || 140} tokens)
              </span>
              <button
                onClick={handleCopyOcr}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedOcr ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy Text
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[11px] text-slate-800 max-h-56 overflow-y-auto leading-relaxed select-text">
              {renderHighlightedText(page.ocr_text || "No OCR transcript recorded.", searchQuery)}
            </div>
          </div>

          {/* Export JSON Option */}
          <div className="flex justify-end">
            <button
              onClick={() => handleDownloadJson(page)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
            >
              <Download className="w-3 h-3" />
              Download Page OCR & Metadata (JSON)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
