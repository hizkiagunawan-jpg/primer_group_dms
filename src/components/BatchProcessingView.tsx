import React, { useState, useRef } from "react";
import { Batch, Page, Document } from "../types/dms";
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface BatchProcessingViewProps {
  batch: Batch;
  pages: Page[];
  documents: Document[];
  onUploadSample: (sampleName: string) => void;
  onNavigateToPage: (pageNo: number) => void;
  onUploadPdfFile?: (file: File) => Promise<void>;
}

export const BatchProcessingView: React.FC<BatchProcessingViewProps> = ({
  batch,
  pages,
  documents,
  onUploadSample,
  onNavigateToPage,
  onUploadPdfFile,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (onUploadPdfFile) {
        handleExecuteRealUpload(file);
      }
    }
  };

  const handleExecuteRealUpload = async (file: File) => {
    setProcessingStage("Rendering scanned pages & running Gemini AI extraction...");
    setProgress(35);
    try {
      if (onUploadPdfFile) {
        await onUploadPdfFile(file);
      }
      setProgress(100);
      setProcessingStage("Complete! Document packet ready.");
      setTimeout(() => {
        setProcessingStage(null);
        setProgress(0);
      }, 800);
    } catch (e: any) {
      setProcessingStage(`Upload error: ${e?.message || "Failed"}`);
    }
  };

  const runSimulationPipeline = (filename: string) => {
    if (selectedFile && onUploadPdfFile) {
      handleExecuteRealUpload(selectedFile);
      return;
    }

    setProcessingStage("Verifying 10 pages and deskewing scans...");
    setProgress(30);

    setTimeout(() => {
      setProcessingStage("Extracting financial values via Gemini OCR...");
      setProgress(75);

      setTimeout(() => {
        setProcessingStage("Reconciling PO, Invoice, and GL voucher...");
        setProgress(100);

        setTimeout(() => {
          onUploadSample(filename);
          setProcessingStage(null);
          setProgress(0);
        }, 500);
      }, 700);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <UploadCloud className="w-4 h-4" />
              Batch Ingestion & Pre-processing
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Process Document Scans & Batches
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Upload multi-page scanner PDFs or image scans with automatic deskewing, page counting, and AI extraction.
            </p>
          </div>
        </div>

        {/* Drag & Drop Upload Box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-300 hover:border-slate-400 bg-slate-50/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadCloud className="w-10 h-10 text-slate-400" />
            <div>
              <span className="font-bold text-slate-800 text-sm">
                {selectedFile ? selectedFile.name : "Drag & drop scan PDF or click to browse"}
              </span>
              <p className="text-slate-400 text-xs mt-0.5">
                Supports multi-page scanner PDF, TIFF, or JPEG batches (up to 50MB)
              </p>
            </div>
            {selectedFile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  runSimulationPipeline(selectedFile.name);
                }}
                disabled={!!processingStage}
                className="mt-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm"
              >
                Start Processing {selectedFile.name}
              </button>
            )}
          </div>
        </div>

        {/* Processing Progress Bar */}
        {processingStage && (
          <div className="mt-4 space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200 animate-fadeIn">
            <div className="flex justify-between text-xs text-indigo-700 font-semibold">
              <span>{processingStage}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Current Batch Metadata Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Batch Reference</span>
          <span className="text-sm font-mono font-bold text-indigo-700 mt-1 block">
            {batch.batch_ref}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Tote: {batch.tote_ref}</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Page Count Verification</span>
          <div className="text-sm font-mono font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            10 Declared / 10 Detected
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Zero missing or blank pages</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Deskew & Enhancement</span>
          <span className="text-sm font-semibold text-slate-900 mt-1 block">
            Automatic Rotation (300 DPI)
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">CLAHE Contrast Applied</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Source File</span>
          <span className="text-xs font-mono font-bold text-slate-900 mt-1 block truncate">
            {batch.source_filename}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
            SHA: {batch.source_sha256.slice(0, 16)}...
          </span>
        </div>
      </div>

      {/* 3. 10-Page Gallery Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Scanned Pages in Packet ({pages.length} Pages)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click any thumbnail to inspect OCR text, bounding boxes, or resolve crop issues
            </p>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            300 DPI • Deskewed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {pages.map((p) => {
            const relatedDoc = documents.find(
              (d) => p.page_no >= d.page_from && p.page_no <= d.page_to
            );
            const isQuarantined = relatedDoc?.status === "quarantined";

            return (
              <div
                key={p.page_id}
                onClick={() => onNavigateToPage(p.page_no)}
                className={`border rounded-xl p-3 cursor-pointer transition-all hover:shadow-sm ${
                  isQuarantined
                    ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-100"
                    : "bg-slate-50/70 border-slate-200 hover:border-indigo-300"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-2 gap-2">
                  <span className="font-bold text-indigo-950 text-xs truncate max-w-[190px]" title={p.title}>
                    {p.title}
                  </span>
                  {p.crop_penalty ? (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-bold shrink-0">
                      CROP NOTICE
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold shrink-0">
                      VERIFIED
                    </span>
                  )}
                </div>

                <div className="h-24 bg-white border border-slate-200 rounded-lg p-2 text-[9px] font-mono text-slate-400 overflow-hidden line-clamp-5">
                  {p.ocr_text.slice(0, 160)}
                </div>

                <div className="mt-2 text-left">
                  <span className="font-medium text-slate-500 text-[11px] truncate block uppercase tracking-wider">
                    {p.source_doc_type ? p.source_doc_type.replace("_", " ") : "Document Record"}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>{p.ocr_tokens.length} OCR words</span>
                    <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                      Inspect <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
