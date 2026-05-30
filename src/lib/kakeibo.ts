export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  memo: string;
  date: string;
};

export const EXPENSE_CATEGORIES = [
  "食費",
  "日用品",
  "住居",
  "交通",
  "光熱費",
  "通信",
  "衣服",
  "美容",
  "医療",
  "交際",
  "趣味",
  "その他",
] as const;

export const INCOME_CATEGORIES = [
  "給与",
  "副業",
  "賞与",
  "贈与",
  "その他",
] as const;

export const STORAGE_KEY = "yasashii-kakeibo:transactions:v1";

export function formatYen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${month}月${day}日 (${weekday})`;
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isSameMonth(iso: string, ref: Date = new Date()): boolean {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}
