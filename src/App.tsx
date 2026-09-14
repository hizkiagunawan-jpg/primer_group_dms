import React, { useState } from "react";
import {
  DEFAULT_USERS,
  INITIAL_BATCH,
  INITIAL_BUNDLE,
  INITIAL_CUSTODY_EVENTS,
  INITIAL_DOCUMENTS,
  INITIAL_FOLDERS,
  INITIAL_PAGES,
  INITIAL_AUDIT_LOG,
  INITIAL_LINES,
} from "./data/samplePacket";
import { AppUser, AuditLogEntry, Bundle, CustodyEvent, Document, Page } from "./types/dms";
import { Sidebar, NavView } from "./components/Sidebar";
import { DashboardOverview } from "./components/DashboardOverview";
import { ReviewConsole } from "./components/ReviewConsole";
import { SmartSearch } from "./components/SmartSearch";
import { ReconciliationMatrix } from "./components/ReconciliationMatrix";
import { PhysicalTrackingPanel } from "./components/PhysicalTrackingPanel";
import { BigQueryIngestionModal } from "./components/BigQueryIngestionModal";
import { AuditTrailModal } from "./components/AuditTrailModal";
import { UploadModal } from "./components/UploadModal";
import { DocumentReviewUploadPrompt } from "./components/DocumentReviewUploadPrompt";
import { ToastNotification, SystemNotification } from "./components/ToastNotification";
import { createAuditEntry } from "./lib/hashChain";
import { processUploadedPdf } from "./lib/pdfProcessingHandler";
import {
  getScenario1BatchPacket,
  getScenario2PurchaseOrder,
  getScenario2GlImpact,
  getScenario2SalesInvoice,
  ScenarioResult,
} from "./data/scenarioData";
import {
  UploadCloud,
  User,
  ShieldCheck,
  Cpu,
  Sparkles,
} from "lucide-react";

