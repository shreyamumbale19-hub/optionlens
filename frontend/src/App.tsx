import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Download,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";

type OptionType = "CALL" | "PUT";
type PositionSide = "LONG" | "SHORT";
type Page = "Overview" | "Strategy Builder" | "Risk Analysis" | "History" | "Reports" | "Settings";

type Leg = {
  id: number;
  type: OptionType;
  side: PositionSide;
  strike: number;
  premium: number;
  quantity: number;
  multiplier: number;
};

type AnalysisRecord = {
  id: string;
  createdAt: string;
  underlying: number;
  pnl: number;
  legCount: number;
  legs: Leg[];
};

const navigation: { label: Page; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Strategy Builder", icon: SlidersHorizontal },
  { label: "Risk Analysis", icon: ChartNoAxesCombined },
  { label: "History", icon: Clock3 },
  { label: "Reports", icon: FileBarChart },
];

const initialLeg: Leg = {
  id: 1,
  type: "CALL",
  side: "LONG",
  strike: 100,
  premium: 10,
  quantity: 1,
  multiplier: 1,
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const compactMoney = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${value.toFixed(0)}`;
};

function legPnl(leg: Leg, price: number) {
  const intrinsic =
    leg.type === "CALL"
      ? Math.max(price - leg.strike, 0)
      : Math.max(leg.strike - price, 0);

  const unitPnl =
    leg.side === "LONG" ? intrinsic - leg.premium : leg.premium - intrinsic;

  return unitPnl * leg.quantity * leg.multiplier;
}

function strategyPnl(legs: Leg[], price: number) {
  return legs.reduce((total, leg) => total + legPnl(leg, price), 0);
}

function App() {
  const [page, setPage] = useState<Page>("Overview");
  const [legs, setLegs] = useState<Leg[]>([initialLeg]);
  const [underlyingPrice, setUnderlyingPrice] = useState(125);
  const [nextId, setNextId] = useState(2);
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [displayName, setDisplayName] = useState("Developer");
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("optionlens-history");
      if (saved) setRecords(JSON.parse(saved) as AnalysisRecord[]);
      const savedName = localStorage.getItem("optionlens-display-name");
      if (savedName) setDisplayName(savedName);
      const savedRisk = localStorage.getItem("optionlens-risk-acknowledged");
      if (savedRisk === "true") setRiskAcknowledged(true);
    } catch {
      setNotice("Saved preferences could not be loaded.");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("optionlens-history", JSON.stringify(records));
    } catch {
      setNotice("Browser storage is unavailable. Your history may not persist.");
    }
  }, [records]);

  const totalPnl = useMemo(
    () => strategyPnl(legs, underlyingPrice),
    [legs, underlyingPrice],
  );

  const totalPremium = useMemo(
    () =>
      legs.reduce(
        (sum, leg) => sum + leg.premium * leg.quantity * leg.multiplier,
        0,
      ),
    [legs],
  );

  const chartData = useMemo(() => {
    const strikes = legs.map((leg) => leg.strike);
    const low = Math.max(0, Math.min(...strikes, underlyingPrice) * 0.65);
    const high = Math.max(...strikes, underlyingPrice, 1) * 1.35;
    const points = Array.from({ length: 41 }, (_, index) => {
      const price = low + ((high - low) * index) / 40;
      return {
        price: Math.round(price * 100) / 100,
        pnl: Math.round(strategyPnl(legs, price) * 100) / 100,
      };
    });
    return points;
  }, [legs, underlyingPrice]);

  const perLegResults = legs.map((leg) => ({
    ...leg,
    pnl: legPnl(leg, underlyingPrice),
  }));

  const positiveScenarios = chartData.filter((point) => point.pnl > 0);
  const negativeScenarios = chartData.filter((point) => point.pnl < 0);
  const bestVisible = positiveScenarios.length
    ? Math.max(...positiveScenarios.map((point) => point.pnl))
    : 0;
  const worstVisible = negativeScenarios.length
    ? Math.min(...negativeScenarios.map((point) => point.pnl))
    : 0;

  function updateLeg(id: number, changes: Partial<Leg>) {
    setLegs((current) =>
      current.map((leg) => (leg.id === id ? { ...leg, ...changes } : leg)),
    );
  }

  function addLeg() {
    setLegs((current) => [
      ...current,
      { ...initialLeg, id: nextId, strike: underlyingPrice },
    ]);
    setNextId((current) => current + 1);
    setNotice("");
  }

  function removeLeg(id: number) {
    if (legs.length === 1) {
      setNotice("A strategy must contain at least one option leg.");
      return;
    }
    setLegs((current) => current.filter((leg) => leg.id !== id));
  }

  function validateStrategy() {
    if (!Number.isFinite(underlyingPrice) || underlyingPrice < 0) {
      setNotice("Underlying price must be zero or greater.");
      return false;
    }
    for (const leg of legs) {
      if (
        !Number.isFinite(leg.strike) ||
        leg.strike <= 0 ||
        !Number.isFinite(leg.premium) ||
        leg.premium < 0 ||
        !Number.isInteger(leg.quantity) ||
        leg.quantity <= 0 ||
        !Number.isFinite(leg.multiplier) ||
        leg.multiplier <= 0
      ) {
        setNotice("Check each leg: strike and multiplier must be positive, premium non-negative, and quantity a positive whole number.");
        return false;
      }
    }
    return true;
  }

  function calculateAndSave() {
    if (!validateStrategy()) return;
    const result: AnalysisRecord = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      underlying: underlyingPrice,
      pnl: strategyPnl(legs, underlyingPrice),
      legCount: legs.length,
      legs: legs.map((leg) => ({ ...leg })),
    };
    setRecords((current) => [result, ...current].slice(0, 100));
 
    setNotice("Scenario calculated and saved to local history.");
  }

  function exportCsv() {
    const rows = [
      ["OptionLens scenario report"],
      ["Generated at", new Date().toLocaleString()],
      ["Underlying price at expiration", underlyingPrice],
      ["Total profit/loss", totalPnl],
      [],
      ["Type", "Side", "Strike", "Premium", "Quantity", "Multiplier", "P&L"],
      ...perLegResults.map((leg) => [
        leg.type,
        leg.side,
        leg.strike,
        leg.premium,
        leg.quantity,
        leg.multiplier,
        leg.pnl,
      ]),
      [],
      ["Disclaimer", "Illustrative expiration payoff only; not investment advice."],
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `optionlens-report-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("CSV report exported.");
  }

  function clearHistory() {
    setRecords([]);
    setNotice("Local analysis history cleared.");
  }

  function changePage(nextPage: Page) {
    setPage(nextPage);
    setMobileNavOpen(false);
    setNotice("");
  }

  const filteredRecords = records.filter((record) =>
    `${record.id} ${record.underlying} ${record.legCount}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="app-shell">
      {mobileNavOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <ChartNoAxesCombined size={23} strokeWidth={2.2} />
          </div>
          <div>
            <div className="brand-name">option<span>lens</span></div>
            <div className="brand-caption">RISK INTELLIGENCE</div>
          </div>
          <button className="icon-button sidebar-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${page === label ? "active" : ""}`}
              onClick={() => changePage(label)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "History" && records.length > 0 && (
                <span className="nav-count">{records.length}</span>
              )}
              {page === label && <span className="active-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="workspace-label">PREFERENCES</div>
          <button
            className={`nav-item ${page === "Settings" ? "active" : ""}`}
            onClick={() => changePage("Settings")}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <div className="sidebar-help">
            <div className="help-icon"><CircleHelp size={19} /></div>
            <div>
              <strong>Need a hand?</strong>
              <span>Explore your risk metrics</span>
              <button onClick={() => changePage("Risk Analysis")}>Explore analysis <ArrowUpRight size={13} /></button>
            </div>
          </div>
          <div className="profile-row">
            <div className="avatar">{displayName.trim().charAt(0).toUpperCase() || "D"}</div>
            <div className="profile-copy">
              <strong>{displayName || "Developer"}</strong>
              <span>Personal workspace</span>
            </div>
            <button className="icon-button" aria-label="Open settings" onClick={() => changePage("Settings")}>
              <ChevronDown size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="system-status"><span /> Local calculations active</div>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice("No new notifications.")}>
              <Bell size={18} />
              <i />
            </button>
            <div className="top-avatar">{displayName.trim().charAt(0).toUpperCase() || "D"}</div>
          </div>
        </header>

        <div className="page-content">
          {notice && (
            <div className="notice-banner" role="status">
              <Check size={16} />
              <span>{notice}</span>
              <button aria-label="Dismiss message" onClick={() => setNotice("")}><X size={15} /></button>
            </div>
          )}

          {page === "Overview" && (
            <OverviewPage
              displayName={displayName}
              legs={legs}
              underlyingPrice={underlyingPrice}
              totalPnl={totalPnl}
              totalPremium={totalPremium}
              chartData={chartData}
              records={records}
              onPageChange={changePage}
              onCalculate={calculateAndSave}
              onExport={exportCsv}
              onSetUnderlying={setUnderlyingPrice}
              onAddLeg={addLeg}
            />
          )}

          {page === "Strategy Builder" && (
            <StrategyPage
              legs={legs}
              underlyingPrice={underlyingPrice}
              totalPnl={totalPnl}
              totalPremium={totalPremium}
              onUpdateLeg={updateLeg}
              onRemoveLeg={removeLeg}
              onAddLeg={addLeg}
              onSetUnderlying={setUnderlyingPrice}
              onCalculate={calculateAndSave}
              onExport={exportCsv}
            />
          )}

          {page === "Risk Analysis" && (
            <AnalysisPage
              legs={legs}
              underlyingPrice={underlyingPrice}
              totalPnl={totalPnl}
              perLegResults={perLegResults}
              chartData={chartData}
              bestVisible={bestVisible}
              worstVisible={worstVisible}
              onPageChange={changePage}
              onCalculate={calculateAndSave}
              onSetUnderlying={setUnderlyingPrice}
            />
          )}

          {page === "History" && (
            <HistoryPage
              records={filteredRecords}
              search={search}
              onSearch={setSearch}
              onClear={clearHistory}
              onExport={exportCsv}
              onLoad={(record) => {
                setLegs(record.legs.map((leg) => ({ ...leg })));
                setUnderlyingPrice(record.underlying);
                setPage("Strategy Builder");
                setNotice("Previous scenario loaded into the strategy builder.");
              }}
            />
          )}

          {page === "Reports" && (
            <ReportsPage records={records} totalPnl={totalPnl} onExport={exportCsv} onPageChange={changePage} />
          )}

          {page === "Settings" && (
            <SettingsPage
              displayName={displayName}
              onSaveName={(name) => {
                setDisplayName(name.trim() || "Developer");
                localStorage.setItem("optionlens-display-name", name.trim() || "Developer");
                setNotice("Profile preferences saved.");
              }}
              riskAcknowledged={riskAcknowledged}
              onRiskChange={(checked) => {
                setRiskAcknowledged(checked);
                localStorage.setItem("optionlens-risk-acknowledged", String(checked));
                setNotice("Risk disclaimer preference updated.");
              }}
              onClearHistory={clearHistory}
            />
          )}

          <footer className="app-footer">
            <span>© {new Date().getFullYear()} OptionLens</span>
            <span><ShieldCheck size={13} /> Built for risk awareness, not trade recommendations</span>
            <span>Frontend preview · Local mode</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}

