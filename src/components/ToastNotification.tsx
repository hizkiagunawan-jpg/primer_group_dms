import React from "react";
import { CheckCircle2, AlertTriangle, Info, X, Database } from "lucide-react";

export interface SystemNotification {
  id: string;
  type: "SUCCESS" | "INFO" | "WARNING";
  title: string;
  message: string;
  jobId?: string;
  timestamp: string;
  badge?: string;
  isLive?: boolean;
}

interface ToastNotificationProps {
  notification: SystemNotification | null;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onClose,
}) => {
  if (!notification) return null;

  const isLive = notification.isLive ?? false;
  const badgeText = notification.badge || (isLive ? "LIVE BIGQUERY" : "PREFLIGHT SANDBOX");

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-slideUp">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={`p-2 rounded-xl flex-shrink-0 mt-0.5 border ${
              isLive
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
            }`}
          >
            {isLive ? <CheckCircle2 className="w-5 h-5" /> : <Database className="w-5 h-5" />}
          </span>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-white">
                {notification.title}
              </h4>
              <span
                className={`px-1.5 py-0.5 font-mono text-[10px] font-bold rounded ${
                  isLive
                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                    : "bg-blue-500/30 text-blue-300 border border-blue-500/30"
                }`}
              >
                {badgeText}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {notification.message}
            </p>

            {notification.jobId && (
              <div
                className={`flex items-center gap-2 pt-1 font-mono text-[11px] ${
                  isLive ? "text-emerald-400" : "text-blue-300"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Job Ref: {notification.jobId}</span>
              </div>
            )}

            <div className="text-[10px] text-slate-400 pt-0.5">
              {notification.timestamp} • BIR RR 9-2009 WORM Audit Trail
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
