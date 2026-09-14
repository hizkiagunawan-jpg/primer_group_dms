import React, { useState } from "react";
import { Folder, CustodyEvent, AppUser } from "../types/dms";
import {
  Box,
  MapPin,
  Clock,
  UserCheck,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface PhysicalTrackingPanelProps {
  folder: Folder;
  custodyEvents: CustodyEvent[];
  currentUser: AppUser;
  onAddCustodyEvent: (event: Omit<CustodyEvent, "id">) => void;
}

export const PhysicalTrackingPanel: React.FC<PhysicalTrackingPanelProps> = ({
  folder,
  custodyEvents,
  currentUser,
  onAddCustodyEvent,
}) => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqType, setReqType] = useState<"REQUEST" | "CHECKOUT" | "CHECKIN">("REQUEST");
  const [expectedReturn, setExpectedReturn] = useState("2025-06-25");
  const [note, setNote] = useState("");
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onAddCustodyEvent({
      folder_no: folder.folder_no,
      event_type: reqType,
      requester_id: currentUser.user_id,
      requester_name: currentUser.display_name,
      custodian_id: "usr-pc-04",
      custodian_name: "Eduardo Torres (Authorized Custodian)",
      expected_return: expectedReturn,
      integrity_note: note || "Routine audit review",
      at: new Date().toISOString(),
    });

    setSuccessNotice(`Physical custody event logged: ${reqType} for ${folder.folder_no}`);
    setShowRequestForm(false);
    setNote("");
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card with Barcode */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Box className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Physical Paper Vault Tracking
              </h2>
              <p className="text-xs text-slate-500">
                Parallel physical folder coordinates and chain of custody
              </p>
            </div>
          </div>

          {/* Barcode representation */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
            <div className="flex items-center justify-center space-x-0.5 h-8 w-40 px-1">
              <div className="w-1 h-full bg-slate-900"></div>
              <div className="w-0.5 h-full bg-white"></div>
              <div className="w-2 h-full bg-slate-900"></div>
              <div className="w-1 h-full bg-white"></div>
              <div className="w-1 h-full bg-slate-900"></div>
              <div className="w-0.5 h-full bg-slate-900"></div>
              <div className="w-1 h-full bg-white"></div>
              <div className="w-2.5 h-full bg-slate-900"></div>
              <div className="w-1 h-full bg-white"></div>
              <div className="w-1 h-full bg-slate-900"></div>
              <div className="w-2 h-full bg-slate-900"></div>
              <div className="w-1 h-full bg-white"></div>
              <div className="w-2 h-full bg-slate-900"></div>
            </div>
            <div className="text-[10px] font-mono font-bold tracking-widest mt-1 text-slate-700">
              {folder.barcode}
            </div>
          </div>
        </div>

        {/* 4 Location Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Box Number</span>
            <span className="text-sm font-mono font-bold text-indigo-700 mt-0.5 block">
              {folder.location.box_no}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">{folder.location.label}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Shelf Coordinates</span>
            <span className="text-sm font-mono font-bold text-slate-900 mt-0.5 block">
              {folder.location.aisle} • {folder.location.rack}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">{folder.location.shelf}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Status</span>
            <span className="text-sm font-semibold text-emerald-700 mt-0.5 block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Secured in Vault
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">{folder.current_custodian}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Custody Log</span>
            <button
              onClick={() => setShowRequestForm(!showRequestForm)}
              className="mt-2 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Log Check-Out / Return
            </button>
          </div>
        </div>
      </div>

      {/* Custody Form Modal / Drawer */}
      {showRequestForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-md">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Log Physical Custody Event
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Action Type</label>
              <select
                value={reqType || "REQUEST"}
                onChange={(e: any) => setReqType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="REQUEST">REQUEST (Access Permission)</option>
                <option value="CHECKOUT">CHECKOUT (Physical Extraction)</option>
                <option value="CHECKIN">CHECKIN (Returned to Box)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Expected Return</label>
              <input
                type="date"
                value={expectedReturn || ""}
                onChange={(e) => setExpectedReturn(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Purpose / Note</label>
              <input
                type="text"
                placeholder="e.g. BIR Auditor inspection"
                value={note || ""}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded shadow-sm"
              >
                Record Event
              </button>
            </div>
          </form>
        </div>
      )}

      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Custody History Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Chain of Custody Events ({custodyEvents.length})
          </h3>
          <span className="text-[11px] text-slate-500">Custodian: Eduardo Torres</span>
        </div>

        <div className="divide-y divide-slate-100">
          {custodyEvents.map((evt) => (
            <div key={evt.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      evt.event_type === "REQUEST"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : evt.event_type === "CHECKOUT"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {evt.event_type}
                  </span>
                  <span className="font-semibold text-slate-900">{evt.requester_name}</span>
                </div>
                <p className="text-slate-600 text-[11px]">{evt.integrity_note}</p>
              </div>

              <div className="text-right text-[11px] font-mono text-slate-500">
                <div>{new Date(evt.at).toLocaleDateString("en-PH")}</div>
                {evt.expected_return && (
                  <div className="text-slate-400">Due: {evt.expected_return}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
