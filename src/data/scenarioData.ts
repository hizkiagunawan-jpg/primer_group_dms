import { Document, Page, DocumentLine } from "../types/dms";
import { INITIAL_DOCUMENTS, INITIAL_PAGES } from "./samplePacket";

export interface ScenarioResult {
  pages: Page[];
  documents: Document[];
  fileName: string;
  summaryTitle: string;
  summaryMessage: string;
  targetBqTable: string;
  targetGcsFolder: string;
  scenarioNumber: 1 | 2;
}

/**
 * Scenario 1: Model classifies the uploaded document as a full batch packet
 * containing all accounting voucher packet document types across multiple pages.
 * Loads to respective BigQuery tables and Cloud Storage folders per document type.
 */
export function getScenario1BatchPacket(): ScenarioResult {
  return {
    pages: INITIAL_PAGES,
    documents: INITIAL_DOCUMENTS,
    fileName: "PRC_Batch_Voucher_Packet_10Pages.pdf",
    summaryTitle: "Scenario 1: Multi-Document Batch Voucher Packet",
    summaryMessage:
      "The AI model analyzed all 10 pages and identified 8 distinct document types (Check Voucher, GL Impact, Sales Invoice, Purchase Order, ME Request, Quotation, BIR 2307, Collection Receipt). Each document is structured with its own extraction fields and mapped to its respective BigQuery table and Cloud Storage folder.",
    targetBqTable: "Multiple Tables (Dynamic Per Document Type)",
    targetGcsFolder: "Multiple Folders (gs://primer-group/<doc_type>/)",
    scenarioNumber: 1,
  };
}

/**
 * Scenario 2: Model auto-detects that the upload is a SINGLE document type
 * Example A: Purchase Order spanning 2 pages (PO items + Terms & Authorizations)
 */
