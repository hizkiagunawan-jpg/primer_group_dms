export type DocType =
  | "collection_receipt"
  | "check_voucher"
  | "sales_invoice"
  | "purchase_order"
  | "me_request"
  | "quotation"
  | "delivery_receipt"
  | "bir_2307"
  | "gl_impact"
  | "budget_drawdown"
  | "unknown";

export type BatchStatus =
  | "uploaded"
  | "preprocessing"
  | "classified"
  | "extracted"
  | "in_review"
  | "committed"
  | "rejected";

export type DocumentStatus =
  | "extracted"
  | "quarantined"
  | "in_review"
  | "approved"
  | "committed"
  | "rejected"
  | "rescan";

export type QuarantineReason =
  | "low_confidence"
  | "missing_field"
  | "duplicate"
  | "reconciliation_failed"
  | "illegible"
  | "boundary_uncertain"
  | "crop_penalty";

export type BundleReconciliationStatus =
  | "balanced"
  | "imbalanced"
  | "incomplete"
  | "not_applicable";

export type BundleCompletenessStatus = "complete" | "missing_types";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "VIEW"
  | "DOWNLOAD"
  | "EXPORT"
  | "EDIT"
  | "APPROVE"
  | "CHECKOUT"
  | "CHECKIN"
  | "LOGIN"
  | "RBAC_CHANGE"
  | "OVERRIDE"
  | "RESCAN"
  | "COMMIT"
  | "DELETE_ATTEMPT";

export type UserRoleType =
  | "senior_manager"
  | "junior_accountant"
  | "tax_officer"
  | "physical_custodian"
  | "accounting_clerk"
  | "system_auditor";

export interface OCRToken {
  text: string;
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0..1000
  confidence: number;
}

export interface Page {
  page_id: string;
  batch_id: string;
  page_no: number;
  work_gcs_uri: string;
  thumb_gcs_uri: string;
  image_url?: string; // Real rendered scanned page canvas/image URL
  rotation_applied: number; // 0, 90, 180, 270
  deskew_deg: number;
  ink_coverage: number;
  is_blank: boolean;
  quality_score: number; // 0..1
  crop_penalty: boolean;
  ocr_text: string;
  ocr_tokens: OCRToken[];
  source_doc_type?: DocType;
  title: string;
  enhancement_applied: {
    deskewed: boolean;
    despeckled: boolean;
    clahe_contrast: boolean;
    rotation_corrected: boolean;
  };
}

export interface Batch {
  batch_id: string;
  batch_ref: string; // e.g. "PRC-2025-06-0042"
  scanned_by: string;
  scanned_at: string;
  declared_page_count: number;
  detected_page_count: number;
  source_filename: string;
  source_sha256: string;
  source_gcs_uri: string;
  status: BatchStatus;
  tote_ref: string;
  created_at: string;
}

export interface StampData {
  type: "RECEIVED" | "POSTED" | "PROCESSED" | "PAID";
  date: string;
  signatory: string;
  department: string;
}

export interface SignatureData {
  role: string;
  printed_name: string;
  has_signature: boolean;
  date?: string;
}

export interface DocumentLine {
  line_id: string;
  document_id: string;
  line_no: number;
  line_ref: string; // System-generated e.g. "DOC-PRC-0042-L001"
  payload: {
    item_code?: string;
    description?: string;
    quantity?: number;
    unit?: string;
    unit_price?: number;
    amount: number;
    // ERP / GL Accounting entities
    subsidiary?: string;
    account?: string;
    account_code?: string;
    account_name?: string;
    debit?: number;
    credit?: number;
    transaction_currency?: string;
    base_currency_debit?: number;
    base_currency_credit?: number;
    transaction_debit?: number;
    transaction_credit?: number;
    memo?: string;
    location?: string;
    department?: string;
    class_name?: string;
    store?: string;
    brand?: string;
    is_awarded?: boolean; // For quotation highlighting
    bidder_name?: string;
    tax_rate?: number;
    tax_amount?: number;
  };
}

export interface DocumentExtraction {
  document_number: string;
  document_date: string;
  vendor_name: string;
  vendor_tin: string;
  buyer_name: string;
  buyer_tin: string;
  currency: string;
  gross_amount: number;
  vatable_amount: number;
  vat_amount: number;
  ewt_amount: number;
  net_amount: number;
  check_no?: string;
  po_number?: string;
  invoice_number?: string;
  pr_number?: string;
  atc_code?: string;
  posting_period?: string;
  // Specific ERP entities
  subsidiary?: string;
  location?: string;
  memo?: string;
  transaction_type?: string;
  department?: string;
  store?: string;
  brand?: string;
  // Sales Invoice / Billing Entities
  sold_to?: string;
  business_style?: string;
  buyer_address?: string;
  vendor_address?: string;
  customer_code?: string;
  terms?: string;
  osca_pwd_id?: string;
  card_holder?: string;
  tin_signature?: string;
  signature?: string;
  date?: string;
  // Procurement / Approvals
  requestor_name?: string;
  approver_name?: string;
  purpose?: string;
  delivery_terms?: string;
  payment_terms?: string;
  total_debit?: number;
  total_credit?: number;
  transaction_currency?: string;
  base_currency_total_debit?: number;
  base_currency_total_credit?: number;
  base_currency_debit?: number;
  base_currency_credit?: number;
  awarded_amount?: number;
  is_balanced?: boolean;
  awarded_vendor?: string;
  rfq_ref?: string;
  bank_name?: string;
  bank_branch?: string;
  payee_name?: string;
  received_from?: string;
  sub_document_title?: string;
  target_bq_table?: string;
  target_gcs_folder?: string;
  stamps?: StampData[];
  signatures?: SignatureData[];
  low_confidence_fields?: string[];
  field_confidences?: Record<string, number>;
  source_boxes?: Record<string, [number, number, number, number]>;
}

