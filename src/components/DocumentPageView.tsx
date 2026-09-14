import React, { useState, useRef, useEffect } from "react";
import { Page, OCRToken } from "../types/dms";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  FileText,
  Compass,
} from "lucide-react";

interface DocumentPageViewProps {
  page: Page;
  highlightToken?: string | null;
  activeBBox?: [number, number, number, number] | null;
  onTokenClick?: (token: OCRToken) => void;
  showBoundingBoxes?: boolean;
  onUploadFile?: (file: File) => void;
}

export const DocumentPageView: React.FC<DocumentPageViewProps> = ({
  page,
  highlightToken,
  activeBBox,
  onTokenClick,
  showBoundingBoxes = true,
  onUploadFile,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showEnhanced, setShowEnhanced] = useState(true);
  const [rotation, setRotation] = useState<number>(() => {
    // If page is wide GL impact or table, default to landscape if marked
    return page.rotation_applied || 0;
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync rotation if page changes and has designated rotation
  useEffect(() => {
    if (page.rotation_applied !== undefined) {
      setRotation(page.rotation_applied);
    }
  }, [page.page_id, page.rotation_applied]);

  const handleRotateCw = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateCcw = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleToggleLandscape = () => {
    // If currently portrait (0 or 180), rotate to landscape (90)
    // If currently landscape (90 or 270), toggle back to portrait (0)
    setRotation((prev) => (prev === 90 || prev === 270 ? 0 : 90));
  };

  const isLandscape = rotation === 90 || rotation === 270;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onUploadFile?.(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onUploadFile?.(file);
      e.target.value = "";
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-sm select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Viewer Toolbar - Clean & Intuitive */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-50 border border-indigo-200 font-bold text-indigo-900 text-xs truncate max-w-[340px]" title={page.title}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            {page.title}
          </div>
          {page.crop_penalty && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Check Margin Crop
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Enhanced vs Original Scan */}
          <button
            onClick={() => setShowEnhanced(!showEnhanced)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border cursor-pointer ${
              showEnhanced
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showEnhanced ? "Contrast Enhanced" : "Original"}
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono font-medium text-slate-700 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rotation & Landscape Controls */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-xs">
            {/* Quick Rotate Landscape */}
            <button
              onClick={handleToggleLandscape}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                isLandscape
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
              title="Rotate page to landscape / portrait"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{isLandscape ? "Landscape (90°)" : "Portrait"}</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

            {/* Rotate Counter-Clockwise */}
            <button
              onClick={handleRotateCcw}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Rotate -90° (Counter-clockwise)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Rotate Clockwise */}
            <button
              onClick={handleRotateCw}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Rotate +90° (Clockwise)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Drag Over Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-indigo-600/90 text-white flex flex-col items-center justify-center p-6 backdrop-blur-xs">
          <UploadCloud className="w-16 h-16 mb-3 animate-bounce" />
          <h3 className="text-xl font-bold">Drop your PDF file here</h3>
          <p className="text-sm text-indigo-100 mt-1">
            We will render the actual scanned pages and extract data with Gemini AI
          </p>
        </div>
      )}

      {/* Document Canvas Container */}
      <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-200/80">
        <div
          className="relative transition-transform duration-200 shadow-xl rounded bg-white border border-slate-300 overflow-hidden"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
            maxWidth: "680px",
            filter: showEnhanced ? "contrast(115%) brightness(100%)" : "none",
          }}
        >
          {/* IF Real Scanned Image exists from uploaded PDF */}
          {page.image_url ? (
            <div className="relative">
              <img
                src={page.image_url}
                alt={`Scanned Document Page ${page.page_no}`}
                className="w-full h-auto block select-none"
              />
              {/* Active OCR highlight box */}
              {activeBBox && (
                <div
                  className="absolute border-2 border-indigo-600 bg-indigo-500/20 rounded pointer-events-none transition-all duration-150 animate-pulse"
                  style={{
                    top: `${(activeBBox[0] / 1000) * 100}%`,
                    left: `${(activeBBox[1] / 1000) * 100}%`,
                    height: `${((activeBBox[2] - activeBBox[0]) / 1000) * 100}%`,
                    width: `${((activeBBox[3] - activeBBox[1]) / 1000) * 100}%`,
                  }}
                />
              )}
            </div>
          ) : page.source_doc_type === "gl_impact" ? (
            /* Authentic NetSuite GL Impact Report Facsimile */
            <div className="w-[680px] min-h-[880px] p-6 text-slate-900 bg-white relative flex flex-col justify-between font-mono text-[11px] leading-tight select-text">
              <div>
                {/* NetSuite Header Bar */}
                <div className="border-b-2 border-slate-900 pb-2 mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-base font-black tracking-tight text-slate-900">GL Impact</h1>
                      <p className="text-[11px] font-sans font-bold text-slate-700 mt-0.5">
                        Primer Resources Corp. (R.O.H.Q.-Phils.)
                      </p>
                      <p className="text-[10px] text-slate-500 font-sans">
                        Payee / Entity: POLYPROGRESS BUSINESS CORPORATION
                      </p>
                    </div>
                    <div className="text-right text-[10.5px]">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        Page {page.page_no === 4 ? "1 of 2" : page.page_no === 5 ? "2 of 2" : "1 of 1"}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Doc: {page.page_no === 3 ? "6615" : "VENDBILLPRC-001722"}
                      </p>
                    </div>
                  </div>

                  {/* Transaction metadata grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3 pt-2 border-t border-dashed border-slate-300 text-[10px] font-sans">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Transaction Type</span>
                      <span className="font-bold text-slate-800">{page.page_no === 3 ? "Bill Payment" : "Bill"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Date</span>
                      <span className="font-bold text-slate-800">{page.page_no === 3 ? "06/05/2025" : "05/26/2025"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Posting Period</span>
                      <span className="font-bold text-slate-800">{page.page_no === 3 ? "Jun 2025" : "May 2025"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Transaction #</span>
                      <span className="font-bold text-blue-900">{page.page_no === 3 ? "6615" : "VENDBILLPRC-001722"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Txn Currency</span>
                      <span className="font-bold text-emerald-800">PHP (₱)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Base Currency</span>
                      <span className="font-bold text-slate-800">PHP (₱)</span>
                    </div>
                  </div>
                </div>

                {/* NetSuite Accounting Table */}
                <div className="mt-3 border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[8.5px]">
                      <tr>
                        <th className="p-1 border-r border-slate-700">Account</th>
                        <th className="p-1 border-r border-slate-700">Memo</th>
                        <th className="p-1 border-r border-slate-700 bg-blue-900/40 text-blue-200">Location</th>
                        <th className="p-1 border-r border-slate-700">Dept</th>
                        <th className="p-1 border-r border-slate-700 text-center">Curr</th>
                        <th className="p-1 border-r border-slate-700 text-right">Debit (Txn)</th>
                        <th className="p-1 border-r border-slate-700 text-right">Credit (Txn)</th>
                        <th className="p-1 border-r border-slate-700 text-right bg-slate-900 text-amber-300">Base Debit</th>
                        <th className="p-1 text-right bg-slate-900 text-amber-300">Base Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[9.5px]">
                      {page.page_no === 4 ? (
                        <>
                          <tr className="hover:bg-amber-50/50">
                            <td className="p-1 font-bold border-r border-slate-200 text-slate-900">20101010200 Accounts Payable - Non Trade</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">Net check payable to Polyprogress</td>
                            <td className="p-1 border-r border-slate-200 font-bold text-blue-950 bg-blue-50/50">PRC HQ - PSC</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">Finance</td>
                            <td className="p-1 border-r border-slate-200 text-center font-bold text-slate-700">PHP</td>
                            <td className="p-1 border-r border-slate-200 text-right">0.00</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900">13,482.54</td>
                            <td className="p-1 border-r border-slate-200 text-right bg-slate-50/50">0.00</td>
                            <td className="p-1 text-right font-bold text-slate-900 bg-slate-50/50">13,482.54</td>
                          </tr>
                          <tr className="hover:bg-amber-50/50">
                            <td className="p-1 font-bold border-r border-slate-200 text-slate-900">20102010101 Accrued Purchases (Cutter)</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">Cutter Big 72 units</td>
                            <td className="p-1 border-r border-slate-200 font-bold text-blue-950 bg-blue-50/50">PRC HQ - PSC</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">Operations</td>
                            <td className="p-1 border-r border-slate-200 text-center font-bold text-slate-700">PHP</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900">1,285.71</td>
                            <td className="p-1 border-r border-slate-200 text-right">0.00</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900 bg-slate-50/50">1,285.71</td>
                            <td className="p-1 text-right bg-slate-50/50">0.00</td>
                          </tr>
                          <tr className="hover:bg-amber-50/50">
                            <td className="p-1 font-bold border-r border-slate-200 text-slate-900">20102010101 Accrued Purchases (Pen Pentel)</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">Pen Pentel Black 144 units</td>
                            <td className="p-1 border-r border-slate-200 font-bold text-blue-950 bg-blue-50/50">PRC HQ - PSC</td>
                            <td className="p-1 border-r border-slate-200 text-slate-400 italic">--</td>
                            <td className="p-1 border-r border-slate-200 text-center font-bold text-slate-700">PHP</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900">3,585.72</td>
                            <td className="p-1 border-r border-slate-200 text-right">0.00</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900 bg-slate-50/50">3,585.72</td>
                            <td className="p-1 text-right bg-slate-50/50">0.00</td>
                          </tr>
                          <tr className="hover:bg-amber-50/50">
                            <td className="p-1 font-bold border-r border-slate-200 text-slate-900">20102010101 Accrued Purchases (Stapler #50)</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">MAX Stapler #35 10 units</td>
                            <td className="p-1 border-r border-slate-200 font-bold text-blue-950 bg-blue-50/50">PRC HQ - PSC</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">Operations</td>
                            <td className="p-1 border-r border-slate-200 text-center font-bold text-slate-700">PHP</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900">3,303.57</td>
                            <td className="p-1 border-r border-slate-200 text-right">0.00</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900 bg-slate-50/50">3,303.57</td>
                            <td className="p-1 text-right bg-slate-50/50">0.00</td>
                          </tr>
                          <tr className="hover:bg-amber-50/50">
                            <td className="p-1 font-bold border-r border-slate-200 text-slate-900">20102010101 Accrued Purchases (Folder Expanding)</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">Folder Expanding Imported 200 units</td>
                            <td className="p-1 border-r border-slate-200 font-bold text-blue-950 bg-blue-50/50">PRC HQ - PSC</td>
                            <td className="p-1 border-r border-slate-200 text-slate-400 italic">--</td>
                            <td className="p-1 border-r border-slate-200 text-center font-bold text-slate-700">PHP</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900">3,571.43</td>
                            <td className="p-1 border-r border-slate-200 text-right">0.00</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900 bg-slate-50/50">3,571.43</td>
                            <td className="p-1 text-right bg-slate-50/50">0.00</td>
                          </tr>
                          <tr className="hover:bg-amber-50/50">
                            <td className="p-1 font-bold border-r border-slate-200 text-slate-900">20103010200 Withholding Tax Payable - Expanded</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">EWT Withheld 1% BIR 2307</td>
                            <td className="p-1 border-r border-slate-200 font-bold text-blue-950 bg-blue-50/50">PRC HQ - PSC</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">Finance</td>
                            <td className="p-1 border-r border-slate-200 text-center font-bold text-slate-700">PHP</td>
                            <td className="p-1 border-r border-slate-200 text-right">0.00</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900">121.46</td>
                            <td className="p-1 border-r border-slate-200 text-right bg-slate-50/50">0.00</td>
                            <td className="p-1 text-right font-bold text-slate-900 bg-slate-50/50">121.46</td>
                          </tr>
                        </>
                      ) : page.page_no === 5 ? (
                        <>
                          <tr className="hover:bg-amber-50/50">
                            <td className="p-1 font-bold border-r border-slate-200 text-slate-900">1010803100 Input VAT</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">12% Creditable Input Tax</td>
                            <td className="p-1 border-r border-slate-200 font-bold text-blue-950 bg-blue-50/50">PRC HQ - PSC</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">Finance</td>
                            <td className="p-1 border-r border-slate-200 text-center font-bold text-slate-700">PHP</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900">1,457.57</td>
                            <td className="p-1 border-r border-slate-200 text-right">0.00</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900 bg-slate-50/50">1,457.57</td>
                            <td className="p-1 text-right bg-slate-50/50">0.00</td>
                          </tr>
                          <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-800">
                            <td colSpan={5} className="p-1 text-right uppercase border-r border-slate-300">Total (PHP):</td>
                            <td className="p-1 text-right border-r border-slate-300 text-emerald-900 font-black">13,604.00</td>
                            <td className="p-1 text-right border-r border-slate-300 text-emerald-900 font-black">13,604.00</td>
                            <td className="p-1 text-right border-r border-slate-300 text-blue-950 font-black bg-amber-50/60">13,604.00</td>
                            <td className="p-1 text-right text-blue-950 font-black bg-amber-50/60">13,604.00</td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr className="hover:bg-amber-50/50">
                            <td className="p-1 font-bold border-r border-slate-200 text-slate-900">10101020600 Cash in Bank - BDO SA</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">ST447_VARIOUS OFFICE SUPPLIES / Check #000006615</td>
                            <td className="p-1 border-r border-slate-200 font-bold text-blue-950 bg-blue-50/50">PRC HQ - PSC</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">Finance</td>
                            <td className="p-1 border-r border-slate-200 text-center font-bold text-slate-700">PHP</td>
                            <td className="p-1 border-r border-slate-200 text-right">0.00</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900">13,482.54</td>
                            <td className="p-1 border-r border-slate-200 text-right bg-slate-50/50">0.00</td>
                            <td className="p-1 text-right font-bold text-slate-900 bg-slate-50/50">13,482.54</td>
                          </tr>
                          <tr className="hover:bg-amber-50/50">
                            <td className="p-1 font-bold border-r border-slate-200 text-slate-900">20101010200 Accounts Payable - Non Trade</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">Settlement of Invoice #0447 Polyprogress Corp</td>
                            <td className="p-1 border-r border-slate-200 font-bold text-blue-950 bg-blue-50/50">PRC HQ - PSC</td>
                            <td className="p-1 border-r border-slate-200 text-slate-600">Finance</td>
                            <td className="p-1 border-r border-slate-200 text-center font-bold text-slate-700">PHP</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900">13,482.54</td>
                            <td className="p-1 border-r border-slate-200 text-right">0.00</td>
                            <td className="p-1 border-r border-slate-200 text-right font-bold text-slate-900 bg-slate-50/50">13,482.54</td>
                            <td className="p-1 text-right bg-slate-50/50">0.00</td>
                          </tr>
                          <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-800">
                            <td colSpan={5} className="p-1 text-right uppercase border-r border-slate-300">Total (PHP):</td>
                            <td className="p-1 text-right border-r border-slate-300 text-emerald-900 font-black">13,482.54</td>
                            <td className="p-1 text-right border-r border-slate-300 text-emerald-900 font-black">13,482.54</td>
                            <td className="p-1 text-right border-r border-slate-300 text-blue-950 font-black bg-amber-50/60">13,482.54</td>
                            <td className="p-1 text-right text-blue-950 font-black bg-amber-50/60">13,482.54</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Rubber Stamps */}
                <div className="flex items-center justify-around mt-6 pt-4 border-t border-dashed border-slate-300">
                  <div className="border-2 border-blue-800 text-blue-900 p-2 rounded rotate-[-2deg] text-center font-sans">
                    <div className="text-[8px] font-black uppercase tracking-wider">NetSuite System Verification</div>
                    <div className="text-xs font-black tracking-widest my-0.5">POSTED</div>
                    <div className="text-[9px] font-semibold">MAY 27 2025 • JOSELITO DAVID</div>
                  </div>
                  <div className="border-2 border-emerald-800 text-emerald-900 p-2 rounded rotate-[1deg] text-center font-sans">
                    <div className="text-[8px] font-black uppercase tracking-wider">Primer Accounts Payable</div>
                    <div className="text-xs font-black tracking-widest my-0.5">PROCESSED</div>
                    <div className="text-[9px] font-semibold">26 MAY 2025 • C. BUENVIAJE</div>
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="mt-8 pt-3 border-t border-slate-200 text-slate-500 flex justify-between items-center text-[10px] font-sans">
                <span>NetSuite Financial System • Primer Resources Corp.</span>
                <span className="font-mono font-bold text-slate-700">{page.title}</span>
              </div>
            </div>
          ) : (
            /* Authentic scanned paper placeholder if no custom upload yet */
            <div className="w-[595px] min-h-[842px] p-8 text-slate-900 bg-white relative flex flex-col justify-between">
              {/* Watermark / Document Header */}
              <div>
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      Polyprogress Business Corporation
                    </h2>
                    <p className="text-[11px] text-slate-600">VAT REG TIN: 238-470-166-00000</p>
                    <p className="text-[10px] text-slate-500">552 E.T. Yuchengco St. Binondo, Manila</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-950 uppercase block">
                      {page.title}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Primer Group DMS</p>
                  </div>
                </div>

                {/* Document Body */}
                <div className="mt-6 space-y-4 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-bold text-slate-900">
                        Primer Resources Corp. R.O.H.Q.-Phils.
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">TIN:</span>
                      <span className="font-mono font-semibold">250-822-648-00000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Document Reference:</span>
                      <span className="font-mono font-bold text-indigo-900">
                        INV #0447 / CHK #6615
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="font-semibold text-slate-700">Total Amount:</span>
                      <span className="text-sm font-bold text-emerald-800">₱13,604.00 PHP</span>
                    </div>
                  </div>

                  {/* Stamp */}
                  <div className="border-2 border-emerald-700 text-emerald-800 p-3 rounded-lg rotate-[-2deg] max-w-[260px] opacity-90 mx-auto text-center font-bold">
                    <div className="text-[9px] uppercase tracking-wider">Primer Group of Companies</div>
                    <div className="text-base tracking-widest my-0.5">RECEIVED</div>
                    <div className="text-[10px]">23 MAY 2025 • CANDERELLA F. BUENVIAJE</div>
                  </div>
                </div>
              </div>

              {/* Action Banner to prompt uploading actual PDF */}
              <div className="mt-8 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center space-y-2">
                <FileText className="w-8 h-8 text-indigo-600 mx-auto" />
                <h4 className="text-xs font-bold text-indigo-900">
                  Ready for real scan upload
                </h4>
                <p className="text-[11px] text-indigo-700">
                  Drop your <span className="font-semibold">NS Sample Document.pdf</span> directly here to see the real scanned pages and run Gemini AI extraction.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Select NS Sample Document.pdf
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
