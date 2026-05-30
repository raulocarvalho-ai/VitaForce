import * as XLSX from "xlsx";

export type MonthlyRow = {
  label: string;
  category: "receita" | "custo" | "despesa" | "resultado" | "imposto" | "outro";
  values: number[]; // 12 months
  total: number;
};

export type SheetData = {
  name: string;
  months: string[]; // up to 12 labels
  rows: MonthlyRow[];
};

export type FinancialData = {
  fileName: string;
  sheets: SheetData[];
};

const MONTH_PATTERNS = [
  /^jan/i,
  /^fev/i,
  /^mar/i,
  /^abr/i,
  /^mai/i,
  /^jun/i,
  /^jul/i,
  /^ago/i,
  /^set/i,
  /^out/i,
  /^nov/i,
  /^dez/i,
];

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function isMonthCell(v: unknown): number {
  if (v == null) return -1;
  const s = String(v).trim();
  for (let i = 0; i < MONTH_PATTERNS.length; i++) {
    if (MONTH_PATTERNS[i].test(s)) return i;
  }
  return -1;
}

function categorize(label: string): MonthlyRow["category"] {
  const s = label.toLowerCase();
  if (
    /(receita|faturamento|vendas|bruta|líquida|liquida)/.test(s) &&
    !/custo|despesa|deduç/.test(s)
  )
    return "receita";
  if (/(imposto|tribut|deduç|icms|pis|cofins|iss|irpj|csll)/.test(s)) return "imposto";
  if (/(custo|cmv|cpv|cps)/.test(s)) return "custo";
  if (/(despesa|gasto|operacional|administrativ|comercia|pessoal|aluguel|marketing)/.test(s))
    return "despesa";
  if (/(ebitda|lucro|resultado|margem|líquido|liquido|bruto|contribuição|contribuicao)/.test(s))
    return "resultado";
  return "outro";
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null) return 0;
  const s = String(v)
    .trim()
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function parseSheet(name: string, aoa: unknown[][]): SheetData | null {
  // Find header row with month names
  let headerRowIdx = -1;
  let monthCols: { col: number; idx: number }[] = [];

  for (let r = 0; r < Math.min(aoa.length, 30); r++) {
    const row = aoa[r] || [];
    const found: { col: number; idx: number }[] = [];
    for (let c = 0; c < row.length; c++) {
      const m = isMonthCell(row[c]);
      if (m >= 0) found.push({ col: c, idx: m });
    }
    if (found.length >= 3) {
      headerRowIdx = r;
      monthCols = found;
      break;
    }
  }

  if (headerRowIdx === -1) return null;

  // Dedup month indices (keep first occurrence)
  const seen = new Set<number>();
  monthCols = monthCols.filter((m) => (seen.has(m.idx) ? false : (seen.add(m.idx), true)));
  monthCols.sort((a, b) => a.idx - b.idx);

  const months = monthCols.map((m) => MONTH_LABELS[m.idx]);

  // Find label column = first non-month cell column before first month col
  const firstMonthCol = monthCols[0].col;
  const labelCol = Math.max(0, firstMonthCol - 1);

  const rows: MonthlyRow[] = [];
  for (let r = headerRowIdx + 1; r < aoa.length; r++) {
    const row = aoa[r] || [];
    const label = row[labelCol];
    if (!label) continue;
    const labelStr = String(label).trim();
    if (!labelStr || /^total$/i.test(labelStr)) continue;

    const values = monthCols.map((m) => toNumber(row[m.col]));
    const hasAny = values.some((v) => v !== 0);
    if (!hasAny) continue;

    const total = values.reduce((a, b) => a + b, 0);
    rows.push({
      label: labelStr,
      category: categorize(labelStr),
      values,
      total,
    });
  }

  return { name, months, rows };
}

export async function parseFinancialFile(file: File): Promise<FinancialData> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheets: SheetData[] = [];

  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: true,
      defval: null,
    }) as unknown[][];
    const parsed = parseSheet(name, aoa);
    if (parsed && parsed.rows.length > 0) sheets.push(parsed);
  }

  return { fileName: file.name, sheets };
}

// Helpers
export function findRow(sheet: SheetData, patterns: RegExp[]): MonthlyRow | undefined {
  for (const p of patterns) {
    const r = sheet.rows.find((row) => p.test(row.label));
    if (r) return r;
  }
  return undefined;
}

export function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}
