import React, { useState, useMemo } from "react";
import { Document, Page, DocumentLine } from "../types/dms";
import {
  Search,
  FileText,
  Filter,
  ExternalLink,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Tag,
  Calendar,
  Download,
  Eye,
  BookOpen,
} from "lucide-react";
import { SmartSearchDocumentViewer } from "./SmartSearchDocumentViewer";
import { downloadPageAsPdf, downloadPageAsImage } from "../lib/pageDownloadHelper";

interface SmartSearchProps {
  pages: Page[];
  documents: Document[];
  lines: DocumentLine[];
  onNavigateToPage?: (pageNo: number) => void;
}

interface SearchMatch {
  doc: Document;
  page: Page;
  matchType: "OCR_CONTENT" | "EXTRACTED_FIELD" | "LINE_ITEM" | "AMOUNT";
  fieldLabel: string;
  snippet: string;
  relevanceScore: number;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  pages,
  documents,
  lines,
  onNavigateToPage,
}) => {
  const [query, setQuery] = useState("");
  const [selectedDocType, setSelectedDocType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);

  // Active document and page selected for viewing inside Smart Content Search
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedPageNo, setSelectedPageNo] = useState<number | null>(null);

  const activeDoc = useMemo(() => {
    if (selectedDocId) {
      return documents.find((d) => d.document_id === selectedDocId);
    }
    if (selectedPageNo !== null) {
      return (
        documents.find((d) => selectedPageNo >= d.page_from && selectedPageNo <= d.page_to) ||
        documents[0]
      );
    }
    return null;
  }, [selectedDocId, selectedPageNo, documents]);

  const activePage = useMemo(() => {
    if (selectedPageNo !== null) {
      return pages.find((p) => p.page_no === selectedPageNo) || pages[0];
    }
    if (activeDoc) {
      return pages.find((p) => p.page_no === activeDoc.page_from) || pages[0];
    }
    return null;
  }, [selectedPageNo, activeDoc, pages]);

  const suggestionChips = [
    { label: "Vendor: Polyprogress", text: "Polyprogress" },
    { label: "Invoice #0447", text: "0447" },
    { label: "Check #6615", text: "6615" },
    { label: "PO #PRC-00000203", text: "PRC-00000203" },
    { label: "ATC WC158 (1% Tax)", text: "WC158" },
    { label: "₱13,604.00 (Gross)", text: "13,604" },
    { label: "Corrugated Box", text: "Corrugated" },
    { label: "Metrobank", text: "Metrobank" },
  ];

  // Helper to extract a surrounding snippet with highlighting
  const getSnippet = (fullText: string, searchTerm: string): string => {
    if (!fullText || !searchTerm) return fullText?.slice(0, 140) || "";
    const lowerText = fullText.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);
    if (index === -1) return fullText.slice(0, 140) + "...";

    const start = Math.max(0, index - 40);
    const end = Math.min(fullText.length, index + searchTerm.length + 60);
    const prefix = start > 0 ? "..." : "";
    const suffix = end < fullText.length ? "..." : "";
    return prefix + fullText.slice(start, end) + suffix;
  };

  const highlightSnippet = (snippet: string, searchTerm: string) => {
    if (!searchTerm) return snippet;
    const parts = snippet.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-amber-950 font-bold px-1 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  // Perform content search across all pages and documents
  const searchResults: SearchMatch[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: SearchMatch[] = [];

    // 1. Search in Pages (OCR Text & OCR Tokens)
    pages.forEach((page) => {
      const pageDoc =
        documents.find((d) => page.page_no >= d.page_from && page.page_no <= d.page_to) || documents[0];

      // Match in raw OCR text
      if (page.ocr_text && page.ocr_text.toLowerCase().includes(q)) {
        matches.push({
          doc: pageDoc,
          page,
          matchType: "OCR_CONTENT",
          fieldLabel: "Raw Scanned Text (OCR)",
          snippet: getSnippet(page.ocr_text, q),
          relevanceScore: 85,
        });
      }
    });

    // 2. Search in Document Extracted Metadata
    documents.forEach((doc) => {
      const docPage = pages.find((p) => p.page_no === doc.page_from) || pages[0];
      const ext = doc.extraction;

      const checkField = (val: string | number | undefined, label: string) => {
        if (val !== undefined && val !== null) {
          const strVal = String(val).toLowerCase();
          if (strVal.includes(q)) {
            matches.push({
              doc,
              page: docPage,
              matchType: "EXTRACTED_FIELD",
              fieldLabel: label,
              snippet: `${label}: ${val}`,
              relevanceScore: 95,
            });
          }
        }
      };

      checkField(ext.vendor_name, "Vendor Name");
      checkField(ext.vendor_tin, "Vendor TIN");
      checkField(ext.buyer_name, "Buyer Name");
      checkField(ext.document_number, "Document Number");
      checkField(ext.invoice_number, "Invoice Number");
      checkField(ext.po_number, "PO Number");
      checkField(ext.check_no, "Check Number");
      checkField(ext.gross_amount, "Gross Amount");
      checkField(ext.net_amount, "Net Amount");
      checkField(ext.atc_code, "ATC Tax Code");
    });

    // 3. Search in Line Items
    lines.forEach((line) => {
      const parentDoc = documents.find((d) => d.document_id === line.document_id);
      if (!parentDoc) return;
      const docPage = pages.find((p) => p.page_no === parentDoc.page_from) || pages[0];

      const p = line.payload;
      const lineText = `${p.description || ""} ${p.item_code || ""} ${p.account_name || ""} ${p.memo || ""}`.toLowerCase();

      if (lineText.includes(q)) {
        matches.push({
          doc: parentDoc,
          page: docPage,
          matchType: "LINE_ITEM",
          fieldLabel: `Line Item #${line.line_no}`,
          snippet: `${p.description || p.account_name || "Line item"} (₱${p.amount?.toLocaleString()})`,
          relevanceScore: 90,
        });
      }
    });

    // Apply filters
    return matches.filter((item) => {
      if (selectedDocType !== "ALL" && item.doc.doc_type !== selectedDocType) {
        return false;
      }
      if (selectedStatus !== "ALL" && item.doc.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [query, pages, documents, lines, selectedDocType, selectedStatus]);

  // Query Gemini AI when user searches
  React.useEffect(() => {
    if (!query || query.trim().length < 2) {
      setAiSummary(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAiSearching(true);
      try {
        const resp = await fetch("/api/ai/smart-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim(), documents, pages }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.result?.summary) {
            setAiSummary(data.result.summary);
          } else {
            setAiSummary(`Document store analysis: Found ${searchResults.length} matching entries for "${query}".`);
          }
        }
      } catch (e) {
        console.warn("AI search error:", e);
      } finally {
        setIsAiSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, documents, pages, searchResults.length]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Search Input Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            AI Document Smart Search
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Search Anywhere in Scanned Documents
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Find text inside scanned invoices, purchase orders, BIR 2307, receipts, check numbers, line items, and amounts across all 10 pages in the packet.
          </p>

          {/* Search bar input */}
          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by vendor name, invoice #, amount (e.g. 13604), check #, item, or TIN..."
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-3.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] font-medium mr-1">Quick Search:</span>
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(chip.text)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  query === chip.text
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span className="font-semibold">Filter Document Type:</span>
            </div>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All Documents (9)</option>
              <option value="collection_receipt">Collection Receipt #12813</option>
              <option value="check_voucher">Check Voucher #VENDPYMTPRC-000852</option>
              <option value="gl_impact">GL Impact Ledgers (Bill & Payment)</option>
              <option value="sales_invoice">Charge Sales Invoice #0447</option>
              <option value="purchase_order">Purchase Order #PO-PRC-00000203</option>
              <option value="me_request">ME Request #29345 (Regular Supplies)</option>
              <option value="quotation">Vendor Quotation (Awarded Highlighting)</option>
              <option value="bir_2307">BIR Form 2307 (Tax Certificate)</option>
            </select>

            <div className="flex items-center gap-1.5 text-slate-500 ml-2">
              <span className="font-semibold">Status:</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="quarantined">Needs Review (Quarantined)</option>
            </select>
          </div>

          <div className="text-slate-500 font-medium text-[11px]">
            {query.trim() ? (
              <span>Found <strong>{searchResults.length}</strong> matching references</span>
            ) : (
              <span>Index: 10 Pages • 1,420 OCR Tokens • 12 Line Items</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. INLINE DOCUMENT VIEWER (STAYS WITHIN SMART CONTENT SEARCH) */}
      {activeDoc && activePage && (
        <div id="smart-search-doc-viewer" className="scroll-mt-4">
          <SmartSearchDocumentViewer
            document={activeDoc}
            page={activePage}
            allPages={pages}
            searchQuery={query}
            onClose={() => {
              setSelectedDocId(null);
              setSelectedPageNo(null);
            }}
            onSelectPage={(pageNo) => {
              setSelectedPageNo(pageNo);
              const parentDoc = documents.find((d) => pageNo >= d.page_from && pageNo <= d.page_to);
              if (parentDoc) setSelectedDocId(parentDoc.document_id);
            }}
            onOpenInBatchReview={
              onNavigateToPage
                ? () => {
                    onNavigateToPage(activePage.page_no);
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* 3. Search Results List */}
      {query.trim() ? (
        <div className="space-y-4">
          {/* Gemini AI Smart Answer */}
          {(aiSummary || isAiSearching) && (
            <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 shadow-xs flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Sparkles className={`w-4 h-4 ${isAiSearching ? "animate-spin" : ""}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-indigo-950">
                    Gemini AI Document Analysis
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                    Cloud Storage Bucket
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {isAiSearching ? "Analyzing scanned documents across Cloud Storage..." : aiSummary}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
            <span>Search Matches for &ldquo;{query}&rdquo;</span>
            <span className="text-slate-500">{searchResults.length} references found</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No matching text found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No occurrences of &ldquo;{query}&rdquo; were found in the OCR transcripts, line items, or metadata. Try searching for &ldquo;Polyprogress&rdquo;, &ldquo;13604&rdquo;, &ldquo;6615&rdquo;, or &ldquo;WC158&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {searchResults.map((match, idx) => {
                const isSelected = activePage?.page_no === match.page.page_no;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDocId(match.doc.document_id);
                      setSelectedPageNo(match.page.page_no);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`bg-white border rounded-xl p-4 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 ring-2 ring-indigo-100"
                        : "border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs">
                          {match.page.title || match.doc.title}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 capitalize">
                          {match.doc.doc_type.replace("_", " ")}
                        </span>
                        {match.doc.status === "quarantined" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Crop Notice
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        )}
                      </div>

                      {/* Matched Snippet */}
                      <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono leading-relaxed">
                        {highlightSnippet(match.snippet, query)}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Source: <strong className="text-slate-700">{match.fieldLabel}</strong></span>
                        {match.doc.extraction.gross_amount > 0 && (
                          <span>Gross: <strong className="text-slate-800">₱{match.doc.extraction.gross_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong></span>
                        )}
                      </div>
                    </div>

                    {/* View Document in Smart Search & Download Per Page Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDocId(match.doc.document_id);
                          setSelectedPageNo(match.page.page_no);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        title="View document inside Smart Content Search"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Document</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPageAsPdf(match.page, match.doc);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                        title={`Download ${match.page.title || match.doc.title} as PDF`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 4. Document Catalog & Scanned Archives (Click any to view inside Smart Content Search) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Scanned Voucher Packet Documents ({documents.length} Records • 10 Pages)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Click any document to view and download per page right here
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((doc) => {
              const docPages = pages.filter(
                (p) => p.page_no >= doc.page_from && p.page_no <= doc.page_to
              );
              const firstPage = docPages[0] || pages[0];
              const isSelected = activeDoc?.document_id === doc.document_id;

              return (
                <div
                  key={doc.document_id}
                  onClick={() => {
                    setSelectedDocId(doc.document_id);
                    setSelectedPageNo(doc.page_from);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`bg-white border rounded-xl p-4 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-3 cursor-pointer group ${
                    isSelected
                      ? "border-indigo-600 ring-2 ring-indigo-100"
                      : "border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px] truncate max-w-[220px]" title={doc.title}>
                        {doc.title || doc.doc_type.replace("_", " ").toUpperCase()}
                      </span>
                      {doc.status === "quarantined" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Review
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Approved
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
                      {doc.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2 font-mono">
                      {firstPage?.ocr_text?.slice(0, 110) || "Scanned document record"}...
                    </p>

                    {doc.extraction.gross_amount > 0 && (
                      <div className="text-[11px] text-slate-700 font-medium pt-1">
                        Gross: <strong className="text-slate-900">₱{doc.extraction.gross_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong>
                      </div>
                    )}
                  </div>

                  {/* Document Card Footer with Per-Page Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 flex-wrap">
                      {docPages.map((dp) => (
                        <button
                          key={dp.page_id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocId(doc.document_id);
                            setSelectedPageNo(dp.page_no);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors truncate max-w-[150px] ${
                            activePage?.page_no === dp.page_no
                              ? "bg-indigo-600 text-white font-bold"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                          title={dp.title}
                        >
                          {dp.title}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDocId(doc.document_id);
                          setSelectedPageNo(doc.page_from);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPageAsPdf(firstPage, doc);
                        }}
                        className="p-1 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                        title={`Download ${firstPage.title || doc.title} PDF`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="font-bold text-slate-800 block">Vendor & Tax Info</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Search supplier names, BIR TINs, address keywords, or branch codes.
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="font-bold text-slate-800 block">Voucher & Check Numbers</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Find checks, invoice serials, PO numbers, and receiving receipts.
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="font-bold text-slate-800 block">Per-Page Download</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Export each scanned page individually in PDF, high-res PNG, or JSON format.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