export interface Document {
  document_id: string;
  batch_id: string;
  doc_type: DocType;
  title?: string;
  page_from: number;
  page_to: number;
  classification_confidence: number;
  classification_reasoning: string;
  extraction: DocumentExtraction;
  extraction_model: string;
  extraction_prompt_version: string;
  composite_confidence: number;
  status: DocumentStatus;
  quarantine_reasons: QuarantineReason[];
  archive_gcs_uri: string;
  archive_sha256: string;
  archive_pdfa_conformance: string;
  bundle_id: string | null;
  system_doc_no: string; // Mandatory system assigned doc no
  created_at: string;
  committed_at?: string;
  lines: DocumentLine[];
  target_bq_table?: string;
  target_gcs_folder?: string;
}

export interface Bundle {
  bundle_id: string;
  je_voucher_no: string;
  check_no: string;
  transaction_type: "Bill" | "Bill Payment" | "Journal" | "Procurement";
  posting_period: string;
  sbu: string;
  subsidiary: string;
  location: string;
  vendor_name: string;
  vendor_tin: string;
  gross_amount: number;
  vatable_amount: number;
  vat_amount: number;
  ewt_amount: number;
  net_amount: number;
  currency: string;
  po_number: string;
  invoice_number: string;
  pr_number: string;
  reconciliation_status: BundleReconciliationStatus;
  completeness_status: BundleCompletenessStatus;
  folder_no: string;
  created_at: string;
  documents?: Document[];
}

export interface ReconciliationRuleResult {
  id: number;
  bundle_id: string;
  rule_id: string; // R1 to R15
  rule_name: string;
  doc_sources: string[];
  severity: "info" | "warning" | "error";
  passed: boolean;
  expected: string;
  actual: string;
  delta: number;
  message: string;
  evaluated_at: string;
  source_page_a?: number;
  source_page_b?: number;
}

export interface FieldRevision {
  id: number;
  document_id: string;
  field_path: string;
  old_value: string;
  new_value: string;
  reason_code: string;
  note: string;
  changed_by: string;
  changed_by_name: string;
  changed_at: string;
  approved_by: string | null;
  approved_by_name?: string | null;
  approved_at: string | null;
  status: "pending_checker" | "approved" | "rejected";
}

export interface AuditLogEntry {
  seq: number;
  actor_id: string;
  actor_email: string;
  actor_role: UserRoleType;
  action: AuditAction;
  object_type: "BATCH" | "DOCUMENT" | "BUNDLE" | "FOLDER" | "USER_ROLE" | "EXPORT";
  object_id: string;
  detail: Record<string, any>;
  ip: string;
  user_agent: string;
  at: string;
  prev_hash: string;
  row_hash: string;
}

export interface PhysicalLocation {
  location_id: string;
  aisle: string;
  rack: string;
  shelf: string;
  box_no: string;
  label: string;
}

export interface Folder {
  folder_no: string;
  location_id: string | null;
  location?: PhysicalLocation;
  bundle_id: string | null;
  assigned_by: string;
  assigned_at: string;
  current_custodian: string;
  status: "in_vault" | "requested" | "checked_out" | "overdue";
  expected_return_date?: string;
  last_requester_name?: string;
  barcode: string;
}

export interface CustodyEvent {
  id: number;
  folder_no: string;
  event_type: "REQUEST" | "CHECKOUT" | "CHECKIN" | "OVERDUE";
  requester_id: string;
  requester_name: string;
  custodian_id: string;
  custodian_name: string;
  expected_return?: string;
  actual_return?: string;
  integrity_note: string; // Custodian inspection result
  at: string;
}

export interface AppUser {
  user_id: string;
  email: string;
  display_name: string;
  role_id: UserRoleType;
  department: string;
  max_amount_threshold: number; // e.g. 50000 for junior, Infinity for manager
  can_approve_changes: boolean; // Maker/Checker
  mfa_enrolled: boolean;
}

export interface RBACChangeLog {
  id: number;
  changed_by: string;
  user_affected: string;
  before: Record<string, any>;
  after: Record<string, any>;
  reason: string;
  at: string;
}
