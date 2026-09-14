import React, { useState } from "react";
import { AuditLogEntry } from "../types/dms";
import { verifyAuditChain } from "../lib/hashChain";
import {
  ShieldCheck,
  ShieldAlert,
  X,
  RefreshCw,
  Lock,
  Download,
  Bug,
} from "lucide-react";

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
  onSimulateTamper: () => void;
  onRestoreChain: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  onSimulateTamper,
  onRestoreChain,
}) => {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await verifyAuditChain(auditLogs);
      setVerificationResult(res);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Audit Trail & Hash Chain
                <span className="text-[11px] font-mono text-emerald-800 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                  BIR RR 9-2009 Defensible
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Immutable SHA-256 cryptographic sequence logging every user action and change
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

        {/* Action Ribbon */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifying ? "animate-spin" : ""}`} />
              Verify Chain Integrity
            </button>

            <button
              onClick={onSimulateTamper}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              title="Test detection by modifying a historical record"
            >
              <Bug className="w-3.5 h-3.5" />
              Simulate DB Tamper
            </button>

            <button
              onClick={onRestoreChain}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              Restore Chain
            </button>
          </div>

          {verificationResult && (
            <div>
              {verificationResult.valid ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Chain Intact: {verificationResult.totalEntries} entries sealed
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Tampering Caught at Row #{verificationResult.brokenIndex + 1}!
                </span>
              )}
            </div>
          )}
        </div>

        {/* Audit Log Entries List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 text-xs">
          {verificationResult && !verificationResult.valid && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <strong>Cryptographic Violation:</strong> Forward hash mismatch detected. Any alteration of past rows immediately breaks the chain.
              </div>
            </div>
          )}

          {auditLogs.map((log) => (
            <div
              key={log.seq}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 hover:bg-slate-100/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 bg-white border border-slate-200 text-indigo-700 rounded">
                    #{log.seq}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    {log.action}
                  </span>
                  <span className="font-semibold text-slate-800">{log.object_type}: {log.object_id}</span>
                </div>

                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(log.at).toLocaleDateString("en-PH")}
                </span>
              </div>

              <div className="text-[11px] text-slate-600 font-mono bg-white p-2 rounded border border-slate-200">
                {typeof log.detail === "object" ? JSON.stringify(log.detail) : log.detail}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                <div>Actor: <strong className="text-slate-700">{log.actor_email}</strong></div>
                <div>Hash: <strong className="text-emerald-700">{log.row_hash.slice(0, 16)}...</strong></div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">WORM Retention: 10 Years</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
