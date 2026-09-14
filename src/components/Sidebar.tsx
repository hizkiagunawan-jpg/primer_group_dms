import React from "react";
import { AppUser, Bundle } from "../types/dms";
import {
  LayoutDashboard,
  FileText,
  Search,
  Scale,
  Box,
  Lock,
  Database,
} from "lucide-react";

export type NavView =
  | "DASHBOARD"
  | "REVIEW"
  | "SEARCH"
  | "RECONCILIATION"
  | "PHYSICAL"
  | "AUDIT";

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  currentUser: AppUser;
  onSelectUser: (user: AppUser) => void;
  availableUsers: AppUser[];
  quarantinedCount?: number;
  bundle: Bundle;
  onOpenBigQueryModal: () => void;
  bqSynced: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  currentUser,
  onSelectUser,
  availableUsers,
  onOpenBigQueryModal,
  bqSynced,
}) => {
  const navItems = [
    {
      id: "DASHBOARD" as NavView,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "REVIEW" as NavView,
      label: "Batch Processing & Review",
      icon: FileText,
    },
    {
      id: "SEARCH" as NavView,
      label: "Smart Content Search",
      icon: Search,
    },
    {
      id: "RECONCILIATION" as NavView,
      label: "Reconciliation Matrix",
      icon: Scale,
    },
    {
      id: "PHYSICAL" as NavView,
      label: "Physical Paper Vault",
      icon: Box,
    },
    {
      id: "AUDIT" as NavView,
      label: "Audit Trail & Integrity",
      icon: Lock,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
      {/* 1. Brand & Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-xs flex-shrink-0">
            D
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNuYBUwY49_NeE9_8L6pLwrS9Fm_u62qqQtlDNLu8hS_Lb2LRpRbdVoas&s=10"
                alt="searce logo"
                className="h-5 object-contain rounded-xs"
                referrerPolicy="no-referrer"
              />
              <span className="text-indigo-600 font-bold text-sm tracking-tight">DMS</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
              Document Management
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. BigQuery Sync & Action Box */}
      <div className="p-3 border-t border-slate-200">
        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px]">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              BigQuery Sync
            </div>
            {bqSynced ? (
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                INGESTED
              </span>
            ) : (
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">
                READY
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Transfer verified document records to BigQuery.
          </p>

          <button
            onClick={onOpenBigQueryModal}
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            {bqSynced ? "View Ingestion Status" : "Send to BigQuery"}
          </button>
        </div>
      </div>

      {/* 4. Active User Profile & Role Selector */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400">Current Role</span>
          <span className="text-[10px] font-mono text-emerald-700 font-medium">MFA Active</span>
        </div>

        <select
          value={currentUser.user_id}
          onChange={(e) => {
            const u = availableUsers.find((x) => x.user_id === e.target.value);
            if (u) onSelectUser(u);
          }}
          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
        >
          {availableUsers.map((u) => (
            <option key={u.user_id} value={u.user_id}>
              {u.display_name.split(" (")[0]} • {u.role_id.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
};
