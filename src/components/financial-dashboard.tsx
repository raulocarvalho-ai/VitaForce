import { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { FinancialData, MonthlyRow, SheetData } from "@/lib/financial-parser";
import { findRow, formatBRL, formatPct } from "@/lib/financial-parser";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const REVENUE = [
  /receita.*líquida/i,
  /receita.*liquida/i,
  /receita.*bruta/i,
  /^receita/i,
  /faturamento/i,
];
const COSTS = [/^custo.*total/i, /custo.*venda/i, /cmv/i, /^custo/i];
const EBITDA = [/ebitda/i];
const NET = [/lucro.*líquido/i, /lucro.*liquido/i, /resultado.*líquido/i, /resultado.*liquido/i];
const GROSS = [/lucro.*bruto/i, /margem.*contribuição/i, /margem.*contribuicao/i];

function pct(num: number, den: number): number {
  if (!den) return 0;
  return (num / den) * 100;
}

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  delta?: { value: number; label: string };
  icon: React.ElementType;
  accent?: "primary" | "success" | "destructive" | "warning";
}) {
  const accentClass = {
    primary: "text-accent bg-accent/10",
    success: "text-success bg-success/10",
    destructive: "text-destructive bg-destructive/10",
    warning: "text-warning bg-warning/10",
  }[accent ?? "primary"];

  return (
    <Card className="relative overflow-hidden p-6 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)]">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {delta && (
            <div className="flex items-center gap-1 pt-1 text-xs">
              {delta.value >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
              )}
              <span
                className={
                  delta.value >= 0 ? "font-semibold text-success" : "font-semibold text-destructive"
                }
              >
                {formatPct(delta.value)}
              </span>
              <span className="text-muted-foreground">{delta.label}</span>
            </div>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function SheetAnalysis({ sheet }: { sheet: SheetData }) {
  const receita = findRow(sheet, REVENUE);
  const custos = findRow(sheet, COSTS);
  const ebitda = findRow(sheet, EBITDA);
  const liquido = findRow(sheet, NET);
  const bruto = findRow(sheet, GROSS);

  const chartData = useMemo(() => {
    return sheet.months.map((m, i) => ({
      mes: m,
      Receita: receita?.values[i] ?? 0,
      Custos: Math.abs(custos?.values[i] ?? 0),
      EBITDA: ebitda?.values[i] ?? 0,
      Líquido: liquido?.values[i] ?? 0,
    }));
  }, [sheet, receita, custos, ebitda, liquido]);

  const totalReceita = receita?.total ?? 0;
  const totalCustos = Math.abs(custos?.total ?? 0);
  const totalEbitda = ebitda?.total ?? 0;
  const totalLiquido = liquido?.total ?? 0;
  const totalBruto = bruto?.total ?? totalReceita - totalCustos;

  // Best/worst month
  const monthsAnalysis = chartData.map((d) => ({ ...d, ResultadoMes: d.Líquido }));
  const bestMonth = [...monthsAnalysis].sort((a, b) => b.ResultadoMes - a.ResultadoMes)[0];
  const worstMonth = [...monthsAnalysis].sort((a, b) => a.ResultadoMes - b.ResultadoMes)[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Receita Total"
          value={formatBRL(totalReceita)}
          icon={DollarSign}
          accent="primary"
        />
        <KpiCard
          label="Custos Totais"
          value={formatBRL(totalCustos)}
          icon={TrendingDown}
          accent="destructive"
        />
        <KpiCard
          label="EBITDA"
          value={formatBRL(totalEbitda)}
          delta={{ value: pct(totalEbitda, totalReceita), label: "margem" }}
          icon={Activity}
          accent="success"
        />
        <KpiCard
          label="Lucro Líquido"
          value={formatBRL(totalLiquido)}
          delta={{ value: pct(totalLiquido, totalReceita), label: "margem" }}
          icon={Target}
          accent={totalLiquido >= 0 ? "success" : "destructive"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-1 text-base font-semibold">Receita × Custos × Resultado</h3>
          <p className="mb-4 text-xs text-muted-foreground">Evolução mensal — {sheet.name}</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: number) => formatBRL(v)}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Receita" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Custos" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="EBITDA" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="mb-1 text-base font-semibold">Destaques</h3>
          <p className="mb-4 text-xs text-muted-foreground">Análise automática</p>
          <div className="space-y-4">
            <div className="rounded-lg border border-success/20 bg-success/5 p-4">
              <p className="text-xs uppercase tracking-wider text-success">Melhor Mês</p>
              <p className="mt-1 text-lg font-bold">{bestMonth?.mes}</p>
              <p className="text-sm text-muted-foreground">
                {formatBRL(bestMonth?.ResultadoMes ?? 0)} líquido
              </p>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-xs uppercase tracking-wider text-destructive">Pior Mês</p>
              <p className="mt-1 text-lg font-bold">{worstMonth?.mes}</p>
              <p className="text-sm text-muted-foreground">
                {formatBRL(worstMonth?.ResultadoMes ?? 0)} líquido
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Margem Bruta</p>
              <p className="mt-1 text-lg font-bold">{formatPct(pct(totalBruto, totalReceita))}</p>
              <p className="text-sm text-muted-foreground">{formatBRL(totalBruto)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-1 text-base font-semibold">Tendência de EBITDA e Lucro Líquido</h3>
        <p className="mb-4 text-xs text-muted-foreground">Linha do tempo</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v: number) => formatBRL(v)}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="EBITDA"
              stroke="var(--chart-2)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="Líquido"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <DetailTable sheet={sheet} />
    </div>
  );
}

function DetailTable({ sheet }: { sheet: SheetData }) {
  const catColor: Record<MonthlyRow["category"], string> = {
    receita: "bg-chart-1/10 text-chart-1 border-chart-1/30",
    custo: "bg-destructive/10 text-destructive border-destructive/30",
    despesa: "bg-warning/15 text-warning-foreground border-warning/30",
    imposto: "bg-chart-5/10 text-chart-5 border-chart-5/30",
    resultado: "bg-success/10 text-success border-success/30",
    outro: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-6">
        <h3 className="text-base font-semibold">Detalhamento por linha — {sheet.name}</h3>
        <p className="text-xs text-muted-foreground">{sheet.rows.length} itens identificados</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-left font-semibold">
                Conta
              </th>
              <th className="px-2 py-3 text-left font-semibold">Tipo</th>
              {sheet.months.map((m) => (
                <th key={m} className="px-3 py-3 text-right font-semibold">
                  {m}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((r, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/30">
                <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium">{r.label}</td>
                <td className="px-2 py-2.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase ${catColor[r.category]}`}
                  >
                    {r.category}
                  </Badge>
                </td>
                {r.values.map((v, j) => (
                  <td key={j} className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {v === 0 ? "—" : formatBRL(v)}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                  {formatBRL(r.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ComparisonView({ sheets }: { sheets: SheetData[] }) {
  // Pair rows by similar labels across sheets
  const labels = useMemo(() => {
    const set = new Map<string, string>();
    for (const s of sheets) {
      for (const r of s.rows) {
        const key = r.label.toLowerCase().replace(/\s+/g, " ").trim();
        if (!set.has(key)) set.set(key, r.label);
      }
    }
    return Array.from(set.entries());
  }, [sheets]);

  function getTotal(sheet: SheetData, key: string): number {
    const r = sheet.rows.find((row) => row.label.toLowerCase().replace(/\s+/g, " ").trim() === key);
    return r?.total ?? 0;
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-6">
        <h3 className="text-base font-semibold">Comparativo entre planilhas</h3>
        <p className="text-xs text-muted-foreground">Totais anuais por conta</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Conta</th>
              {sheets.map((s) => (
                <th key={s.name} className="px-4 py-3 text-right font-semibold">
                  {s.name}
                </th>
              ))}
              {sheets.length >= 2 && (
                <th className="px-4 py-3 text-right font-semibold">
                  Δ {sheets[sheets.length - 1].name} vs {sheets[0].name}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {labels.map(([key, label]) => {
              const totals = sheets.map((s) => getTotal(s, key));
              const first = totals[0];
              const last = totals[totals.length - 1];
              const delta = first ? ((last - first) / Math.abs(first)) * 100 : 0;
              return (
                <tr key={key} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{label}</td>
                  {totals.map((t, i) => (
                    <td
                      key={i}
                      className="px-4 py-2.5 text-right tabular-nums text-muted-foreground"
                    >
                      {t === 0 ? "—" : formatBRL(t)}
                    </td>
                  ))}
                  {sheets.length >= 2 && (
                    <td
                      className={`px-4 py-2.5 text-right font-semibold tabular-nums ${delta >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {first === 0 && last === 0 ? "—" : formatPct(delta)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function FinancialDashboard({
  data,
  onReset,
}: {
  data: FinancialData;
  onReset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-hero)]">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">Análise Financeira</h1>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.fileName} · {data.sheets.length} planilhas
            </p>
          </div>
          <button
            onClick={onReset}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Carregar outro arquivo
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue={data.sheets[0]?.name} className="space-y-6">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted/60 p-1">
            {data.sheets.map((s) => (
              <TabsTrigger
                key={s.name}
                value={s.name}
                className="data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                {s.name}
              </TabsTrigger>
            ))}
            {data.sheets.length >= 2 && (
              <TabsTrigger
                value="__compare__"
                className="data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                Comparativo
              </TabsTrigger>
            )}
          </TabsList>

          {data.sheets.map((s) => (
            <TabsContent key={s.name} value={s.name} className="space-y-6">
              <SheetAnalysis sheet={s} />
            </TabsContent>
          ))}

          {data.sheets.length >= 2 && (
            <TabsContent value="__compare__">
              <ComparisonView sheets={data.sheets} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
