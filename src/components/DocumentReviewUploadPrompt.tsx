import React, { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  Layers,
  Cpu,
  Database,
  FolderArchive,
} from "lucide-react";

interface DocumentReviewUploadPromptProps {
  isProcessing: boolean;
  processingProgress: number;
  processingStage: string;
  uploadedFileName: string;
  onUploadFile: (file: File) => void;
  onSelectSampleScenario?: (scenarioType: "batch_all" | "single_po" | "single_gl" | "single_invoice") => void;
}

export const DocumentReviewUploadPrompt: React.FC<DocumentReviewUploadPromptProps> = ({
  isProcessing,
  processingProgress,
  processingStage,
  uploadedFileName,
  onUploadFile,
}) => {
  const [dragActive, setDragActive] = useState(false);
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
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      e.target.value = "";
      onUploadFile(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Ingestion & Review Container */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`bg-white rounded-xl border-2 transition-all p-7 shadow-xs ${
          dragActive
            ? "border-indigo-500 bg-indigo-50/40 scale-[1.002]"
            : "border-slate-200"
        }`}
      >
        {isProcessing ? (
          <div className="p-4 text-center space-y-6">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center animate-pulse">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Cpu className="w-7 h-7 text-indigo-600 animate-spin" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600"></span>
              </span>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                ON PROCESS: UPLOADING & EXTRACTING
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Processing Document: <span className="text-indigo-600 font-mono">{uploadedFileName || "Document Scan"}</span>
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {processingStage || "Analyzing document geometry, deskewing scans, and running Gemini extraction..."}
              </p>
            </div>

            {/* Progress Bar with Percentage */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Pipeline Stage</span>
                <span className="text-indigo-600 font-mono">{processingProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out shadow-xs"
                  style={{ width: `${Math.max(5, processingProgress)}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left text-xs text-slate-600 pt-2">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1. Multi-Page Render</span>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-2 font-semibold text-indigo-900">
                <Cpu className="w-4 h-4 text-indigo-600 shrink-0 animate-spin" />
                <span>2. AI Auto-Detection</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-400">
                <Layers className="w-4 h-4 shrink-0" />
                <span>3. BigQuery Routing</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header section of the block */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Intelligent Document Ingestion & Review
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Ready for Upload
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Upload Document to Begin AI Extraction & Review
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                The AI model automatically detects whether your file contains a <strong>full batch packet of multiple document types</strong> or a <strong>single specific document type</strong> (e.g. 2-page Purchase Order, GL Impact Ledger, or Sales Invoice). You can review and modify the extracted values before loading directly into the designated BigQuery table and Cloud Storage folder.
              </p>
            </div>

            {/* Direct Ingestion Dropzone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-indigo-50/30 transition-all space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  Drag and drop your document scan or PDF here
                </p>
                <p className="text-xs text-slate-500">
                  Supports Multi-Page PDF, Scanned TIFF, PNG, and JPEG up to 50MB
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Select Document File from Computer
                </button>
              </div>
            </div>

            {/* End file drop area */}
          </div>
        )}
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Automatic Document Detection</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            The model automatically analyzes scans to detect whether you uploaded a full batch with multiple document types or a standalone document (like a 2-page PO).
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Document Review & Editing</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Review every extracted field, line item, and tax calculation. You can modify any value before committing the document load to BigQuery and Cloud Storage.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <FolderArchive className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Targeted Multi-Table Ingestion</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Each document type automatically routes to its dedicated BigQuery table (<code className="font-mono text-[10px] text-blue-800">purchase_orders</code>, <code className="font-mono text-[10px] text-blue-800">gl_impacts</code>, etc.) and Cloud Storage archive folder.
          </p>
        </div>
      </div>
    </div>
  );
};