export function getScenario2PurchaseOrder(): ScenarioResult {
  const poLines: DocumentLine[] = [
    {
      line_id: "line-po-sc2-01",
      document_id: "doc-po-sc2",
      line_no: 1,
      line_ref: "PO-PRC-00203-01",
      payload: {
        item_code: "CUTTER-BIG",
        description: "Ordinary Heavy Duty Cutter Big",
        quantity: 72,
        unit: "PC",
        unit_price: 20.0,
        amount: 1440.0,
      },
    },
    {
      line_id: "line-po-sc2-02",
      document_id: "doc-po-sc2",
      line_no: 2,
      line_ref: "PO-PRC-00203-02",
      payload: {
        item_code: "MARKER-PILOT",
        description: "Pilot Permanent Marker Fine Black",
        quantity: 144,
        unit: "PC",
        unit_price: 31.0,
        amount: 4464.0,
      },
    },
    {
      line_id: "line-po-sc2-03",
      document_id: "doc-po-sc2",
      line_no: 3,
      line_ref: "PO-PRC-00203-03",
      payload: {
        item_code: "STAPLER-35",
        description: "Max Heavy Duty Stapler #35",
        quantity: 10,
        unit: "PC",
        unit_price: 370.0,
        amount: 3700.0,
      },
    },
    {
      line_id: "line-po-sc2-04",
      document_id: "doc-po-sc2",
      line_no: 4,
      line_ref: "PO-PRC-00203-04",
      payload: {
        item_code: "FOLDER-USPB",
        description: "US Pressboard Expanding Folder Legal",
        quantity: 200,
        unit: "PC",
        unit_price: 20.0,
        amount: 4000.0,
      },
    },
  ];

  const doc: Document = {
    document_id: "doc-po-sc2",
    batch_id: "batch-sc2-po-2025",
    doc_type: "purchase_order",
    title: "Purchase Order #PRC-00000203 (2 Pages)",
    page_from: 1,
    page_to: 2,
    classification_confidence: 0.99,
    classification_reasoning:
      "Identified as single document type: 2-page Purchase Order with itemized procurement table on Page 1 and delivery/payment covenants on Page 2.",
    lines: poLines,
    extraction_model: "gemini-2.5-flash",
    extraction_prompt_version: "2.5.0-po-procurement",
    composite_confidence: 0.98,
    status: "in_review",
    quarantine_reasons: [],
    archive_gcs_uri: "gs://primer-group/purchase_orders/Purchase_Order_PRC-00000203.pdf",
    archive_sha256: "8e71c6d3bc8527a0d4c827b5871fa28469cf20a2e3794a32ff52c0029b9f83a4",
    archive_pdfa_conformance: "PDF/A-2b",
    bundle_id: "bundle-sc2-po-001",
    system_doc_no: "DOC-PRC-PO-00000203",
    target_bq_table: "primer_group_dms.purchase_orders",
    target_gcs_folder: "gs://primer-group/purchase_orders/",
    created_at: new Date().toISOString(),
    extraction: {
      document_number: "PRC-00000203",
      document_date: "2025-05-19",
      vendor_name: "Polyprogress Business Corporation",
      vendor_tin: "238-470-166-00000",
      buyer_name: "Primer Resources Corp. R.O.H.Q.-Phils.",
      buyer_tin: "250-822-648-00000",
      currency: "PHP",
      gross_amount: 13604.0,
      vatable_amount: 12146.43,
      vat_amount: 1457.57,
      ewt_amount: 121.46,
      net_amount: 13482.54,
      po_number: "PRC-00000203",
      delivery_terms: "7 Calendar Days (FOB Manila)",
      payment_terms: "30 Days Net Upon Complete Delivery & Inspection",
      signatures: [
        { role: "Prepared By", printed_name: "Ireland Garrido", has_signature: true },
        { role: "Approved By", printed_name: "Mariean Laxamana", has_signature: true },
      ],
      field_confidences: {
        document_number: 0.99,
        document_date: 0.99,
        vendor_name: 0.98,
        gross_amount: 0.99,
        po_number: 0.99,
      },
      target_bq_table: "primer_group_dms.purchase_orders",
      target_gcs_folder: "gs://primer-group/purchase_orders/",
    },
  };

  const pages: Page[] = [
    {
      page_id: "pg-sc2-po-1",
      batch_id: "batch-sc2-po-2025",
      page_no: 1,
      work_gcs_uri: "gs://primer-group/purchase_orders/po_page_1.png",
      thumb_gcs_uri: "gs://primer-group/purchase_orders/thumb_1.png",
      rotation_applied: 0,
      deskew_deg: 0.0,
      ink_coverage: 18.2,
      is_blank: false,
      quality_score: 0.98,
      crop_penalty: false,
      source_doc_type: "purchase_order",
      title: "Purchase Order #PRC-00000203 (Page 1 of 2)",
      enhancement_applied: {
        deskewed: true,
        despeckled: true,
        clahe_contrast: false,
        rotation_corrected: false,
      },
      ocr_text:
        "Primer Resources Corp. R.O.H.Q.-Phils. PURCHASE ORDER PO-PRC-00000203 PO Date: 05/19/2025 External Ref: PR#29345 Vendor: POLYPROGRESS BUSINESS CORPORATION Total Purchases: 13,604.00 Cutter Big 72 pcs 20.00 1,440.00 Pen Pentel 144 pcs 31.00 4,464.00 Stapler #50 10 pcs 370.00 3,700.00 Folder Expanding 200 pcs 20.00 4,000.00 Prepared: Ireland Garrido Noted: Mariean Laxamana Approved: Mariean Laxamana",
      ocr_tokens: [
        { text: "PO-PRC-00000203", bbox: [90, 770, 125, 955], confidence: 0.99 },
        { text: "05/19/2025", bbox: [190, 460, 215, 545], confidence: 0.99 },
        { text: "13,604.00", bbox: [720, 890, 750, 960], confidence: 0.99 },
      ],
    },
    {
      page_id: "pg-sc2-po-2",
      batch_id: "batch-sc2-po-2025",
      page_no: 2,
      work_gcs_uri: "gs://primer-group/purchase_orders/po_page_2.png",
      thumb_gcs_uri: "gs://primer-group/purchase_orders/thumb_2.png",
      rotation_applied: 0,
      deskew_deg: 0.0,
      ink_coverage: 15.4,
      is_blank: false,
      quality_score: 0.97,
      crop_penalty: false,
      source_doc_type: "purchase_order",
      title: "Purchase Order Terms & Conditions (Page 2 of 2)",
      enhancement_applied: {
        deskewed: true,
        despeckled: true,
        clahe_contrast: false,
        rotation_corrected: false,
      },
      ocr_text:
        "PURCHASE ORDER GENERAL CONDITIONS Delivery Terms: 7 Calendar Days upon receipt of PO. Payment Terms: 30 Days Net upon receipt and acceptance of original Sales Invoice and Delivery Receipt. Inspection and Quality Assurance: All office items subject to Primer Property & Procurement acceptance standards. Authorized by: Mariean Laxamana, Senior Procurement Director.",
      ocr_tokens: [
        { text: "Delivery Terms: 7 Calendar Days", bbox: [120, 100, 150, 400], confidence: 0.98 },
        { text: "Payment Terms: 30 Days Net", bbox: [160, 100, 190, 380], confidence: 0.98 },
        { text: "Authorized by: Mariean Laxamana", bbox: [500, 100, 540, 450], confidence: 0.97 },
      ],
    },
  ];

  return {
    pages,
    documents: [doc],
    fileName: "Purchase_Order_PRC-00000203_2Pages.pdf",
    summaryTitle: "Scenario 2: Single Document Type (Purchase Order - 2 Pages)",
    summaryMessage:
      "The AI model identified this document as a single 2-page Purchase Order (#PRC-00000203). Both pages are indexed together into a single PO entity. You can modify extracted fields and execute loading exclusively to BigQuery table primer_group_dms.purchase_orders and Cloud Storage folder gs://primer-group/purchase_orders/.",
    targetBqTable: "primer_group_dms.purchase_orders",
    targetGcsFolder: "gs://primer-group/purchase_orders/",
    scenarioNumber: 2,
  };
}

