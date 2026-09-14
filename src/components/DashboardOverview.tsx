import React from "react";
import { Bundle, Document, Page, AppUser } from "../types/dms";
import {
  FileText,
  Scale,
  Box,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Search,
  UploadCloud,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface DashboardOverviewProps {
  bundle: Bundle;
  documents: Document[];
  pages: Page[];
  currentUser: AppUser;
  quarantinedCount: number;
  bqSynced: boolean;
  onNavigateToView: (view: any) => void;
  onNavigateToPage: (pageNo: number) => void;
  onOpenBigQueryModal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  bundle,
  documents,
  pages,
  currentUser,
  quarantinedCount,
  bqSynced,
  onNavigateToView,
  onNavigateToPage,
  onOpenBigQueryModal,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Amount */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Gross Purchases (PO & SI)</span>
          <div className="text-xl font-mono font-bold text-slate-900 mt-1">
            ₱{bundle.gross_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">PO #PRC-00000203 • SI #0447</span>
        </div>

        {/* EWT 1% Tax */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-rose-700 block">Withholding Tax (1% EWT)</span>
          <div className="text-xl font-mono font-bold text-rose-700 mt-1">
            ₱{bundle.ewt_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-rose-600/80 mt-1 block">BIR Form 2307 (ATC WC158)</span>
        </div>

        {/* Net Check Disbursed */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-800 block">Net Disbursed (Check #6615)</span>
          <div className="text-xl font-mono font-bold text-emerald-800 mt-1">
            ₱{bundle.net_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-700/80 mt-1 block">Metrobank • CV Approved</span>
        </div>

        {/* HITL Review Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">HITL Verification</span>
            <div className="flex items-center gap-2 mt-1">
              {quarantinedCount > 0 ? (
                <span className="text-sm font-bold text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  1 Action Required
                </span>
              ) : (
                <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  All 9 Documents Verified
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onNavigateToView("REVIEW")}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2"
          >
            <span>Go to Document Review</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 3. Action Alert Banner if Crop Penalty Pending */}
      {quarantinedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-amber-900">
                Action Needed: Scanner Crop Notice on Check Voucher #VENDPYMTPRC-000852
              </h3>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                The scanner cut off the right edge of &ldquo;Polyprogress Business Corp.&rdquo; Human-in-the-loop review is required to verify and approve.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onNavigateToPage(2);
              onNavigateToView("REVIEW");
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs flex-shrink-0 transition-colors"
          >
            <span>Review Check Voucher</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Processing Pipeline Flow */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          5-Stage Processing Pipeline
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {/* Stage 1 */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
            <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              1. Ingestion
            </span>
            <span className="font-semibold text-slate-800 block mt-1">10 Pages Scanned</span>
            <span className="text-[10px] text-slate-500 block">300 DPI Deskewed</span>
          </div>

          {/* Stage 2 */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
            <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              2. AI Extraction
            </span>
            <span className="font-semibold text-slate-800 block mt-1">1,420 Tokens</span>
            <span className="text-[10px] text-slate-500 block">95% Confidence</span>
          </div>

          {/* Stage 3 */}
          <div
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              quarantinedCount > 0
                ? "bg-amber-50 border-amber-300 ring-2 ring-amber-100"
                : "bg-emerald-50/60 border-emerald-200"
            }`}
            onClick={() => onNavigateToView("REVIEW")}
          >
            <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${
              quarantinedCount > 0 ? "text-amber-800" : "text-emerald-800"
            }`}>
              {quarantinedCount > 0 ? (
                <AlertTriangle className="w-3 h-3 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              )}
              3. HITL Review
            </span>
            <span className="font-semibold text-slate-800 block mt-1">
              {quarantinedCount > 0 ? "Check Voucher Review" : "All Approved"}
            </span>
            <span className="text-[10px] text-slate-500 block">Click to review</span>
          </div>

          {/* Stage 4 */}
          <div
            className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg cursor-pointer hover:bg-emerald-100/50 transition-colors"
            onClick={() => onNavigateToView("RECONCILIATION")}
          >
            <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              4. Reconciliation
            </span>
            <span className="font-semibold text-slate-800 block mt-1">15/15 Rules</span>
            <span className="text-[10px] text-slate-500 block">100% Balanced</span>
          </div>

          {/* Stage 5 */}
          <div
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              bqSynced
                ? "bg-emerald-50/60 border-emerald-200"
                : "bg-blue-50/60 border-blue-200 hover:bg-blue-100/50"
            }`}
            onClick={onOpenBigQueryModal}
          >
            <span className="text-[10px] font-bold text-blue-800 uppercase flex items-center gap-1">
              <Database className="w-3 h-3 text-blue-600" />
              5. BigQuery
            </span>
            <span className="font-semibold text-slate-800 block mt-1">
              {bqSynced ? "Ingested & Synced" : "Ready to Commit"}
            </span>
            <span className="text-[10px] text-slate-500 block">voucher_packets</span>
          </div>
        </div>
      </div>

      {/* 5. Documents Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Documents in Voucher Packet (10 Pages)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click any document to open side-by-side verification and OCR bounds
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-600">
            {documents.length} Extracted Documents
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
              <tr>
                <th className="p-3">Page</th>
                <th className="p-3">Document Title</th>
                <th className="p-3">Reference #</th>
                <th className="p-3">Vendor / Entity</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const isQuarantined = doc.status === "quarantined";
                const isCheck = doc.extraction.check_no;
                return (
                  <tr
                    key={doc.document_id}
                    onClick={() => {
                      onNavigateToPage(doc.page_from);
                      onNavigateToView("REVIEW");
                    }}
                    className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                      isQuarantined ? "bg-amber-50/30" : ""
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-indigo-700">
                      p.{doc.page_from}{doc.page_to > doc.page_from ? `-${doc.page_to}` : ""}
                    </td>

                    <td className="p-3 font-medium text-slate-900">
                      <div className="capitalize">{doc.doc_type.replace("_", " ")}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{doc.system_doc_no}</div>
                    </td>

                    <td className="p-3 font-mono text-slate-700">
                      {doc.extraction.document_number || doc.extraction.invoice_number || doc.extraction.po_number || doc.extraction.check_no || "—"}
                    </td>

                    <td className="p-3 text-slate-700 truncate max-w-[180px]">
                      {doc.extraction.vendor_name || "—"}
                    </td>

                    <td className="p-3 text-right font-mono font-semibold text-slate-900">
                      {doc.extraction.gross_amount > 0 ? (
                        `₱${doc.extraction.gross_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="p-3 text-center">
                      {isQuarantined ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Crop Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Approved
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToPage(doc.page_from);
                          onNavigateToView("REVIEW");
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-[11px] font-medium transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