function PnlValue({ value, large = false }: { value: number; large?: boolean }) {
  return (
    <span className={`${value >= 0 ? "positive" : "negative"} ${large ? "pnl-large" : ""}`}>
      {value > 0 ? "+" : value < 0 ? "−" : ""}{money(Math.abs(value))}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
  trend,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  tone?: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <div className={`metric-icon ${tone}`}><Icon size={18} /></div>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">
        {trend && <span className={`trend ${trend}`} >{trend === "up" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}</span>}
        {detail}
      </div>
    </div>
  );
}

function ChartPanel({
  data,
  compact = false,
  showCurrentPrice = false,
  currentPrice,
}: {
  data: { price: number; pnl: number }[];
  compact?: boolean;
  showCurrentPrice?: boolean;
  currentPrice?: number;
}) {
  return (
    <div className={`chart-panel ${compact ? "chart-compact" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 5" stroke="#253247" vertical={false} />
          <XAxis
            dataKey="price"
            tick={{ fill: "#8290a6", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#2a3548" }}
            tickFormatter={(value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            minTickGap={25}
          />
          <YAxis
            tick={{ fill: "#8290a6", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => compactMoney(value)}
            width={65}
          />
          <Tooltip
            contentStyle={{
              background: "#111c2c",
              border: "1px solid #2b3b52",
              borderRadius: 12,
              color: "#edf3ff",
              fontSize: 12,
            }}
            labelStyle={{ color: "#8e9db4", marginBottom: 5 }}
            labelFormatter={(label) => `Underlying: ${money(Number(label))}`}
            formatter={(value) => [money(Number(value)), "P&L at expiration"]}
          />
          <ReferenceLine y={0} stroke="#8390a4" strokeDasharray="5 4" />
          {showCurrentPrice && currentPrice !== undefined && (
            <ReferenceLine x={currentPrice} stroke="#61a5ff" strokeDasharray="4 4" label={{ value: "Scenario", fill: "#82b8ff", fontSize: 10, position: "insideTopRight" }} />
          )}
          <Line
            type="monotone"
            dataKey="pnl"
            stroke="#5c9eff"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "#8bc0ff", stroke: "#101a2a", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function OverviewPage({
  displayName,
  legs,
  underlyingPrice,
  totalPnl,
  totalPremium,
  chartData,
  records,
  onPageChange,
  onCalculate,
  onExport,
  onSetUnderlying,
  onAddLeg,
}: {
  displayName: string;
  legs: Leg[];
  underlyingPrice: number;
  totalPnl: number;
  totalPremium: number;
  chartData: { price: number; pnl: number }[];
  records: AnalysisRecord[];
  onPageChange: (page: Page) => void;
  onCalculate: () => void;
  onExport: () => void;
  onSetUnderlying: (price: number) => void;
  onAddLeg: () => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="YOUR RISK WORKSPACE"
        title={`Good to see you, ${displayName || "Developer"}.`}
        description="Understand your options strategy before evaluating the risk."
        actions={
          <>
            <button className="button-secondary" onClick={onExport}><Download size={16} /> Export report</button>
            <button className="button-primary" onClick={() => onPageChange("Strategy Builder")}><Plus size={17} /> New analysis</button>
          </>
        }
      />

      <div className="demo-banner">
        <div className="demo-banner-icon"><Activity size={18} /></div>
        <div>
          <strong>Risk workspace is ready</strong>
          <span>Payoff figures are calculated locally at expiration. Market prices and live portfolio data are not connected.</span>
        </div>
        <span className="demo-tag">LOCAL MODE</span>
      </div>

      <div className="metrics-grid">
        <MetricCard
          label="Scenario P&L"
          value={money(totalPnl)}
          detail="At selected expiration price"
          icon={TrendingUp}
          tone={totalPnl >= 0 ? "green" : "red"}
        />
        <MetricCard
          label="Option legs"
          value={String(legs.length).padStart(2, "0")}
          detail="Current strategy"
          icon={SlidersHorizontal}
          tone="blue"
        />
        <MetricCard
          label="Premium total"
          value={money(totalPremium)}
          detail="Sum of leg premiums × size"
          icon={Wallet}
          tone="purple"
        />
        <MetricCard
          label="Saved analyses"
          value={String(records.length).padStart(2, "0")}
          detail="Stored in this browser"
          icon={FileBarChart}
          tone="amber"
        />
      </div>

      <div className="content-grid overview-grid">
        <section className="panel payoff-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-kicker">STRATEGY PERFORMANCE</div>
              <h2>Expiration payoff</h2>
              <p>Illustrative P&L across underlying prices</p>
            </div>
            <button className="small-select" onClick={() => onPageChange("Risk Analysis")}>View analysis <ArrowUpRight size={14} /></button>
          </div>
          <div className="chart-summary">
            <div>
              <span>Selected scenario</span>
              <strong><PnlValue value={totalPnl} /></strong>
            </div>
            <div>
              <span>Underlying at expiration</span>
              <strong>{money(underlyingPrice)}</strong>
            </div>
            <div>
              <span>Strategy legs</span>
              <strong>{legs.length} active</strong>
            </div>
          </div>
          <div className="overview-chart">
            <ChartPanel data={chartData} compact showCurrentPrice currentPrice={underlyingPrice} />
          </div>
          <div className="chart-footnote"><span className="legend-dot" /> Net strategy P&L <span className="chart-footnote-muted">· At expiration only</span></div>
        </section>

        <section className="panel scenario-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-kicker">QUICK SCENARIO</div>
              <h2>Test a price</h2>
              <p>Change the expiration price to recalculate</p>
            </div>
            <div className="metric-icon blue"><Gauge size={18} /></div>
          </div>
          <label className="field-label" htmlFor="quick-price">Underlying price at expiration</label>
          <div className="input-with-prefix"><span>₹</span><input id="quick-price" type="number" min="0" value={underlyingPrice} onChange={(event) => onSetUnderlying(Number(event.target.value))} /></div>
          <input className="price-range" aria-label="Adjust expiration price" type="range" min="0" max={Math.max(200, ...legs.map((leg) => leg.strike * 2))} step="1" value={Math.min(underlyingPrice, Math.max(200, ...legs.map((leg) => leg.strike * 2)))} onChange={(event) => onSetUnderlying(Number(event.target.value))} />
          <div className="range-labels"><span>₹0</span><span>Adjust scenario</span><span>{money(Math.max(200, ...legs.map((leg) => leg.strike * 2)))}</span></div>
          <div className="scenario-result">
            <span>Calculated P&L</span>
            <PnlValue value={totalPnl} large />
            <div className={`result-status ${totalPnl >= 0 ? "status-positive" : "status-negative"}`}>
              {totalPnl >= 0 ? <Check size={14} /> : <ShieldAlert size={14} />}
              {totalPnl > 0 ? "Positive at this scenario" : totalPnl < 0 ? "Negative at this scenario" : "Break-even at this scenario"}
            </div>
          </div>
          <button className="button-primary full-button" onClick={onCalculate}><ChartNoAxesCombined size={16} /> Calculate & save scenario</button>
          <button className="button-quiet full-button" onClick={() => onPageChange("Strategy Builder")}>Edit strategy <ArrowUpRight size={14} /></button>
        </section>
      </div>

      <div className="bottom-grid">
        <section className="panel">
          <div className="panel-heading">
            <div><div className="panel-kicker">CURRENT POSITION SETUP</div><h2>Strategy snapshot</h2></div>
            <button className="text-action" onClick={() => onPageChange("Strategy Builder")}>Edit legs <ArrowUpRight size={14} /></button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Instrument</th><th>Position</th><th>Strike</th><th>Premium</th></tr></thead>
              <tbody>
                {legs.slice(0, 4).map((leg) => (
                  <tr key={leg.id}>
                    <td><span className={`type-pill ${leg.type.toLowerCase()}`}>{leg.type}</span></td>
                    <td><span className={`side-label ${leg.side.toLowerCase()}`}>{leg.side}</span></td>
                    <td>{money(leg.strike)}</td>
                    <td>{money(leg.premium)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {legs.length > 4 && <div className="table-more">+ {legs.length - 4} more legs</div>}
          <button className="button-quiet full-button" onClick={onAddLeg}><Plus size={15} /> Add option leg</button>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div><div className="panel-kicker">RECENT ACTIVITY</div><h2>Analysis history</h2></div>
            <button className="text-action" onClick={() => onPageChange("History")}>View all <ArrowUpRight size={14} /></button>
          </div>
          {records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Clock3 size={21} /></div>
              <strong>No saved analyses yet</strong>
              <span>Calculate a scenario to see it here.</span>
              <button className="text-action" onClick={() => onPageChange("Strategy Builder")}>Build your first strategy <ArrowUpRight size={14} /></button>
            </div>
          ) : (
            <div className="activity-list">
              {records.slice(0, 4).map((record) => (
                <div className="activity-item" key={record.id}>
                  <div className="activity-icon"><ChartNoAxesCombined size={17} /></div>
                  <div className="activity-copy"><strong>{record.legCount}-leg strategy</strong><span>{new Date(record.createdAt).toLocaleString()}</span></div>
                  <PnlValue value={record.pnl} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function StrategyPage({
  legs,
  underlyingPrice,
  totalPnl,
  totalPremium,
  onUpdateLeg,
  onRemoveLeg,
  onAddLeg,
  onSetUnderlying,
  onCalculate,
  onExport,
}: {
  legs: Leg[];
  underlyingPrice: number;
  totalPnl: number;
  totalPremium: number;
  onUpdateLeg: (id: number, changes: Partial<Leg>) => void;
  onRemoveLeg: (id: number) => void;
  onAddLeg: () => void;
  onSetUnderlying: (price: number) => void;
  onCalculate: () => void;
  onExport: () => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="BUILD & EVALUATE"
        title="Strategy builder"
        description="Configure option legs and explore the payoff at expiration."
        actions={<button className="button-secondary" onClick={onExport}><Download size={16} /> Export CSV</button>}
      />
      <div className="demo-banner">
        <div className="demo-banner-icon"><ShieldCheck size={18} /></div>
        <div><strong>Expiration payoff model</strong><span>This calculator uses intrinsic value minus or plus premium. It does not model early exercise, volatility, fees, or changing option prices.</span></div>
        <span className="demo-tag">MODEL V1</span>
      </div>

      <div className="builder-layout">
        <section className="panel builder-panel">
          <div className="panel-heading">
            <div><div className="panel-kicker">STRATEGY CONFIGURATION</div><h2>Option legs <span className="count-badge">{legs.length}</span></h2><p>Add individual legs to construct a multi-leg scenario.</p></div>
            <button className="button-secondary button-small" onClick={onAddLeg}><Plus size={15} /> Add leg</button>
          </div>
          <div className="leg-list">
            {legs.map((leg, index) => (
              <div className="leg-card" key={leg.id}>
                <div className="leg-card-heading">
                  <div className="leg-number">{String(index + 1).padStart(2, "0")}</div>
                  <div><strong>Option leg {index + 1}</strong><span>Configure contract details</span></div>
                  <button className="icon-button delete-button" onClick={() => onRemoveLeg(leg.id)} aria-label={`Remove leg ${index + 1}`}><Trash2 size={16} /></button>
                </div>
                <div className="leg-fields">
                  <label className="form-field"><span>Option type</span><select value={leg.type} onChange={(event) => onUpdateLeg(leg.id, { type: event.target.value as OptionType })}><option value="CALL">CALL</option><option value="PUT">PUT</option></select></label>
                  <label className="form-field"><span>Position</span><select value={leg.side} onChange={(event) => onUpdateLeg(leg.id, { side: event.target.value as PositionSide })}><option value="LONG">LONG</option><option value="SHORT">SHORT</option></select></label>
                  <label className="form-field"><span>Strike price (₹)</span><input type="number" min="0.01" step="any" value={leg.strike} onChange={(event) => onUpdateLeg(leg.id, { strike: Number(event.target.value) })} /></label>
                  <label className="form-field"><span>Premium (₹)</span><input type="number" min="0" step="any" value={leg.premium} onChange={(event) => onUpdateLeg(leg.id, { premium: Number(event.target.value) })} /></label>
                  <label className="form-field"><span>Quantity</span><input type="number" min="1" step="1" value={leg.quantity} onChange={(event) => onUpdateLeg(leg.id, { quantity: Number(event.target.value) })} /></label>
                  <label className="form-field"><span>Multiplier</span><input type="number" min="0.01" step="any" value={leg.multiplier} onChange={(event) => onUpdateLeg(leg.id, { multiplier: Number(event.target.value) })} /></label>
                </div>
                <div className="leg-footer"><span>Leg P&L at current scenario</span><PnlValue value={legPnl(leg, underlyingPrice)} /></div>
              </div>
            ))}
          </div>
          <button className="add-leg-dashed" onClick={onAddLeg}><Plus size={17} /> Add another option leg</button>
        </section>

        <aside className="builder-side">
          <section className="panel">
            <div className="panel-heading"><div><div className="panel-kicker">EXPIRATION SCENARIO</div><h2>Underlying price</h2></div><div className="metric-icon blue"><Gauge size={17} /></div></div>
            <label className="field-label" htmlFor="builder-price">Price at expiration (₹)</label>
            <div className="input-with-prefix"><span>₹</span><input id="builder-price" type="number" min="0" value={underlyingPrice} onChange={(event) => onSetUnderlying(Number(event.target.value))} /></div>
            <div className="quick-prices">{[50, 75, 100, 125, 150, 200].map((price) => <button key={price} className={underlyingPrice === price ? "selected" : ""} onClick={() => onSetUnderlying(price)}>{price}</button>)}</div>
          </section>
          <section className="panel result-panel">
            <div className="panel-kicker">CALCULATED RESULT</div>
            <span className="result-label">Total strategy P&L</span>
            <PnlValue value={totalPnl} large />
            <div className={`result-status ${totalPnl >= 0 ? "status-positive" : "status-negative"}`}>{totalPnl >= 0 ? <Check size={14} /> : <ShieldAlert size={14} />}{totalPnl > 0 ? "Positive scenario" : totalPnl < 0 ? "Negative scenario" : "Break-even scenario"}</div>
            <div className="result-divider" />
            <div className="result-row"><span>Leg count</span><strong>{legs.length}</strong></div>
            <div className="result-row"><span>Premium total*</span><strong>{money(totalPremium)}</strong></div>
            <div className="result-row"><span>Expiration price</span><strong>{money(underlyingPrice)}</strong></div>
            <button className="button-primary full-button" onClick={onCalculate}><ChartNoAxesCombined size={16} /> Calculate & save</button>
            <p className="tiny-note">*Sum of premiums × quantity × multiplier. For short legs, this is not net premium received.</p>
          </section>
          <div className="risk-note"><ShieldAlert size={17} /><span>Options can involve substantial losses. A positive result in this model is not a forecast or a recommendation.</span></div>
        </aside>
      </div>
    </>
  );
}

function AnalysisPage({
  legs,
  underlyingPrice,
  totalPnl,
  perLegResults,
  chartData,
  bestVisible,
  worstVisible,
  onPageChange,
  onCalculate,
  onSetUnderlying,
}: {
  legs: Leg[];
  underlyingPrice: number;
  totalPnl: number;
  perLegResults: (Leg & { pnl: number })[];
  chartData: { price: number; pnl: number }[];
  bestVisible: number;
  worstVisible: number;
  onPageChange: (page: Page) => void;
  onCalculate: () => void;
  onSetUnderlying: (price: number) => void;
}) {
  return (
    <>
      <PageHeading eyebrow="RISK & SCENARIOS" title="Risk analysis" description="Explore how your strategy's expiration P&L changes with the underlying price." actions={<button className="button-primary" onClick={onCalculate}><RefreshCw size={16} /> Save scenario</button>} />
      <div className="metrics-grid three">
        <MetricCard label="P&L at selected price" value={money(totalPnl)} detail={`Underlying: ${money(underlyingPrice)}`} icon={Activity} tone={totalPnl >= 0 ? "green" : "red"} />
        <MetricCard label="Best sampled P&L" value={money(bestVisible)} detail="Within displayed chart range" icon={ArrowUpRight} tone="green" />
        <MetricCard label="Worst sampled P&L" value={money(worstVisible)} detail="Within displayed chart range" icon={ArrowDownRight} tone="red" />
      </div>
      <section className="panel analysis-chart-panel">
        <div className="panel-heading"><div><div className="panel-kicker">PAYOFF PROFILE</div><h2>Profit / loss at expiration</h2><p>Move across the chart to inspect sampled underlying prices.</p></div><span className="demo-tag">ILLUSTRATIVE</span></div>
        <div className="analysis-chart"><ChartPanel data={chartData} showCurrentPrice currentPrice={underlyingPrice} /></div>
        <div className="scenario-control">
          <label className="field-label" htmlFor="analysis-price">Underlying price: <strong>{money(underlyingPrice)}</strong></label>
          <input id="analysis-price" className="price-range" type="range" min="0" max={Math.max(200, ...legs.map((leg) => leg.strike * 2))} value={Math.min(underlyingPrice, Math.max(200, ...legs.map((leg) => leg.strike * 2)))} onChange={(event) => onSetUnderlying(Number(event.target.value))} />
          <div className="range-labels"><span>Lower price</span><span>Higher price</span></div>
        </div>
      </section>
      <section className="panel analysis-table-panel">
        <div className="panel-heading"><div><div className="panel-kicker">CONTRIBUTION ANALYSIS</div><h2>Per-leg breakdown</h2><p>Each leg's contribution at the selected expiration price.</p></div><button className="text-action" onClick={() => onPageChange("Strategy Builder")}>Edit strategy <ArrowUpRight size={14} /></button></div>
        <div className="table-wrap"><table><thead><tr><th>Leg</th><th>Type</th><th>Side</th><th>Strike</th><th>Premium</th><th>Quantity</th><th>Multiplier</th><th>P&L</th></tr></thead><tbody>{perLegResults.map((leg, index) => <tr key={leg.id}><td>Leg {index + 1}</td><td><span className={`type-pill ${leg.type.toLowerCase()}`}>{leg.type}</span></td><td><span className={`side-label ${leg.side.toLowerCase()}`}>{leg.side}</span></td><td>{money(leg.strike)}</td><td>{money(leg.premium)}</td><td>{leg.quantity}</td><td>{leg.multiplier}</td><td><PnlValue value={leg.pnl} /></td></tr>)}</tbody><tfoot><tr><td colSpan={7}>Total strategy P&L</td><td><PnlValue value={totalPnl} /></td></tr></tfoot></table></div>
      </section>
      <div className="risk-note"><ShieldAlert size={17} /><span>Best/worst values are sampled from the displayed price range, not guaranteed maximum profit or loss. The chart models expiration payoff only.</span></div>
    </>
  );
}

function HistoryPage({
  records,
  search,
  onSearch,
  onClear,
  onExport,
  onLoad,
}: {
  records: AnalysisRecord[];
  search: string;
  onSearch: (value: string) => void;
  onClear: () => void;
  onExport: () => void;
  onLoad: (record: AnalysisRecord) => void;
}) {
  return (
    <>
      <PageHeading eyebrow="YOUR WORKSPACE" title="Analysis history" description="Review saved expiration scenarios from this browser." actions={<button className="button-secondary" onClick={onExport}><Download size={16} /> Export latest</button>} />
      <section className="panel history-panel">
        <div className="history-toolbar">
          <div className="search-field"><Search size={17} /><input placeholder="Search by scenario or underlying price..." value={search} onChange={(event) => onSearch(event.target.value)} /></div>
          <button className="button-secondary button-small" onClick={onClear}><Trash2 size={15} /> Clear history</button>
        </div>
        {records.length === 0 ? <div className="empty-state roomy"><div className="empty-icon"><Clock3 size={23} /></div><strong>No saved scenarios</strong><span>Use the Strategy Builder to calculate and save your first analysis.</span></div> : (
          <div className="table-wrap"><table><thead><tr><th>Date</th><th>Underlying price</th><th>Legs</th><th>Expiration P&L</th><th>Action</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><div className="history-date">{new Date(record.createdAt).toLocaleDateString()}</div><span className="sub-cell">{new Date(record.createdAt).toLocaleTimeString()}</span></td><td>{money(record.underlying)}</td><td>{record.legCount}</td><td><PnlValue value={record.pnl} /></td><td><button className="text-action" onClick={() => onLoad(record)}>Load scenario <ArrowUpRight size={14} /></button></td></tr>)}</tbody></table></div>
        )}
      </section>
      <p className="page-note"><ShieldCheck size={14} /> History is stored in your browser only. Clearing browser data can remove saved scenarios.</p>
    </>
  );
}

function ReportsPage({
  records,
  totalPnl,
  onExport,
  onPageChange,
}: {
  records: AnalysisRecord[];
  totalPnl: number;
  onExport: () => void;
  onPageChange: (page: Page) => void;
}) {
  return (
    <>
      <PageHeading eyebrow="EXPORT & DOCUMENTATION" title="Reports" description="Create a portable record of your current illustrative scenario." />
      <div className="report-grid">
        <section className="panel report-feature">
          <div className="report-illustration"><FileBarChart size={32} /></div>
          <div className="panel-kicker">SCENARIO EXPORT</div>
          <h2>Expiration payoff report</h2>
          <p>Export your current option legs, inputs, per-leg P&L, total P&L, and risk disclaimer to a CSV file that opens in spreadsheet software.</p>
          <button className="button-primary" onClick={onExport}><Download size={16} /> Export current report</button>
        </section>
        <section className="panel report-stats">
          <div className="panel-kicker">REPORT SNAPSHOT</div>
          <h2>Current workspace</h2>
          <div className="report-stat-row"><span>Saved analyses</span><strong>{records.length}</strong></div>
          <div className="report-stat-row"><span>Latest scenario P&L</span><PnlValue value={records[0]?.pnl ?? totalPnl} /></div>
          <div className="report-stat-row"><span>Latest saved date</span><strong>{records[0] ? new Date(records[0].createdAt).toLocaleDateString() : "No reports yet"}</strong></div>
          <button className="button-secondary full-button" onClick={() => onPageChange("History")}>Browse history <ArrowUpRight size={15} /></button>
        </section>
      </div>
      <div className="risk-note"><ShieldAlert size={17} /><span>Reports contain illustrative calculations only. They do not represent verified market data, tax advice, or a recommendation to trade.</span></div>
    </>
  );
}

function SettingsPage({
  displayName,
  onSaveName,
  riskAcknowledged,
  onRiskChange,
  onClearHistory,
}: {
  displayName: string;
  onSaveName: (name: string) => void;
  riskAcknowledged: boolean;
  onRiskChange: (checked: boolean) => void;
  onClearHistory: () => void;
}) {
  const [name, setName] = useState(displayName);
  useEffect(() => setName(displayName), [displayName]);

  return (
    <>
      <PageHeading eyebrow="PREFERENCES" title="Settings" description="Personalize your local OptionLens workspace." />
      <div className="settings-layout">
        <section className="panel settings-panel">
          <div className="settings-section-heading"><div className="settings-section-icon"><Settings size={18} /></div><div><h2>Profile</h2><p>Change the name shown in your dashboard.</p></div></div>
          <label className="form-field settings-name"><span>Display name</span><input value={name} maxLength={50} onChange={(event) => setName(event.target.value)} /></label>
          <button className="button-primary" onClick={() => onSaveName(name)}><Check size={16} /> Save preferences</button>
        </section>
        <section className="panel settings-panel">
          <div className="settings-section-heading"><div className="settings-section-icon"><ShieldCheck size={18} /></div><div><h2>Risk & data</h2><p>Understand what the current model does and does not do.</p></div></div>
          <div className="settings-info"><strong>Local expiration calculator</strong><p>OptionLens calculates option payoff at expiration from your inputs. It is not connected to a live market feed or brokerage account.</p></div>
          <label className="check-row"><input type="checkbox" checked={riskAcknowledged} onChange={(event) => onRiskChange(event.target.checked)} /><span>I understand these calculations are illustrative and are not investment advice.</span></label>
        </section>
        <section className="panel settings-panel danger-zone">
          <div className="settings-section-heading"><div className="settings-section-icon danger"><Trash2 size={18} /></div><div><h2>Local data</h2><p>Remove the analysis history stored in this browser.</p></div></div>
          <button className="button-danger" onClick={onClearHistory}><Trash2 size={15} /> Clear analysis history</button>
        </section>
      </div>
    </>
  );
}

export default App;