/**
 * Scenario 2: Model auto-detects a multi-page GL Impact Journal (3 pages)
 */
export function getScenario2GlImpact(): ScenarioResult {
  const glLines: DocumentLine[] = [
    {
      line_id: "line-gl-sc2-01",
      document_id: "doc-gl-sc2",
      line_no: 1,
      line_ref: "GL-POST-01",
      payload: {
        account_code: "50203990",
        account_name: "Computer Supplies & Toner Consumables",
        debit: 12146.43,
        credit: 0.0,
        amount: 12146.43,
      },
    },
    {
      line_id: "line-gl-sc2-02",
      document_id: "doc-gl-sc2",
      line_no: 2,
      line_ref: "GL-POST-02",
      payload: {
        account_code: "10104010",
        account_name: "Input Tax (12% Value Added Tax)",
        debit: 1457.57,
        credit: 0.0,
        amount: 1457.57,
      },
    },
    {
      line_id: "line-gl-sc2-03",
      document_id: "doc-gl-sc2",
      line_no: 3,
      line_ref: "GL-POST-03",
      payload: {
        account_code: "20201010",
        account_name: "Withholding Tax Payable (EWT 1%)",
        debit: 0.0,
        credit: 121.46,
        amount: 121.46,
      },
    },
    {
      line_id: "line-gl-sc2-04",
      document_id: "doc-gl-sc2",
      line_no: 4,
      line_ref: "GL-POST-04",
      payload: {
        account_code: "10102020",
        account_name: "Cash in Bank - LBP Operating Account",
        debit: 0.0,
        credit: 13482.54,
        amount: 13482.54,
      },
    },
  ];

  const doc: Document = {
    document_id: "doc-gl-sc2",
    batch_id: "batch-sc2-gl-2025",
    doc_type: "gl_impact",
    title: "General Ledger Impact Posting (3 Pages)",
    page_from: 1,
    page_to: 3,
    classification_confidence: 0.99,
    classification_reasoning:
      "Classified as multi-page General Ledger Impact ledger (Pages 1 to 3). Debit/Credit totals strictly balanced at ₱13,604.00.",
    lines: glLines,
    extraction_model: "gemini-2.5-flash",
    extraction_prompt_version: "2.5.0-gl-ledger",
    composite_confidence: 0.99,
    status: "in_review",
    quarantine_reasons: [],
    archive_gcs_uri: "gs://primer-group/gl_impacts/GL_Impact_Ledger_Posting.pdf",
    archive_sha256: "7fa28469cf20a2e3794a32ff52c0029b9f83a48e71c6d3bc8527a0d4c827b587",
    archive_pdfa_conformance: "PDF/A-2b",
    bundle_id: "bundle-sc2-gl-001",
    system_doc_no: "DOC-PRC-GL-000852",
    target_bq_table: "primer_group_dms.gl_impacts",
    target_gcs_folder: "gs://primer-group/gl_impacts/",
    created_at: new Date().toISOString(),
    extraction: {
      document_number: "GL-JE-2025-060042",
      document_date: "2025-06-05",
      vendor_name: "Polyprogress Business Corporation",
      vendor_tin: "238-470-166-00000",
      buyer_name: "Primer Resources Corp. R.O.H.Q.-Phils.",
      buyer_tin: "250-822-648-00000",
      currency: "PHP",
      gross_amount: 13604.0,
      vatable_amount: 12146.43,
      vat_amount: 1457.57,
      ewt_amount: 121.46,
      net_amount: 13482.54,
      total_debit: 13604.0,
      total_credit: 13604.0,
      is_balanced: true,
      target_bq_table: "primer_group_dms.gl_impacts",
      target_gcs_folder: "gs://primer-group/gl_impacts/",
    },
  };

  const pages: Page[] = [
    {
      page_id: "pg-sc2-gl-1",
      batch_id: "batch-sc2-gl-2025",
      page_no: 1,
      work_gcs_uri: "gs://primer-group/gl_impacts/gl_page_1.png",
      thumb_gcs_uri: "gs://primer-group/gl_impacts/thumb_1.png",
      rotation_applied: 0,
      deskew_deg: 0.0,
      ink_coverage: 14.5,
      is_blank: false,
      quality_score: 0.98,
      crop_penalty: false,
      source_doc_type: "gl_impact",
      title: "GL Impact Ledger - Summary Header (Page 1 of 3)",
      enhancement_applied: { deskewed: true, despeckled: true, clahe_contrast: false, rotation_corrected: false },
      ocr_text: "GL Impact Posting Primer Resources Corp Date 06/05/2025 Posting Period Jun 2025 Total Debit 13,604.00 Total Credit 13,604.00 Page 1 of 3",
      ocr_tokens: [{ text: "GL Impact", bbox: [45, 760, 80, 890], confidence: 0.99 }],
    },
    {
      page_id: "pg-sc2-gl-2",
      batch_id: "batch-sc2-gl-2025",
      page_no: 2,
      work_gcs_uri: "gs://primer-group/gl_impacts/gl_page_2.png",
      thumb_gcs_uri: "gs://primer-group/gl_impacts/thumb_2.png",
      rotation_applied: 0,
      deskew_deg: 0.0,
      ink_coverage: 16.2,
      is_blank: false,
      quality_score: 0.98,
      crop_penalty: false,
      source_doc_type: "gl_impact",
      title: "GL Impact Ledger - Debit Accounts (Page 2 of 3)",
      enhancement_applied: { deskewed: true, despeckled: true, clahe_contrast: false, rotation_corrected: false },
      ocr_text: "Account 50203990 Supplies Debit 12,146.43 Account 10104010 Input VAT Debit 1,457.57 Page 2 of 3",
      ocr_tokens: [{ text: "12,146.43", bbox: [700, 500, 735, 550], confidence: 0.99 }],
    },
    {
      page_id: "pg-sc2-gl-3",
      batch_id: "batch-sc2-gl-2025",
      page_no: 3,
      work_gcs_uri: "gs://primer-group/gl_impacts/gl_page_3.png",
      thumb_gcs_uri: "gs://primer-group/gl_impacts/thumb_3.png",
      rotation_applied: 0,
      deskew_deg: 0.0,
      ink_coverage: 15.0,
      is_blank: false,
      quality_score: 0.98,
      crop_penalty: false,
      source_doc_type: "gl_impact",
      title: "GL Impact Ledger - Credit Accounts (Page 3 of 3)",
      enhancement_applied: { deskewed: true, despeckled: true, clahe_contrast: false, rotation_corrected: false },
      ocr_text: "Account 20201010 EWT Payable Credit 121.46 Account 10102020 Cash LBP Credit 13,482.54 Net Balanced Page 3 of 3",
      ocr_tokens: [{ text: "13,482.54", bbox: [700, 595, 735, 650], confidence: 0.99 }],
    },
  ];

  return {
    pages,
    documents: [doc],
    fileName: "GL_Impact_Posting_3Pages.pdf",
    summaryTitle: "Scenario 2: Single Document Type (GL Impact Ledger - 3 Pages)",
    summaryMessage:
      "The AI model identified this document as a single 3-page General Ledger Impact ledger. Debits and credits are balanced (Δ ₱0.00). Ready for review and execution to BigQuery table primer_group_dms.gl_impacts.",
    targetBqTable: "primer_group_dms.gl_impacts",
    targetGcsFolder: "gs://primer-group/gl_impacts/",
    scenarioNumber: 2,
  };
}

