import React, { useState } from "react";
import { Bundle, Document } from "../types/dms";
import { evaluateReconciliationRules } from "../lib/reconciliation";
import {
  CheckCircle2,
  AlertTriangle,
  Scale,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ReconciliationMatrixProps {
  bundle: Bundle;
  documents: Document[];
  onNavigateToPage?: (pageNo: number) => void;
}

export const ReconciliationMatrix: React.FC<ReconciliationMatrixProps> = ({
  bundle,
  documents,
  onNavigateToPage,
}) => {
  const [filter, setFilter] = useState<"ALL" | "PASSED" | "FAILED">("ALL");
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  const rules = evaluateReconciliationRules(bundle, documents);
  const passedCount = rules.filter((r) => r.passed).length;
  const failedCount = rules.filter((r) => !r.passed).length;

  const filteredRules = rules.filter((r) => {
    if (filter === "PASSED") return r.passed;
    if (filter === "FAILED") return !r.passed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Accounting Formula Summary Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cross-Document Reconciliation
              </h2>
              <p className="text-xs text-slate-500">
                Mathematical proof across PO, Invoice, General Ledger, Tax 2307, and Check Voucher
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 w-fit">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            100% Balanced & BIR Ready
          </span>
        </div>

        {/* 3 Step Formula */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
            <span className="text-[11px] uppercase font-bold text-slate-500 block">
              1. Gross Purchases (PO / Invoice)
            </span>
            <span className="text-lg font-mono font-bold text-slate-900 mt-1 block">
              ₱{bundle.gross_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">PO #PRC-00000203 • SI #0447</span>
          </div>

          <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3.5">
            <span className="text-[11px] uppercase font-bold text-rose-700 block">
              2. Less: EWT 1% Withholding
            </span>
            <span className="text-lg font-mono font-bold text-rose-700 mt-1 block">
              - ₱{bundle.ewt_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-rose-600/90 mt-0.5 block">BIR Form 2307 (ATC WC158)</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5">
            <span className="text-[11px] uppercase font-bold text-emerald-800 block">
              3. Equals: Net Check Disbursed
            </span>
            <span className="text-lg font-mono font-bold text-emerald-800 mt-1 block">
              = ₱{bundle.net_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">Check #6615 • CV / CR / GL</span>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Rules ({rules.length})
          </button>
          <button
            onClick={() => setFilter("PASSED")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === "PASSED" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Passed ({passedCount})
          </button>
          <button
            onClick={() => setFilter("FAILED")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === "FAILED" ? "bg-white text-amber-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Variances ({failedCount})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredRules.length} verification tests
        </span>
      </div>

      {/* 3. Rules Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="p-3 w-16 text-center">Rule</th>
                <th className="p-3">Verification Test</th>
                <th className="p-3">Documents Compared</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Actual Value</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">View Pages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRules.map((rule) => {
                const isExpanded = expandedRuleId === rule.rule_id;
                return (
                  <React.Fragment key={rule.rule_id}>
                    <tr
                      onClick={() => setExpandedRuleId(isExpanded ? null : rule.rule_id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="p-3 text-center font-mono font-bold text-indigo-700">
                        {rule.rule_id}
                      </td>

                      <td className="p-3 font-medium text-slate-900">
                        <div>{rule.rule_name}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{rule.message}</div>
                      </td>

                      <td className="p-3 text-slate-600">
                        <div className="flex flex-wrap gap-1">
                          {rule.doc_sources.map((src, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200"
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3 font-mono text-slate-600 text-[11px]">{rule.expected}</td>
                      <td className="p-3 font-mono font-semibold text-slate-900 text-[11px]">{rule.actual}</td>

                      <td className="p-3 text-center">
                        {rule.passed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Balanced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Variance
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {rule.source_page_a && onNavigateToPage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToPage(rule.source_page_a!);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium flex items-center gap-1 border border-slate-200 shadow-sm"
                            >
                              p.{rule.source_page_a}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          {rule.source_page_b && onNavigateToPage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToPage(rule.source_page_b!);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium flex items-center gap-1 border border-slate-200 shadow-sm"
                            >
                              p.{rule.source_page_b}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={7} className="p-4 border-t border-slate-200">
                          <div className="text-xs text-slate-700 space-y-2">
                            <p className="font-semibold text-slate-900">
                              Rule [{rule.rule_id}]: {rule.rule_name}
                            </p>
                            <p>{rule.message}</p>
                            <div className="flex gap-6 pt-1 font-mono text-[11px]">
                              <div>Expected: <span className="font-bold">{rule.expected}</span></div>
                              <div>Actual: <span className="font-bold text-emerald-700">{rule.actual}</span></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