export default function App() {
  // State management
  const [currentUser, setCurrentUser] = useState<AppUser>(DEFAULT_USERS[0]);
  const [currentView, setCurrentView] = useState<NavView>("DASHBOARD");
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
  const [selectedPageNo, setSelectedPageNo] = useState<number>(1);
  const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCUMENTS);
  const [bundle, setBundle] = useState<Bundle>(INITIAL_BUNDLE);
  const [batch, setBatch] = useState(INITIAL_BATCH);
  const [folder, setFolder] = useState(INITIAL_FOLDERS[0]);
  const [custodyEvents, setCustodyEvents] = useState<CustodyEvent[]>(INITIAL_CUSTODY_EVENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOG);
  const [bqSynced, setBqSynced] = useState<boolean>(false);
  const [notification, setNotification] = useState<SystemNotification | null>(null);

  // Document upload & AI processing states
  const [hasUploadedDocument, setHasUploadedDocument] = useState<boolean>(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBigQueryModal, setShowBigQueryModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Current page and matching document
  const selectedPage = pages.find((p) => p.page_no === selectedPageNo) || pages[0];
  const selectedDoc =
    documents.find((d) => selectedPageNo >= d.page_from && selectedPageNo <= d.page_to) || documents[0];

  // Helper to log audit events
  const addAuditLog = async (
    action: AuditLogEntry["action"],
    object_type: AuditLogEntry["object_type"],
    object_id: string,
    detail: Record<string, any>
  ) => {
    const lastLog = auditLogs.length > 0 ? auditLogs[auditLogs.length - 1] : null;
    const newEntry = await createAuditEntry(
      lastLog,
      {
        user_id: currentUser.user_id,
        email: currentUser.email,
        role_id: currentUser.role_id,
      },
      action,
      object_type,
      object_id,
      detail
    );
    setAuditLogs((prev) => [...prev, newEntry]);
  };

  // Update document after review
  const handleUpdateDocument = (updatedDoc: Document, note: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.document_id === updatedDoc.document_id ? updatedDoc : d))
    );

    if (updatedDoc.document_id === "doc-02-cv") {
      setBundle((prev) => ({
        ...prev,
        vendor_name: updatedDoc.extraction.vendor_name || prev.vendor_name,
      }));
    }

    addAuditLog("UPDATE", "DOCUMENT", updatedDoc.document_id, {
      note,
      updated_by: currentUser.display_name,
      status: updatedDoc.status,
    });
  };

  // Add physical custody event
  const handleAddCustodyEvent = (event: Omit<CustodyEvent, "id">) => {
    const newEvt: CustodyEvent = {
      ...event,
      id: custodyEvents.length + 1,
    };
    setCustodyEvents((prev) => [newEvt, ...prev]);

    addAuditLog("UPDATE", "FOLDER", folder.folder_no, {
      event_type: event.event_type,
      requester: event.requester_name,
      note: event.integrity_note,
    });
  };

  const handleSimulateTamper = () => {
    if (auditLogs.length >= 2) {
      setAuditLogs((prev) => {
        const copy = [...prev];
        copy[0] = {
          ...copy[0],
          detail: { message: "UNAUTHORIZED_MODIFICATION: Deleted batch record" },
        };
        return copy;
      });
    }
  };

  const handleRestoreChain = () => {
    setAuditLogs(INITIAL_AUDIT_LOG);
  };

  const handleProcessPdfFile = async (file: File, docTypeMode: string = "auto") => {
    setIsProcessingUpload(true);
    setProcessingProgress(15);
    setProcessingStage("Rendering document pages with PDF.js...");
    setUploadedFileName(file.name);

    setNotification({
      id: `proc-${Date.now()}`,
      type: "SUCCESS",
      title: "Document Upload On Process",
      message: `Analyzing scan geometry and running Gemini AI extraction for ${file.name}`,
      timestamp: new Date().toLocaleTimeString(),
    });

    try {
      const result = await processUploadedPdf(
        file,
        docTypeMode,
        documents,
        (stage: string, percent: number) => {
          setProcessingStage(stage);
          setProcessingProgress(percent);
        }
      );
      setPages(result.pages);
      setDocuments(result.documents);
      setSelectedPageNo(1);
      setHasUploadedDocument(true);
      setCurrentView("REVIEW");

      if (result.documents.length > 0 && result.documents[0].extraction?.vendor_name) {
        setBundle((prev) => ({
          ...prev,
          vendor_name: result.documents[0].extraction.vendor_name,
          total_amount: result.documents[0].extraction.gross_amount || prev.total_amount,
        }));
      }

      addAuditLog("CREATE", "BATCH", `batch-${Date.now()}`, {
        filename: file.name,
        pages_detected: result.pages.length,
        classified_title: result.classifiedTitle,
        doc_type: result.classifiedDocType,
        target_bq_table: result.targetBqTable,
        target_gcs_folder: result.targetGcsFolder,
        method: "GEMINI_AI_PDF_JS",
      });

      setNotification({
        id: `done-${Date.now()}`,
        type: "SUCCESS",
        title: `Classified: ${result.classifiedTitle}`,
        message: `${file.name} (${result.pages.length} pages) extracted with ${result.classifiedDocType} structure. Staged for BigQuery table ${result.targetBqTable}. Ready for verification.`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      console.error("Failed to process uploaded PDF:", err);
      setNotification({
        id: `err-${Date.now()}`,
        type: "WARNING",
        title: "Upload Notice",
        message: err?.message || "Could not parse PDF. Please verify the document format.",
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsProcessingUpload(false);
      setProcessingProgress(100);
    }
  };

  const handleLoadDemoSample = async () => {
    setIsProcessingUpload(true);
    setProcessingProgress(10);
    setProcessingStage("Generating NS Sample Document.pdf & initializing vision pipeline...");
    setUploadedFileName("NS Sample Document.pdf");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1240;
      canvas.height = 1754;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // High quality rendering of sample accounting packet
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText("PRIMER RESOURCES CORP. R.O.H.Q.-PHILS.", 80, 110);
        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText("22/F PRIMER STAR CENTER, BONIFACIO GLOBAL CITY, TAGUIG", 80, 140);
        
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(80, 170);
        ctx.lineTo(1160, 170);
        ctx.stroke();

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText("COLLECTION RECEIPT / OFFICIAL ACKNOWLEDGEMENT", 80, 220);
        
        ctx.font = "18px sans-serif";
        ctx.fillText("RECEIPT NO: CR-PRC-2025-0012813", 80, 270);
        ctx.fillText("DATE: 2025-06-10", 820, 270);
        
        ctx.fillText("RECEIVED FROM: PRIMER RESOURCES CORPORATION", 80, 320);
        ctx.fillText("BUYER TIN: 250-822-648-00000", 820, 320);
        
        ctx.fillText("ISSUED BY / PAYEE: POLYPROGRESS BUSINESS CORP.", 80, 370);
        ctx.fillText("VENDOR TIN: 238-470-166-00000", 820, 370);
        
        ctx.fillText("PAYMENT MODE: METROBANK CHECK #0000006615", 80, 420);
        ctx.fillText("REF SALES INVOICE: SI-0447", 820, 420);

        // Box for financial breakdown
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(80, 470, 1080, 240);
        ctx.strokeRect(80, 470, 1080, 240);
        
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("ACCOUNTING BREAKDOWN & TAX COMPUTATION", 110, 515);
        
        ctx.font = "18px monospace";
        ctx.fillText("GROSS AMOUNT:                    PHP 13,604.00", 110, 560);
        ctx.fillText("VATABLE SALES (12%):             PHP 12,146.43", 110, 595);
        ctx.fillText("VALUE ADDED TAX (12%):           PHP  1,457.57", 110, 630);
        ctx.fillText("EXPANDED WITHHOLDING TAX (1%):   PHP    121.46", 110, 665);
        
        ctx.font = "bold 20px monospace";
        ctx.fillStyle = "#1e3a8a";
        ctx.fillText("NET CASH / CHECK AMOUNT PAID:    PHP 13,482.54", 110, 700);

        // Signatures
        ctx.fillStyle = "#334155";
        ctx.font = "16px sans-serif";
        ctx.fillText("RECEIVED BY: Rogelio Reballego (Authorized Collector)", 110, 780);
        ctx.fillText("STATUS: RECEIVED & POSTED IN NETSUITE", 110, 820);
      }

      canvas.toBlob(async (blob) => {
        if (blob) {
          const sampleFile = new File([blob], "NS_Sample_Document.pdf", { type: "image/png" });
          await handleProcessPdfFile(sampleFile);
        }
      }, "image/png");
    } catch (e: any) {
      console.error("Error creating demo sample:", e);
      setIsProcessingUpload(false);
    }
  };

  const handleSelectScenario = (scenarioType: "batch_all" | "single_po" | "single_gl" | "single_invoice") => {
    let result: ScenarioResult;
    switch (scenarioType) {
      case "batch_all":
        result = getScenario1BatchPacket();
        break;
      case "single_po":
        result = getScenario2PurchaseOrder();
        break;
      case "single_gl":
        result = getScenario2GlImpact();
        break;
      case "single_invoice":
        result = getScenario2SalesInvoice();
        break;
      default:
        result = getScenario1BatchPacket();
    }

    setPages(result.pages);
    setDocuments(result.documents);
    setSelectedPageNo(1);
    setUploadedFileName(result.fileName);
    setHasUploadedDocument(true);
    setCurrentView("REVIEW");

    if (result.documents.length > 0 && result.documents[0].extraction?.vendor_name) {
      setBundle((prev) => ({
        ...prev,
        vendor_name: result.documents[0].extraction.vendor_name,
        total_amount: result.documents[0].extraction.gross_amount || prev.total_amount,
      }));
    }

    addAuditLog("CREATE", "BATCH", `batch-${Date.now()}`, {
      filename: result.fileName,
      pages_count: result.pages.length,
      doc_types: result.documents.map((d) => d.doc_type),
      scenario: result.scenarioNumber,
      target_bq_table: result.targetBqTable,
      target_gcs_folder: result.targetGcsFolder,
    });

    setNotification({
      id: `scen-${Date.now()}`,
      type: "SUCCESS",
      title: result.summaryTitle,
      message: result.summaryMessage,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleUploadComplete = (sampleName: string) => {
    setHasUploadedDocument(true);
    addAuditLog("CREATE", "BATCH", INITIAL_BATCH.batch_id, {
      filename: sampleName,
      declared_pages: 10,
      detected_pages: 10,
    });
    setNotification({
      id: `notif-${Date.now()}`,
      type: "SUCCESS",
      title: "Batch Packet Processed",
      message: `Successfully loaded 10 scanned pages from ${sampleName}. Deskewing and OCR classification complete.`,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleBigQuerySuccess = (jobId: string, resultDetails?: any) => {
    setBqSynced(true);
    const isLive = resultDetails?.mode === "LIVE_GCP";
    const targetDataset = resultDetails?.dataset || "primer_group_dms";
    addAuditLog("CREATE", "BUNDLE", bundle.bundle_id, {
      action: isLive ? "BIGQUERY_STREAM_INGEST" : "BIGQUERY_PREFLIGHT_VERIFY",
      job_id: jobId,
      mode: isLive ? "LIVE_GCP" : "SANDBOX_PREFLIGHT",
      table: `${targetDataset}.voucher_packets`,
    });

    setNotification({
      id: `bq-${Date.now()}`,
      type: "SUCCESS",
      isLive,
      badge: isLive ? "LIVE BIGQUERY" : "PREFLIGHT SANDBOX",
      title: isLive ? "Streamed to Live BigQuery" : "Preflight Schema Verified",
      message: isLive
        ? `Reconciled voucher packet [${bundle.je_voucher_no}] and ${documents.length} member documents committed to BigQuery dataset '${targetDataset}'.`
        : `Voucher packet [${bundle.je_voucher_no}] passed 100% of BigQuery schema checks and BIR RR 9-2009 WORM rules locally in sandbox mode.`,
      jobId,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const quarantinedCount = documents.filter((d) => d.status === "quarantined").length;

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* 1. LEFT-HAND SIDE NAVIGATION MENU */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => {
          if (v === "AUDIT") {
            setShowAuditModal(true);
          } else {
            setCurrentView(v);
          }
        }}
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
        availableUsers={DEFAULT_USERS}
        quarantinedCount={quarantinedCount}
        bundle={bundle}
        onOpenBigQueryModal={() => setShowBigQueryModal(true)}
        bqSynced={bqSynced}
      />

      {/* 2. MAIN TASK AREA ON THE RIGHT-HAND SIDE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Active Upload On-Process Loading Signal Banner */}
        {isProcessingUpload && (
          <div className="bg-indigo-600 text-white px-6 py-2.5 flex flex-wrap items-center justify-between shadow-md border-b border-indigo-700 flex-shrink-0">
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
                <Cpu className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
              <span className="uppercase tracking-wider font-bold">Document Upload On Process:</span>
              <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-indigo-100">
                {uploadedFileName || "Document Scan"}
              </span>
              <span className="text-indigo-200 hidden sm:inline">— {processingStage}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="w-32 bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(5, processingProgress)}%` }}
                ></div>
              </div>
              <span className="font-mono font-bold">{processingProgress}%</span>
            </div>
          </div>
        )}

        {/* Dynamic Page Carousel when in Review View and document has been uploaded */}
        {currentView === "REVIEW" && hasUploadedDocument && (
          <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center space-x-2 text-xs overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase flex-shrink-0 mr-1">
                Select Page:
              </span>
              {pages.map((p) => {
                const isSelected = p.page_no === selectedPageNo;
                const relatedDoc = documents.find(
                  (d) => p.page_no >= d.page_from && p.page_no <= d.page_to
                );
                const isQuarantined = relatedDoc?.status === "quarantined";

                // Human-friendly title for the carousel button
                const shortLabel = relatedDoc
                  ? relatedDoc.doc_type === "collection_receipt"
                    ? "Receipt #12813"
                    : relatedDoc.doc_type === "check_voucher"
                    ? "Voucher #000852"
                    : relatedDoc.doc_type === "gl_impact"
                    ? `GL Impact (${p.page_no - relatedDoc.page_from + 1}/3)`
                    : relatedDoc.doc_type === "sales_invoice"
                    ? "Invoice #0447"
                    : relatedDoc.doc_type === "purchase_order"
                    ? "PO #00000203"
                    : relatedDoc.doc_type === "me_request"
                    ? "ME Req #PR29345"
                    : relatedDoc.doc_type === "quotation"
                    ? "Quotation Canvass"
                    : relatedDoc.doc_type === "bir_2307"
                    ? "BIR 2307 Tax"
                    : relatedDoc.title || p.title
                  : p.title;

                return (
                  <button
                    key={p.page_id}
                    onClick={() => setSelectedPageNo(p.page_no)}
                    className={`px-3 py-1 rounded-lg border text-left flex-shrink-0 transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold"
                        : isQuarantined
                        ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-medium"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono">P.{p.page_no}</span>
                      <span className="truncate max-w-[140px] text-xs font-medium">{shortLabel}</span>
                      {p.crop_penalty && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Crop notice"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setHasUploadedDocument(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Upload or scan another batch"
              >
                <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                <span>Upload New Batch</span>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Main View Container */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {currentView === "DASHBOARD" && (
              <DashboardOverview
                bundle={bundle}
                documents={documents}
                pages={pages}
                currentUser={currentUser}
                quarantinedCount={quarantinedCount}
                bqSynced={bqSynced}
                onNavigateToView={(v) => setCurrentView(v)}
                onNavigateToPage={(pNo) => {
                  setHasUploadedDocument(true);
                  setSelectedPageNo(pNo);
                  setCurrentView("REVIEW");
                }}
                onOpenBigQueryModal={() => setShowBigQueryModal(true)}
              />
            )}

            {currentView === "REVIEW" && (
              !hasUploadedDocument ? (
                <DocumentReviewUploadPrompt
                  isProcessing={isProcessingUpload}
                  processingProgress={processingProgress}
                  processingStage={processingStage}
                  uploadedFileName={uploadedFileName}
                  onUploadFile={handleProcessPdfFile}
                  onSelectSampleScenario={handleSelectScenario}
                />
              ) : (
                <ReviewConsole
                  document={selectedDoc}
                  documents={documents}
                  page={selectedPage}
                  currentUser={currentUser}
                  totalPages={pages.length}
                  onUpdateDocument={handleUpdateDocument}
                  onSelectPage={(no) => setSelectedPageNo(no)}
                  onSelectDocument={(docId) => {
                    const targetDoc = documents.find((d) => d.document_id === docId);
                    if (targetDoc) {
                      setSelectedPageNo(targetDoc.page_from);
                    }
                  }}
                  onUploadFile={handleProcessPdfFile}
                  onOpenBigQueryModal={() => setShowBigQueryModal(true)}
                />
              )
            )}

            {currentView === "SEARCH" && (
              <SmartSearch
                pages={pages}
                documents={documents}
                lines={INITIAL_LINES}
                onNavigateToPage={(pNo) => {
                  setHasUploadedDocument(true);
                  setSelectedPageNo(pNo);
                  setCurrentView("REVIEW");
                }}
              />
            )}

            {currentView === "RECONCILIATION" && (
              <ReconciliationMatrix
                bundle={bundle}
                documents={documents}
                onNavigateToPage={(pNo) => {
                  setSelectedPageNo(pNo);
                  setCurrentView("REVIEW");
                }}
              />
            )}

            {currentView === "PHYSICAL" && (
              <PhysicalTrackingPanel
                folder={folder}
                custodyEvents={custodyEvents}
                currentUser={currentUser}
                onAddCustodyEvent={handleAddCustodyEvent}
              />
            )}
          </div>
        </main>
      </div>

      {/* 3. MODALS & TOAST NOTIFICATION */}
      <BigQueryIngestionModal
        isOpen={showBigQueryModal}
        onClose={() => setShowBigQueryModal(false)}
        bundle={bundle}
        documents={documents}
        onIngestSuccess={handleBigQuerySuccess}
      />

      <AuditTrailModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        auditLogs={auditLogs}
        onSimulateTamper={handleSimulateTamper}
        onRestoreChain={handleRestoreChain}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={handleUploadComplete}
        onUploadPdfFile={handleProcessPdfFile}
      />

      {/* Floating BigQuery Success Notification */}
      <ToastNotification
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}
