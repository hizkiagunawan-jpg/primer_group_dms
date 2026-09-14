import { Document, DocumentExtraction } from "../types/dms";

export interface ValidationIssue {
  field: string;
  rule: string;
  severity: "error" | "warning";
  message: string;
  expected?: string | number;
  actual?: string | number;
}

export function validateTIN(tin: string): boolean {
  if (!tin) return false;
  // Standard BIR TIN format: NNN-NNN-NNN-NNNNN or NNN-NNN-NNN-NNN
  const cleaned = tin.trim();
  const tinRegex = /^\d{3}-\d{3}-\d{3}(-\d{3,5})?$/;
  return tinRegex.test(cleaned);
}

export function validateVAT12(vatable: number, vat: number): { valid: boolean; expected: number; diff: number } {
  const expected = Math.round(vatable * 0.12 * 100) / 100;
  const diff = Math.abs(vat - expected);
  return {
    valid: diff <= 0.05, // 5 centavos rounding tolerance
    expected,
    diff,
  };
}

export function validateInvoiceTotal(
  vatable: number,
  vatExempt: number,
  zeroRated: number,
  vatAmount: number,
  total: number
): { valid: boolean; expected: number; diff: number } {
  const expected = Math.round((vatable + vatExempt + zeroRated + vatAmount) * 100) / 100;
  const diff = Math.abs(total - expected);
  return {
    valid: diff <= 0.05,
    expected,
    diff,
  };
}

export function validateGLBalance(debitTotal: number, creditTotal: number): { valid: boolean; diff: number } {
  const diff = Math.abs(debitTotal - creditTotal);
  return {
    valid: diff <= 0.01,
    diff,
  };
}

export function validateATC(code: string, base: number, withheld: number): { valid: boolean; rate: number; expected: number } {
  // BIR ATC code catalog
  const ATCRates: Record<string, number> = {
    WC158: 0.01, // 1% goods from top withholding agents
    WC160: 0.02, // 2% services from top withholding agents
    WI010: 0.05, // 5% professional fees
    WI100: 0.10, // 10% rentals
  };

  const rate = ATCRates[code] || 0.01;
  const expected = Math.round(base * rate * 100) / 100;
  const diff = Math.abs(withheld - expected);
  return {
    valid: diff <= 0.05,
    rate,
    expected,
  };
}

export function cleanNumericAmount(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (typeof val === "string") {
    let s = val.trim();
    // Support European comma decimal format e.g. "13482,54", "121,46", "13.482,54"
    if (/^-?\d{1,3}(\.\d{3})*,\d+$/.test(s) || /^-?\d+,\d{1,4}$/.test(s)) {
      s = s.replace(/\./g, "").replace(",", ".");
    }
    // Strip everything except digits, decimal point, and minus sign
    const cleaned = s.replace(/[^0-9.-]+/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function runFieldValidation(doc: Document): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ext = doc.extraction;

  // TIN checks
  if (ext.vendor_tin && !validateTIN(ext.vendor_tin)) {
    issues.push({
      field: "vendor_tin",
      rule: "BIR_TIN_FORMAT",
      severity: "warning",
      message: `Vendor TIN '${ext.vendor_tin}' does not conform strictly to BIR 9/12/14-digit format`,
      actual: ext.vendor_tin,
    });
  }

  // VAT checks for invoices
  if (doc.doc_type === "sales_invoice" && ext.vatable_amount > 0) {
    const vatRes = validateVAT12(ext.vatable_amount, ext.vat_amount);
    if (!vatRes.valid) {
      issues.push({
        field: "vat_amount",
        rule: "BIR_VAT_12_CALCULATION",
        severity: "error",
        message: `VAT amount ₱${ext.vat_amount.toFixed(2)} differs from expected 12% calculation ₱${vatRes.expected.toFixed(2)}`,
        expected: vatRes.expected,
        actual: ext.vat_amount,
      });
    }

    const totalRes = validateInvoiceTotal(ext.vatable_amount, 0, 0, ext.vat_amount, ext.gross_amount);
    if (!totalRes.valid) {
      issues.push({
        field: "gross_amount",
        rule: "INVOICE_TOTAL_SUM",
        severity: "error",
        message: `Total ₱${ext.gross_amount.toFixed(2)} does not match vatable + VAT (₱${totalRes.expected.toFixed(2)})`,
        expected: totalRes.expected,
        actual: ext.gross_amount,
      });
    }
  }

  // Line item roll-up
  if (doc.lines && doc.lines.length > 0 && (doc.doc_type === "sales_invoice" || doc.doc_type === "purchase_order")) {
    const lineTotal = doc.lines.reduce((sum, l) => sum + (l.payload.amount || 0), 0);
    const expected = doc.doc_type === "sales_invoice" ? ext.gross_amount : ext.gross_amount;
    if (Math.abs(lineTotal - expected) > 0.05) {
      issues.push({
        field: "lines",
        rule: "LINE_ITEM_ROLLUP",
        severity: "error",
        message: `Line items sum ₱${lineTotal.toFixed(2)} differs from document total ₱${expected.toFixed(2)}`,
        expected,
        actual: lineTotal,
      });
    }
  }

  // Mandatory fields
  if (!ext.document_number || ext.document_number.trim() === "") {
    issues.push({
      field: "document_number",
      rule: "MANDATORY_FIELD_MISSING",
      severity: "error",
      message: "Mandatory Document Number is missing or empty",
    });
  }

  return issues;
}