/**
 * Scenario 2: Model auto-detects a single Sales Invoice
 */
export function getScenario2SalesInvoice(): ScenarioResult {
  const siLines: DocumentLine[] = [
    {
      line_id: "line-si-sc2-01",
      document_id: "doc-si-sc2",
      line_no: 1,
      line_ref: "SI-0447-01",
      payload: {
        description: "Office Consumables, Cutter, Markers, Staplers, Folders",
        quantity: 426,
        unit_price: 28.51,
        amount: 12146.43,
      },
    },
  ];

  const doc: Document = {
    document_id: "doc-si-sc2",
    batch_id: "batch-sc2-si-2025",
    doc_type: "sales_invoice",
    title: "Charge Sales Invoice #0447 (1 Page)",
    page_from: 1,
    page_to: 1,
    classification_confidence: 0.99,
    classification_reasoning:
      "Classified as single document type: Official Charge Sales Invoice #0447 issued by Polyprogress Business Corp.",
    lines: siLines,
    extraction_model: "gemini-2.5-flash",
    extraction_prompt_version: "2.5.0-si-invoice",
    composite_confidence: 0.99,
    status: "in_review",
    quarantine_reasons: [],
    archive_gcs_uri: "gs://primer-group/sales_invoices/Sales_Invoice_0447.pdf",
    archive_sha256: "9f83a48e71c6d3bc8527a0d4c827b5871fa28469cf20a2e3794a32ff52c0029b",
    archive_pdfa_conformance: "PDF/A-2b",
    bundle_id: "bundle-sc2-si-001",
    system_doc_no: "DOC-PRC-SI-000447",
    target_bq_table: "primer_group_dms.sales_invoices",
    target_gcs_folder: "gs://primer-group/sales_invoices/",
    created_at: new Date().toISOString(),
    extraction: {
      document_number: "0447",
      document_date: "2025-05-20",
      vendor_name: "Polyprogress Business Corporation",
      vendor_tin: "238-470-166-00000",
      vendor_address: "552 E.T. Yuchengco St. Binondo, Manila",
      buyer_name: "Primer Resources Corp. (R.O.H.Q.-Phils.)",
      buyer_tin: "250-822-648-00000",
      sold_to: "PRIMER RESOURCES CORP. (R.O.H.Q.-PHILS.)",
      buyer_address: "Manila HQ - ROHQ, Manila, Philippines",
      business_style: "Retail & Distribution",
      customer_code: "CUST-PRC-ROHQ",
      currency: "PHP",
      gross_amount: 13604.0,
      vatable_amount: 12146.43,
      vat_amount: 1457.57,
      ewt_amount: 121.46,
      net_amount: 13482.54,
      invoice_number: "0447",
      po_number: "PRC-00000203",
      target_bq_table: "primer_group_dms.sales_invoices",
      target_gcs_folder: "gs://primer-group/sales_invoices/",
    },
  };

  const pages: Page[] = [
    {
      page_id: "pg-sc2-si-1",
      batch_id: "batch-sc2-si-2025",
      page_no: 1,
      work_gcs_uri: "gs://primer-group/sales_invoices/si_page_1.png",
      thumb_gcs_uri: "gs://primer-group/sales_invoices/thumb_1.png",
      rotation_applied: 0,
      deskew_deg: -0.1,
      ink_coverage: 19.4,
      is_blank: false,
      quality_score: 0.97,
      crop_penalty: false,
      source_doc_type: "sales_invoice",
      title: "Charge Sales Invoice #0447",
      enhancement_applied: { deskewed: true, despeckled: true, clahe_contrast: false, rotation_corrected: false },
      ocr_text:
        "Polyprogress Business Corporation CHARGE SALES INVOICE No 0447 Date 05/20/2025 Sold To PRIMER RESOURCES CORP. TIN 250-822-648-000 PO No: PRC-00000203 Total Amount Due 13,604.00",
      ocr_tokens: [
        { text: "CHARGE SALES INVOICE", bbox: [85, 50, 125, 270], confidence: 0.99 },
        { text: "0447", bbox: [100, 860, 135, 930], confidence: 0.99 },
        { text: "13,604.00", bbox: [780, 785, 815, 855], confidence: 0.99 },
      ],
    },
  ];

  return {
    pages,
    documents: [doc],
    fileName: "Sales_Invoice_SI-0447.pdf",
    summaryTitle: "Scenario 2: Single Document Type (Sales Invoice #0447)",
    summaryMessage:
      "The AI model identified this document as a single Sales Invoice (#0447). Review tax and customer details, then execute load directly to primer_group_dms.sales_invoices.",
    targetBqTable: "primer_group_dms.sales_invoices",
    targetGcsFolder: "gs://primer-group/sales_invoices/",
    scenarioNumber: 2,
  };
}
