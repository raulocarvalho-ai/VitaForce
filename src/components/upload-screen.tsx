import { useCallback, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  Sparkles,
  BarChart3,
  GitCompare,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { parseFinancialFile, type FinancialData } from "@/lib/financial-parser";

export function UploadScreen({ onLoaded }: { onLoaded: (data: FinancialData) => void }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      try {
        const data = await parseFinancialFile(file);
        if (data.sheets.length === 0) {
          setError(
            "Não consegui identificar dados financeiros mensais nesse arquivo. Verifique se a planilha tem colunas de meses (Jan, Fev, ...).",
          );
          return;
        }
        onLoaded(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao processar o arquivo.");
      } finally {
        setLoading(false);
      }
    },
    [onLoaded],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, var(--primary-glow), transparent 40%), radial-gradient(circle at 80% 30%, var(--accent), transparent 40%)",
          }}
        />
        <div className="mx-auto max-w-5xl px-6 pt-20 pb-12 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Análise automática de DRE
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Sua planilha financeira,
            <span className="block bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
              transformada em insights.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Faça upload da sua DRE em Excel e receba KPIs executivos, gráficos comparativos e
            análise mês a mês — sem fórmulas, sem configuração.
          </p>
        </div>
      </div>

      {/* Upload card */}
      <div className="mx-auto max-w-3xl px-6 pb-12">
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card p-12 text-center transition-all ${
            dragging
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/60 hover:bg-accent/[0.02]"
          }`}
          style={{ boxShadow: dragging ? "var(--shadow-elegant)" : undefined }}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.xlsm,.csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            disabled={loading}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[image:var(--gradient-hero)] shadow-[var(--shadow-elegant)]">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
            ) : (
              <Upload className="h-8 w-8 text-primary-foreground" />
            )}
          </div>
          <h2 className="mt-6 text-xl font-semibold text-foreground">
            {loading ? "Analisando sua planilha..." : "Arraste seu arquivo aqui"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            ou <span className="font-medium text-accent">clique para selecionar</span> · .xlsx,
            .xls, .csv
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Funciona com a planilha Laborsil 2026, DRE padrão e fluxo de caixa</span>
          </div>
        </label>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: BarChart3,
              title: "KPIs Executivos",
              desc: "Receita, EBITDA, margem e lucro líquido com variações",
            },
            {
              icon: GitCompare,
              title: "Comparativos",
              desc: "Realizado × Projetado × Ano anterior lado a lado",
            },
            {
              icon: ShieldCheck,
              title: "100% Privado",
              desc: "Tudo processado no seu navegador. Nada enviado.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
