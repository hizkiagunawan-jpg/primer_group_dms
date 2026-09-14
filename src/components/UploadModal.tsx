import React, { useState, useRef } from "react";
import { UploadCloud, Sparkles, X, CheckCircle2 } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (sampleName: string) => void;
  onUploadPdfFile?: (file: File) => Promise<void>;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
  onUploadPdfFile,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [declaredPages, setDeclaredPages] = useState(10);
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      e.target.value = "";
    }
  };

  const runSimulationPipeline = async (filename: string) => {
    if (selectedFile && onUploadPdfFile) {
      setProcessingStage("Rendering scanned pages & running Gemini AI extraction...");
      setProgress(40);
      try {
        await onUploadPdfFile(selectedFile);
        setProgress(100);
        setProcessingStage("Complete! Document packet ready.");
        setTimeout(() => {
          onClose();
        }, 500);
        return;
      } catch (err: any) {
        setProcessingStage(`Error: ${err?.message || "Failed"}`);
        return;
      }
    }

    setProcessingStage("Verifying 10 pages and deskewing scans...");
    setProgress(30);

    setTimeout(() => {
      setProcessingStage("Extracting financial values via Gemini...");
      setProgress(75);

      setTimeout(() => {
        setProcessingStage("Reconciling PO, Invoice, and GL voucher...");
        setProgress(100);

        setTimeout(() => {
          onUploadComplete(filename);
          onClose();
        }, 500);
      }, 700);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
              <UploadCloud className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Upload Accounting Voucher Packet
              </h2>
              <p className="text-xs text-slate-500">
                Process multi-page PDF scans or reload the 10-page sample
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Drag & Drop */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
              dragActive
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <UploadCloud className="w-8 h-8 text-slate-400" />
              <div>
                <span className="font-semibold text-slate-800">
                  {selectedFile ? selectedFile.name : "Click to select or drop voucher PDF here"}
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5">Supports PDF or multi-page scans (300 DPI)</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          {processingStage && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-indigo-700 font-medium">
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

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={!!processingStage}
            className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const fname = selectedFile ? selectedFile.name : "VOUCHER_SCAN_060042.pdf";
              runSimulationPipeline(fname);
            }}
            disabled={!!processingStage}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm"
          >
            Process Document
          </button>
        </div>
      </div>
    </div>
  );
};
