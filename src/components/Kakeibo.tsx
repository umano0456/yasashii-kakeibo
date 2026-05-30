"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  STORAGE_KEY,
  formatDate,
  formatYen,
  isSameMonth,
  todayIso,
  type Transaction,
  type TransactionType,
} from "@/lib/kakeibo";

type Draft = {
  type: TransactionType;
  amount: string;
  category: string;
  memo: string;
  date: string;
};

const initialDraft = (): Draft => ({
  type: "expense",
  amount: "",
  category: EXPENSE_CATEGORIES[0],
  memo: "",
  date: "",
});

function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is Transaction =>
        typeof t === "object" &&
        t !== null &&
        typeof (t as Transaction).id === "string" &&
        ((t as Transaction).type === "income" ||
          (t as Transaction).type === "expense") &&
        typeof (t as Transaction).amount === "number" &&
        typeof (t as Transaction).category === "string" &&
        typeof (t as Transaction).memo === "string" &&
        typeof (t as Transaction).date === "string",
    );
  } catch {
    return [];
  }
}

export default function Kakeibo() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTransactions(loadTransactions());
    setDraft((d) => (d.date ? d : { ...d, date: todayIso() }));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions, hydrated]);

  const categories =
    draft.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (next: TransactionType) => {
    setDraft((d) => ({
      ...d,
      type: next,
      category:
        next === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0],
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const entry: Transaction = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: draft.type,
      amount: Math.round(amount),
      category: draft.category,
      memo: draft.memo.trim(),
      date: draft.date || todayIso(),
    };
    setTransactions((prev) => [entry, ...prev]);
    setDraft((d) => ({
      ...initialDraft(),
      type: d.type,
      category: d.category,
      date: d.date || todayIso(),
    }));
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const now = new Date();
  const monthIncome = transactions
    .filter((t) => t.type === "income" && isSameMonth(t.date, now))
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = transactions
    .filter((t) => t.type === "expense" && isSameMonth(t.date, now))
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = transactions.reduce(
    (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
    0,
  );

  const grouped = groupByDate(transactions);

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <Summary
        balance={balance}
        monthIncome={monthIncome}
        monthExpense={monthExpense}
      />

      <section aria-labelledby="add-heading" className="flex flex-col gap-5">
        <SectionHeading id="add-heading">記録する</SectionHeading>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 border-y border-line py-7 sm:py-8"
        >
          <div className="inline-flex self-start rounded-full border border-line bg-paper p-1 text-sm">
            <ToggleButton
              active={draft.type === "expense"}
              onClick={() => handleTypeChange("expense")}
            >
              支出
            </ToggleButton>
            <ToggleButton
              active={draft.type === "income"}
              onClick={() => handleTypeChange("income")}
            >
              収入
            </ToggleButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-4">
            <Field label="金額">
              <div className="flex items-baseline gap-2">
                <span className="text-ink-muted text-lg">¥</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  placeholder="0"
                  required
                  value={draft.amount}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, amount: e.target.value }))
                  }
                  className="w-full bg-transparent text-2xl font-serif tracking-wide outline-none placeholder:text-ink-muted/60"
                />
              </div>
            </Field>
            <Field label="日付">
              <input
                type="date"
                value={draft.date}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, date: e.target.value }))
                }
                className="w-full bg-transparent text-base outline-none"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-4">
            <Field label="カテゴリ">
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, category: e.target.value }))
                }
                className="w-full bg-transparent text-base outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="メモ">
              <input
                type="text"
                placeholder="任意"
                maxLength={60}
                value={draft.memo}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, memo: e.target.value }))
                }
                className="w-full bg-transparent text-base outline-none placeholder:text-ink-muted/60"
              />
            </Field>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="rounded-full border border-ink bg-ink px-6 py-2.5 text-sm font-medium text-background transition hover:opacity-85 disabled:opacity-50"
              disabled={!draft.amount}
            >
              書き留める
            </button>
          </div>
        </form>
      </section>

      <section aria-labelledby="list-heading" className="flex flex-col gap-6">
        <SectionHeading id="list-heading">記録</SectionHeading>
        {!hydrated ? (
          <p className="text-ink-muted text-sm">読み込み中…</p>
        ) : grouped.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-10">
            {grouped.map(([date, items]) => (
              <li key={date} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between border-b border-line-soft pb-2">
                  <h3 className="font-serif text-base text-ink-soft">
                    {formatDate(date)}
                  </h3>
                  <span className="font-serif text-sm text-ink-muted tabular-nums">
                    {formatYen(
                      items.reduce(
                        (s, t) =>
                          s + (t.type === "income" ? t.amount : -t.amount),
                        0,
                      ),
                    )}
                  </span>
                </div>
                <ul className="flex flex-col">
                  {items.map((t) => (
                    <li
                      key={t.id}
                      className="group flex items-baseline gap-4 py-2.5 border-b border-line-soft last:border-b-0"
                    >
                      <span className="text-sm text-ink-soft min-w-[5rem]">
                        {t.category}
                      </span>
                      <span className="flex-1 text-sm text-ink-muted truncate">
                        {t.memo || "—"}
                      </span>
                      <span
                        className="font-serif text-base tabular-nums"
                        style={{
                          color:
                            t.type === "income"
                              ? "var(--color-income)"
                              : "var(--color-expense)",
                        }}
                      >
                        {t.type === "income" ? "+" : "−"}
                        {formatYen(t.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        aria-label="削除"
                        className="ml-1 text-ink-muted/60 opacity-0 transition group-hover:opacity-100 focus:opacity-100 hover:text-expense"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Summary({
  balance,
  monthIncome,
  monthExpense,
}: {
  balance: number;
  monthIncome: number;
  monthExpense: number;
}) {
  return (
    <section
      aria-label="サマリー"
      className="flex flex-col gap-6 rounded-lg border border-line bg-paper px-6 py-8 sm:px-10 sm:py-10"
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-xs tracking-[0.2em] text-ink-muted">
          BALANCE
        </span>
        <span className="font-serif text-4xl sm:text-5xl tabular-nums">
          {formatYen(balance)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-line-soft">
        <SummaryStat
          label="今月の収入"
          value={formatYen(monthIncome)}
          tone="income"
        />
        <SummaryStat
          label="今月の支出"
          value={formatYen(monthExpense)}
          tone="expense"
        />
      </div>
    </section>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense";
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-ink-muted">{label}</span>
      <span
        className="font-serif text-xl sm:text-2xl tabular-nums"
        style={{
          color:
            tone === "income" ? "var(--color-income)" : "var(--color-expense)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs tracking-wider text-ink-muted">{label}</span>
      <div className="border-b border-line py-1.5 focus-within:border-ink transition-colors">
        {children}
      </div>
    </label>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-5 py-1.5 transition " +
        (active
          ? "bg-ink text-background"
          : "text-ink-soft hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

function SectionHeading({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="font-serif text-lg sm:text-xl text-ink-soft tracking-wide"
    >
      {children}
    </h2>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-ink-muted">
      <p className="font-serif text-base text-ink-soft">
        まだ記録はありません。
      </p>
      <p className="text-sm">
        今日のお金の動きを、そっと書き留めてみましょう。
      </p>
    </div>
  );
}

function groupByDate(items: Transaction[]): [string, Transaction[]][] {
  const map = new Map<string, Transaction[]>();
  for (const t of items) {
    const list = map.get(t.date);
    if (list) list.push(t);
    else map.set(t.date, [t]);
  }
  return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
}
