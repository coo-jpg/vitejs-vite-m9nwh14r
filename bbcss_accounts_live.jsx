import { useState, useEffect, useCallback, useRef } from "react";

// ═══ SUPABASE CONFIG ═══
const SB_URL = "https://iqccddabidfcrsbdehiq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxY2NkZGFiaWRmY3JzYmRlaGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwODQyMDQsImV4cCI6MjA4NzY2MDIwNH0.tKb-l9TnlSDVsG7zHUJTdd5kt5vWCYKtvQYwVjz0xos";
const hdrs = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
const rest = (table, q = "") => `${SB_URL}/rest/v1/${table}${q}`;

async function sbSelect(table, query = "") {
  const r = await fetch(rest(table, query), { headers: { ...hdrs, Prefer: "return=representation" } });
  return r.ok ? r.json() : [];
}
async function sbInsert(table, data) {
  const r = await fetch(rest(table), { method: "POST", headers: { ...hdrs, Prefer: "return=representation" }, body: JSON.stringify(data) });
  return r.ok ? r.json() : null;
}
async function sbUpdate(table, match, data) {
  const r = await fetch(rest(table, match), { method: "PATCH", headers: { ...hdrs, Prefer: "return=representation" }, body: JSON.stringify(data) });
  return r.ok ? r.json() : null;
}
async function sbDelete(table, match) {
  await fetch(rest(table, match), { method: "DELETE", headers: hdrs });
}
async function sbUploadFile(path, file) {
  const r = await fetch(`${SB_URL}/storage/v1/object/account-docs/${path}`, {
    method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": file.type }, body: file,
  });
  return r.ok;
}
function sbFileUrl(path) {
  return `${SB_URL}/storage/v1/object/public/account-docs/${path}`;
}
async function sbDeleteFile(path) {
  await fetch(`${SB_URL}/storage/v1/object/account-docs/${path}`, { method: "DELETE", headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
}

// ═══ THEME ═══
const font = "'Share Tech Mono','Courier New',monospace";
const C = { bg: "#0a0f0a", panel: "#111a0f", border: "#2a3a22", gold: "#d4a841", muted: "#6b7a5e", dim: "#4a5a42", text: "#c8cfc8", soft: "#8a9a82", dark: "#0f1a0d", green: "#4ade80", yellow: "#fbbf24", red: "#ef4444", blue: "#60a5fa" };

const defSettings = {
  companyName: "BBCSS", tagline: "BLACK BELT COMMANDOS · ACCOUNT MANAGEMENT SYSTEM",
  serviceTypes: ["Security Services", "Facility Management", "Housekeeping", "Event Security", "Manpower Supply"],
  complianceItems: [{ key: "psara", label: "PSARA License" }, { key: "labour", label: "Labour License" }, { key: "esiPf", label: "ESI/PF Registration" }, { key: "clra", label: "CLRA Returns" }],
  healthStatuses: [{ key: "Green", color: C.green, meaning: "All good" }, { key: "Yellow", color: C.yellow, meaning: "Needs attention" }, { key: "Red", color: C.red, meaning: "Critical" }],
  accountStatuses: ["Active", "Paused", "Terminated", "Onboarding"],
  billingCycles: ["Monthly", "Quarterly", "Half-Yearly", "Annually"],
  paymentTermsPresets: [15, 30, 45, 60, 90],
  staffRoles: [{ key: "guard", label: "Guard" }, { key: "supervisor", label: "Supervisor" }, { key: "gunman", label: "Gunman" }, { key: "housekeeper", label: "Housekeeper" }, { key: "driver", label: "Driver" }],
  alertThresholds: { renewalDays: 90, overduePaymentDays: 45, staffShortfallPct: 10 },
  currency: { symbol: "₹", locale: "en-IN", lakhFormat: true },
  invoiceDayDefault: 1, defaultPaymentTerms: 30, defaultBillingCycle: "Monthly", defaultHealth: "Green", defaultStatus: "Active",
  customFields: [], notesTemplate: "", showBranding: true,
  renewalStatuses: ["Pending", "In Discussion", "Rate Revision", "Renewed", "Lost"],
};

// ═══ UTILS ═══
const fmt = (a, cu) => { const s = cu?.symbol || "₹"; if (cu?.lakhFormat !== false) { if (Math.abs(a) >= 1e7) return `${s}${(a / 1e7).toFixed(2)}Cr`; if (Math.abs(a) >= 1e5) return `${s}${(a / 1e5).toFixed(1)}L`; if (Math.abs(a) >= 1e3) return `${s}${(a / 1e3).toFixed(1)}K`; } return `${s}${a.toLocaleString(cu?.locale || "en-IN")}`; };
const fmtDate = d => { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); };
const daysTo = d => Math.ceil((new Date(d) - new Date()) / 864e5);
const daysSince = d => Math.ceil((new Date() - new Date(d)) / 864e5);
const hCol = (h, hs) => hs.find(x => x.key === h)?.color || "#888";
const totalStaff = (sb, type) => Object.values(sb || {}).reduce((s, v) => s + (v[type] || 0), 0);

// ═══ STYLES ═══
const I = { background: C.panel, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", fontSize: 12, fontFamily: font, width: "100%", boxSizing: "border-box", outline: "none" };
const Sel = { ...I };
const Lbl = { fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" };
const Sec = { background: C.panel, border: `1px solid ${C.border}`, padding: 18, marginBottom: 14 };
const SecT = { fontSize: 11, color: C.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.border}` };
const pillS = (c) => ({ display: "inline-block", background: c + "22", color: c, padding: "2px 8px", fontSize: 10, borderRadius: 2, fontWeight: 700, letterSpacing: 1 });
const dotS = (c) => ({ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: c, marginRight: 6, verticalAlign: "middle", flexShrink: 0 });
const navB = (a) => ({ background: a ? C.gold : "transparent", color: a ? C.bg : C.muted, border: `1px solid ${a ? C.gold : C.border}`, padding: "7px 14px", fontSize: 11, letterSpacing: 1, cursor: "pointer", fontFamily: font });
const btnS = (v) => ({ background: v === "p" ? C.gold : v === "d" ? "#7f1d1d" : v === "s" ? "#1a2418" : "transparent", color: v === "p" ? C.bg : v === "d" ? "#fca5a5" : v === "s" ? C.gold : C.muted, border: `1px solid ${v === "p" ? C.gold : v === "d" ? "#991b1b" : C.border}`, padding: "7px 14px", fontSize: 11, letterSpacing: 1, cursor: "pointer", fontFamily: font, fontWeight: 700 });
const sBtnS = (v) => ({ ...btnS(v), padding: "4px 10px", fontSize: 10 });
const Th = { background: "#1a2418", color: C.gold, padding: "8px 10px", textAlign: "left", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", borderBottom: `2px solid ${C.border}`, whiteSpace: "nowrap" };
const Td = { padding: "8px 10px", borderBottom: `1px solid #1a2418`, verticalAlign: "middle", fontSize: 12 };
const dRow = { display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.bg}` };

function InlineEdit({ value, onChange, style: st }) {
  const [ed, setEd] = useState(false), [v, setV] = useState(value), r = useRef();
  useEffect(() => { if (ed && r.current) r.current.focus(); }, [ed]);
  if (!ed) return <span style={{ ...st, cursor: "pointer", borderBottom: `1px dashed ${C.border}` }} onClick={() => { setV(value); setEd(true) }}>{value}</span>;
  return <input ref={r} style={{ ...I, ...st, width: "auto", minWidth: 50 }} value={v} onChange={e => setV(e.target.value)} onBlur={() => { onChange(v); setEd(false) }} onKeyDown={e => { if (e.key === "Enter") { onChange(v); setEd(false) } if (e.key === "Escape") setEd(false) }} />;
}

function PayInput({ onRecord }) {
  const [a, setA] = useState(""), [ref, setRef] = useState(""), [note, setNote] = useState("");
  return (<div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
    <input style={{ ...I, flex: 1, minWidth: 80 }} placeholder="Amount" value={a} onChange={e => setA(e.target.value)} type="number" />
    <input style={{ ...I, width: 100 }} placeholder="Ref (NEFT/UPI)" value={ref} onChange={e => setRef(e.target.value)} />
    <input style={{ ...I, width: 100 }} placeholder="Note" value={note} onChange={e => setNote(e.target.value)} />
    <button style={btnS("p")} onClick={() => { if (a > 0) { onRecord(Number(a), ref, note); setA(""); setRef(""); setNote("") } }}>RECORD</button>
  </div>);
}

function DocUpload({ docs, onUpload, onRemove }) {
  const ref = useRef();
  return (<div>
    <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
      {docs.map(d => (<div key={d.id} style={{ background: "#1a2418", border: `1px solid ${C.border}`, padding: "6px 10px", fontSize: 11, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: C.gold, cursor: "pointer" }} onClick={() => { const a = document.createElement("a"); a.href = sbFileUrl(d.storage_path); a.target = "_blank"; a.click(); }}>📄 {d.file_name}</span>
        <span style={{ color: C.dim, fontSize: 10 }}>{(d.file_size / 1024).toFixed(0)}KB · {fmtDate(d.uploaded_at)}</span>
        <span style={{ color: C.red, cursor: "pointer", fontWeight: 700 }} onClick={() => onRemove(d.id, d.storage_path)}>×</span>
      </div>))}
      {docs.length === 0 && <span style={{ color: C.dim, fontSize: 11 }}>No documents uploaded</span>}
    </div>
    <input ref={ref} type="file" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) { onUpload(e.target.files[0]); e.target.value = "" } }} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls" />
    <button style={sBtnS("s")} onClick={() => ref.current.click()}>📎 UPLOAD DOCUMENT</button>
    <span style={{ fontSize: 10, color: C.dim, marginLeft: 8 }}>Max 5MB · PDF, DOC, IMG, XLS</span>
  </div>);
}

// CSV export
const toCSV = (accounts, settings) => {
  const roles = settings.staffRoles.map(r => r.key);
  const comp = settings.complianceItems.map(c => c.key);
  const headers = ["ID", "Client", "Location", "Type", "Status", "Health", "Contract Value", "Billing", "Terms", "Start", "End", "Renewal Status", "Rate Rev%", "Pending", "Total Req", "Total Dep",
    ...roles.flatMap(r => [`${r}_Req`, `${r}_Dep`]), ...comp.map(c => `Compliance_${c}`), "Total Paid", "Notes"];
  const rows = accounts.map(a => {
    const sr = totalStaff(a.staff_breakdown, "required"), sd = totalStaff(a.staff_breakdown, "deployed");
    const totalPaid = (a._payments || []).reduce((s, p) => s + Number(p.amount), 0);
    return [a.account_id, `"${a.client}"`, `"${a.location || ""}"`, a.service_type, a.status, a.health, a.contract_value, a.billing_cycle, a.payment_terms, a.contract_start, a.contract_end, a.renewal_status || "", a.rate_revision || 0, a.pending_amount, sr, sd,
      ...roles.flatMap(r => [a.staff_breakdown?.[r]?.required || 0, a.staff_breakdown?.[r]?.deployed || 0]),
      ...comp.map(c => a.compliance_status?.[c] ? "Yes" : "No"), totalPaid, `"${(a.notes || "").replace(/"/g, '""')}"`
    ].join(",");
  });
  return headers.join(",") + "\n" + rows.join("\n");
};

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [settings, setSettings] = useState(defSettings);
  const [settingsId, setSettingsId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [view, setView] = useState("dashboard");
  const [selId, setSelId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFD] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sTab, setSTab] = useState("general");
  const [toast, setToast] = useState(null);
  const show = m => { setToast(m); setTimeout(() => setToast(null), 2500) };

  // ─── LOAD FROM SUPABASE ───
  const loadAll = useCallback(async () => {
    try {
      setSyncing(true);
      const [accs, sArr] = await Promise.all([
        sbSelect("accounts", "?order=account_id.asc"),
        sbSelect("account_settings", "?limit=1"),
      ]);
      // Load payments & docs for each account
      const enriched = await Promise.all(accs.map(async a => {
        const [pays, docs] = await Promise.all([
          sbSelect("account_payments", `?account_id=eq.${a.id}&order=payment_date.desc`),
          sbSelect("account_documents", `?account_id=eq.${a.id}&order=uploaded_at.desc`),
        ]);
        return { ...a, _payments: pays || [], _documents: docs || [] };
      }));
      setAccounts(enriched);
      if (sArr.length > 0) { setSettings({ ...defSettings, ...sArr[0].settings_data }); setSettingsId(sArr[0].id); }
    } catch (e) { console.error("Load error:", e); }
    setSyncing(false);
    setLoaded(true);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── SETTINGS CRUD ───
  const uS = async (patch) => {
    const u = { ...settings, ...patch };
    setSettings(u);
    if (settingsId) await sbUpdate("account_settings", `?id=eq.${settingsId}`, { settings_data: u });
    show("Settings saved");
  };

  // ─── ACCOUNT CRUD ───
  const saveAcc = async () => {
    if (!formData) return;
    setSyncing(true);
    if (editMode) {
      const { _payments, _documents, id, created_at, updated_at, ...rest } = formData;
      await sbUpdate("accounts", `?id=eq.${formData.id}`, rest);
    } else {
      const nums = accounts.map(a => parseInt(a.account_id.replace("ACC-", "")) || 0);
      const next = Math.max(0, ...nums) + 1;
      const { _payments, _documents, id, ...rest } = formData;
      await sbInsert("accounts", { ...rest, account_id: `ACC-${String(next).padStart(3, "0")}` });
    }
    await loadAll();
    setShowForm(false); setEditMode(false); setSyncing(false);
    show(editMode ? "Updated" : "Created");
  };

  const delAcc = async (id) => {
    setSyncing(true);
    await sbDelete("accounts", `?id=eq.${id}`);
    await loadAll();
    setSelId(null); setView("dashboard"); setSyncing(false); show("Deleted");
  };

  const updAcc = async (id, patch) => {
    await sbUpdate("accounts", `?id=eq.${id}`, patch);
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  const recordPay = async (accountUuid, amt, ref, note) => {
    setSyncing(true);
    await sbInsert("account_payments", { account_id: accountUuid, payment_date: new Date().toISOString().split("T")[0], amount: amt, reference: ref, note });
    const acc = accounts.find(a => a.id === accountUuid);
    if (acc) await sbUpdate("accounts", `?id=eq.${accountUuid}`, { pending_amount: Math.max(0, Number(acc.pending_amount) - amt) });
    await loadAll();
    setSyncing(false); show(`${settings.currency.symbol}${amt.toLocaleString()} recorded`);
  };

  const uploadDoc = async (accountUuid, file) => {
    if (file.size > 5 * 1024 * 1024) { show("Max 5MB"); return; }
    setSyncing(true);
    const path = `${accountUuid}/${Date.now()}_${file.name}`;
    const ok = await sbUploadFile(path, file);
    if (ok) {
      await sbInsert("account_documents", { account_id: accountUuid, file_name: file.name, file_type: file.type, file_size: file.size, storage_path: path });
      await loadAll();
      show("Uploaded");
    } else { show("Upload failed"); }
    setSyncing(false);
  };

  const rmDoc = async (docId, storagePath) => {
    setSyncing(true);
    await sbDeleteFile(storagePath);
    await sbDelete("account_documents", `?id=eq.${docId}`);
    await loadAll();
    setSyncing(false); show("Removed");
  };

  // ─── DERIVED STATE ───
  const sel = accounts.find(a => a.id === selId);
  const filt = accounts.filter(a => { const mf = filter === "All" || a.health === filter || a.status === filter; const ms = a.client.toLowerCase().includes(search.toLowerCase()) || (a.location || "").toLowerCase().includes(search.toLowerCase()); return mf && ms });
  const totCV = accounts.reduce((s, a) => s + Number(a.contract_value), 0);
  const totPend = accounts.reduce((s, a) => s + Number(a.pending_amount), 0);
  const totReq = accounts.reduce((s, a) => s + totalStaff(a.staff_breakdown, "required"), 0);
  const totDep = accounts.reduce((s, a) => s + totalStaff(a.staff_breakdown, "deployed"), 0);
  const renSoon = accounts.filter(a => { const d = daysTo(a.contract_end); return d <= settings.alertThresholds.renewalDays && d > 0 }).length;
  const compGaps = accounts.filter(a => Object.values(a.compliance_status || {}).some(v => !v)).length;
  const totalCollected = accounts.reduce((s, a) => s + (a._payments || []).reduce((ps, p) => ps + Number(p.amount), 0), 0);
  const totalBilled = totalCollected + totPend;
  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 100;
  const activeAccs = accounts.filter(a => a.status === "Active");
  const avgDSO = activeAccs.length > 0 ? activeAccs.reduce((s, a) => { if (!a._payments?.length) return s + a.payment_terms; return s + daysSince(a._payments[0].payment_date); }, 0) / activeAccs.length : 0;
  const aging = { current: 0, d30: 0, d60: 0, over90: 0 };
  accounts.forEach(a => { if (Number(a.pending_amount) <= 0) return; const lp = a._payments?.[0]?.payment_date || a.contract_start; const d = daysSince(lp); if (d <= 30) aging.current += Number(a.pending_amount); else if (d <= 60) aging.d30 += Number(a.pending_amount); else if (d <= 90) aging.d60 += Number(a.pending_amount); else aging.over90 += Number(a.pending_amount); });

  const exportCSV = () => { const csv = toCSV(accounts, settings); const b = new Blob([csv], { type: "text/csv" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `bbcss_accounts_${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(u); show("CSV exported") };

  const mkEmpty = () => ({ account_id: "", client: "", location: "", service_type: settings.serviceTypes[0] || "", contract_value: 0, billing_cycle: settings.defaultBillingCycle, contract_start: "", contract_end: "", invoice_day: settings.invoiceDayDefault, payment_terms: settings.defaultPaymentTerms, status: settings.defaultStatus, health: settings.defaultHealth, staff_breakdown: Object.fromEntries(settings.staffRoles.map(r => [r.key, { required: 0, deployed: 0 }])), pending_amount: 0, compliance_status: Object.fromEntries(settings.complianceItems.map(c => [c.key, false])), contacts: [{ name: "", phone: "", role: "POC" }], notes: settings.notesTemplate, renewal_status: settings.renewalStatuses?.[0] || "Pending", rate_revision: 0, custom_data: {}, _payments: [], _documents: [] });

  if (!loaded) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontFamily: font, flexDirection: "column", gap: 12 }}><div style={{ animation: "pulse 1.5s infinite", fontSize: 14, letterSpacing: 3 }}>CONNECTING TO SUPABASE...</div><div style={{ fontSize: 10, color: C.muted }}>iqccddabidfcrsbdehiq.supabase.co</div></div>;

  // ═══ ANALYTICS ═══
  const Analytics = () => {
    const staffByRole = {};
    settings.staffRoles.forEach(r => { staffByRole[r.key] = { req: 0, dep: 0, label: r.label } });
    accounts.forEach(a => Object.entries(a.staff_breakdown || {}).forEach(([k, v]) => { if (staffByRole[k]) { staffByRole[k].req += v.required || 0; staffByRole[k].dep += v.deployed || 0 } }));
    const maxStaff = Math.max(1, ...Object.values(staffByRole).map(v => v.req));
    const agingTotal = aging.current + aging.d30 + aging.d60 + aging.over90;
    return (<>
      <div style={{ ...Sec, borderColor: C.gold }}>
        <div style={SecT}>📊 COLLECTION HEALTH</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 16 }}>
          {[{ l: "Collection Rate", v: `${collectionRate.toFixed(1)}%`, c: collectionRate > 80 ? C.green : collectionRate > 60 ? C.yellow : C.red },
          { l: "Avg DSO", v: `${avgDSO.toFixed(0)}d`, c: avgDSO < 45 ? C.green : avgDSO < 60 ? C.yellow : C.red },
          { l: "Total Receivables", v: fmt(totPend, settings.currency), c: totPend > 0 ? C.yellow : C.green },
          { l: "Total Collected", v: fmt(totalCollected, settings.currency), c: C.gold },
          ].map((x, i) => <div key={i} style={{ background: C.bg, padding: 12, textAlign: "center" }}><div style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>{x.l}</div><div style={{ fontSize: 22, fontWeight: 700, color: x.c, marginTop: 4 }}>{x.v}</div></div>)}
        </div>
        <div style={{ fontSize: 11, color: C.gold, letterSpacing: 2, marginBottom: 8 }}>AGING ANALYSIS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {[{ l: "Current (0-30d)", v: aging.current, c: C.green }, { l: "31-60 Days", v: aging.d30, c: C.yellow }, { l: "61-90 Days", v: aging.d60, c: "#f97316" }, { l: "90+ Days", v: aging.over90, c: C.red }].map((x, i) => (
            <div key={i} style={{ background: C.bg, padding: 10 }}><div style={{ fontSize: 10, color: C.muted }}>{x.l}</div><div style={{ fontSize: 18, fontWeight: 700, color: x.c }}>{fmt(x.v, settings.currency)}</div>
              {agingTotal > 0 && <div style={{ height: 4, background: "#1a2418", borderRadius: 2, marginTop: 6, overflow: "hidden" }}><div style={{ height: "100%", width: `${(x.v / agingTotal) * 100}%`, background: x.c, borderRadius: 2 }} /></div>}
            </div>))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={Sec}><div style={SecT}>👥 STAFF BY ROLE</div>
          {Object.entries(staffByRole).filter(([, v]) => v.req > 0).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><span style={{ color: C.text }}>{v.label}</span><span><span style={{ color: v.dep >= v.req ? C.green : C.yellow }}>{v.dep}</span><span style={{ color: C.dim }}>/{v.req}</span></span></div>
              <div style={{ height: 8, background: "#1a2418", borderRadius: 4, overflow: "hidden", position: "relative" }}><div style={{ position: "absolute", height: "100%", width: `${(v.req / maxStaff) * 100}%`, background: C.border, borderRadius: 4 }} /><div style={{ position: "absolute", height: "100%", width: `${(v.dep / maxStaff) * 100}%`, background: v.dep >= v.req ? C.green : C.yellow, borderRadius: 4 }} /></div>
            </div>))}
        </div>
        <div style={Sec}><div style={SecT}>🔄 RENEWAL PIPELINE</div>
          {accounts.filter(a => a.status === "Active").sort((a, b) => daysTo(a.contract_end) - daysTo(b.contract_end)).slice(0, 8).map(a => {
            const d = daysTo(a.contract_end);
            return (<div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.bg}`, cursor: "pointer" }} onClick={() => { setSelId(a.id); setView("detail") }}>
              <span style={dotS(d <= 30 ? C.red : d <= settings.alertThresholds.renewalDays ? C.yellow : C.green)} /><span style={{ flex: 1, fontSize: 11, color: C.text }}>{a.client}</span>
              <span style={pillS(a.renewal_status === "Renewed" ? C.green : a.renewal_status === "Lost" ? C.red : C.yellow)}>{a.renewal_status || "Pending"}</span>
              <span style={{ fontSize: 10, color: d <= 30 ? C.red : C.muted, fontWeight: 700 }}>{d}d</span>
              {Number(a.rate_revision) > 0 && <span style={{ fontSize: 10, color: C.blue }}>+{a.rate_revision}%</span>}
            </div>);
          })}
        </div>
      </div>
      <div style={{ ...Sec, marginTop: 14 }}><div style={SecT}>📈 EFFECTIVENESS SCORE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
          {[{ l: "Staffing Fill", v: `${totReq > 0 ? ((totDep / totReq) * 100).toFixed(1) : 100}%`, sc: totReq > 0 ? (totDep / totReq) * 100 : 100 },
          { l: "Collection", v: `${collectionRate.toFixed(1)}%`, sc: collectionRate },
          { l: "Compliance", v: `${accounts.length > 0 ? ((accounts.length - compGaps) / accounts.length * 100).toFixed(0) : 100}%`, sc: accounts.length > 0 ? (accounts.length - compGaps) / accounts.length * 100 : 100 },
          { l: "Renewal Ready", v: `${activeAccs.length > 0 ? ((activeAccs.length - renSoon) / activeAccs.length * 100).toFixed(0) : 100}%`, sc: activeAccs.length > 0 ? (activeAccs.length - renSoon) / activeAccs.length * 100 : 100 },
          ].map((x, i) => { const col = x.sc >= 80 ? C.green : x.sc >= 60 ? C.yellow : C.red; return (<div key={i} style={{ background: C.bg, padding: 14 }}><div style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>{x.l}</div><div style={{ fontSize: 26, fontWeight: 700, color: col, margin: "4px 0" }}>{x.v}</div><div style={{ height: 4, background: "#1a2418", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(100, x.sc)}%`, background: col, borderRadius: 2 }} /></div></div>) })}
        </div>
      </div>
    </>);
  };

  // ═══ DASHBOARD ═══
  const Dashboard = () => (<>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 20 }}>
      {[{ l: "Accounts", v: activeAccs.length, s: `${accounts.length} total`, c: C.gold },
      { l: "Monthly Rev", v: fmt(totCV / 12, settings.currency), s: `ACV ${fmt(totCV, settings.currency)}`, c: C.gold },
      { l: "Receivables", v: fmt(totPend, settings.currency), s: `${collectionRate.toFixed(0)}% collected`, c: totPend > 0 ? C.yellow : C.green },
      { l: "Staff", v: `${totDep}/${totReq}`, s: totDep < totReq ? `${totReq - totDep} shortfall` : "Fully staffed", c: totDep < totReq ? C.yellow : C.green },
      { l: "DSO", v: `${avgDSO.toFixed(0)}d`, s: avgDSO < 45 ? "Healthy" : "Review needed", c: avgDSO < 45 ? C.green : C.yellow },
      ].map((x, i) => <div key={i} style={{ background: C.panel, border: `1px solid ${C.border}`, padding: 14 }}><div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>{x.l}</div><div style={{ fontSize: 24, fontWeight: 700, color: x.c }}>{x.v}</div><div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{x.s}</div></div>)}
    </div>
    {(renSoon > 0 || compGaps > 0 || aging.over90 > 0) && <div style={{ ...Sec, borderColor: "#7f5a08", marginBottom: 16 }}><div style={{ ...SecT, color: C.yellow, borderColor: "#7f5a08" }}>⚠ ALERTS</div>
      {renSoon > 0 && <div style={{ color: C.yellow, fontSize: 12, marginBottom: 4 }}>• {renSoon} contract(s) within {settings.alertThresholds.renewalDays}d window</div>}
      {compGaps > 0 && <div style={{ color: C.red, fontSize: 12, marginBottom: 4 }}>• {compGaps} account(s) with compliance gaps</div>}
      {aging.over90 > 0 && <div style={{ color: C.red, fontSize: 12 }}>• {fmt(aging.over90, settings.currency)} overdue 90+ days</div>}
    </div>}
    <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
      <input style={{ ...I, width: 200, flexShrink: 0 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      {["All", ...settings.healthStatuses.map(h => h.key), ...settings.accountStatuses].map(f => <button key={f} style={navB(filter === f)} onClick={() => setFilter(f)}>{f}</button>)}
      <div style={{ flex: 1 }} />
      <button style={sBtnS("s")} onClick={exportCSV}>📥 CSV</button>
      <button style={sBtnS("s")} onClick={() => loadAll()}>🔄</button>
      <button style={btnS("p")} onClick={() => { setFD(mkEmpty()); setEditMode(false); setShowForm(true) }}>+ NEW ACCOUNT</button>
    </div>
    <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>
      {["Client", "Health", "Contract", "Staff", "Pending", "Renewal", "Compliance"].map(h => <th key={h} style={Th}>{h}</th>)}
    </tr></thead><tbody>
      {filt.map(a => { const d = daysTo(a.contract_end); const sr = totalStaff(a.staff_breakdown, "required"); const sd = totalStaff(a.staff_breakdown, "deployed"); const compOk = Object.values(a.compliance_status || {}).every(Boolean);
        return <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => { setSelId(a.id); setView("detail") }} onMouseEnter={e => e.currentTarget.style.background = "#1a2418"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <td style={Td}><div style={{ fontWeight: 700 }}>{a.client}</div><div style={{ fontSize: 10, color: C.dim }}>{a.account_id} · {a.location}</div></td>
          <td style={Td}><span style={dotS(hCol(a.health, settings.healthStatuses))} />{a.health}</td>
          <td style={{ ...Td, color: C.gold, fontWeight: 600 }}>{fmt(Number(a.contract_value), settings.currency)}/yr</td>
          <td style={Td}><span style={{ color: sd < sr ? C.yellow : C.green }}>{sd}</span><span style={{ color: C.dim }}>/{sr}</span></td>
          <td style={{ ...Td, color: Number(a.pending_amount) > 0 ? C.yellow : C.green }}>{fmt(Number(a.pending_amount), settings.currency)}</td>
          <td style={Td}><span style={pillS(d <= 30 ? C.red : d <= settings.alertThresholds.renewalDays ? C.yellow : C.green)}>{d}d</span>{a.renewal_status && a.renewal_status !== "Pending" && <span style={{ ...pillS(C.blue), marginLeft: 4 }}>{a.renewal_status}</span>}</td>
          <td style={Td}><span style={pillS(compOk ? C.green : C.red)}>{compOk ? "OK" : "GAPS"}</span></td>
        </tr> })}
      {filt.length === 0 && <tr><td colSpan={7} style={{ ...Td, textAlign: "center", color: C.dim, padding: 40 }}>No accounts</td></tr>}
    </tbody></table></div>
  </>);

  // ═══ DETAIL ═══
  const Detail = () => {
    if (!sel) return null; const a = sel; const d = daysTo(a.contract_end); const sr = totalStaff(a.staff_breakdown, "required"); const sd = totalStaff(a.staff_breakdown, "deployed");
    return (<>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <button style={btnS("g")} onClick={() => { setView("dashboard"); setSelId(null) }}>← BACK</button>
        <div><div style={{ fontSize: 16, fontWeight: 700, color: C.gold, letterSpacing: 2 }}>{a.client}</div><div style={{ fontSize: 11, color: C.muted }}>{a.account_id} · {a.location} · {a.service_type}</div></div>
        <div style={{ flex: 1 }} />
        {settings.healthStatuses.map(h => <button key={h.key} style={{ ...navB(a.health === h.key), fontSize: 10, padding: "4px 10px" }} onClick={() => updAcc(a.id, { health: h.key })}><span style={dotS(h.color)} />{h.key}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
        <div style={Sec}><div style={SecT}>CONTRACT</div>
          {[["Value", fmt(Number(a.contract_value), settings.currency) + "/yr"], ["Monthly", fmt(Number(a.contract_value) / 12, settings.currency)], ["Billing", a.billing_cycle], ["Terms", a.payment_terms + "d"], ["Period", `${fmtDate(a.contract_start)} → ${fmtDate(a.contract_end)}`], ["Status", a.status]].map(([l, v]) => <div key={l} style={dRow}><span style={{ color: C.muted, fontSize: 11 }}>{l}</span><span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{v}</span></div>)}
          <div style={{ marginTop: 10, fontSize: 11, color: C.gold, letterSpacing: 2 }}>RENEWAL</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
            <span style={pillS(d <= 30 ? C.red : d <= settings.alertThresholds.renewalDays ? C.yellow : C.green)}>{d} DAYS</span>
            <select style={{ ...Sel, width: 140 }} value={a.renewal_status || ""} onChange={e => updAcc(a.id, { renewal_status: e.target.value })}>
              {(settings.renewalStatuses || []).map(s => <option key={s}>{s}</option>)}
            </select>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 10, color: C.muted }}>REV%</span><input style={{ ...I, width: 60 }} type="number" value={a.rate_revision || 0} onChange={e => updAcc(a.id, { rate_revision: Number(e.target.value) })} /></div>
          </div>
          {Number(a.rate_revision) > 0 && <div style={{ fontSize: 11, color: C.blue, marginTop: 6 }}>Revised: {fmt(Number(a.contract_value) * (1 + Number(a.rate_revision) / 100), settings.currency)}/yr</div>}
        </div>
        <div style={Sec}><div style={SecT}>COLLECTION HEALTH</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div style={{ background: C.bg, padding: 10, textAlign: "center" }}><div style={{ fontSize: 10, color: C.muted }}>RECEIVABLE</div><div style={{ fontSize: 22, fontWeight: 700, color: Number(a.pending_amount) > 0 ? C.yellow : C.green }}>{fmt(Number(a.pending_amount), settings.currency)}</div></div>
            <div style={{ background: C.bg, padding: 10, textAlign: "center" }}><div style={{ fontSize: 10, color: C.muted }}>COLLECTED</div><div style={{ fontSize: 22, fontWeight: 700, color: C.green }}>{fmt((a._payments || []).reduce((s, p) => s + Number(p.amount), 0), settings.currency)}</div></div>
          </div>
          <PayInput onRecord={(am, ref, note) => recordPay(a.id, am, ref, note)} />
          {a._payments?.length > 0 && <div style={{ marginTop: 10, maxHeight: 140, overflowY: "auto" }}>
            <div style={{ fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 6 }}>PAYMENT HISTORY</div>
            {a._payments.map((p, i) => <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, padding: "4px 0", borderBottom: `1px solid ${C.bg}` }}>
              <span style={{ color: C.muted, width: 80 }}>{fmtDate(p.payment_date)}</span>
              <span style={{ color: C.green, fontWeight: 700, width: 70 }}>{fmt(Number(p.amount), settings.currency)}</span>
              <span style={{ color: C.dim }}>{p.reference}</span>
              <span style={{ color: C.dim, flex: 1 }}>{p.note}</span>
            </div>)}
          </div>}
        </div>
      </div>
      <div style={Sec}><div style={SecT}>👥 STAFF DEPLOYMENT — BY ROLE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 10 }}>
          {settings.staffRoles.map(r => { const v = a.staff_breakdown?.[r.key] || { required: 0, deployed: 0 };
            return <div key={r.key} style={{ background: C.bg, padding: 10 }}>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>{r.label.toUpperCase()}</div>
              <div style={{ display: "flex", gap: 8 }}><div><div style={{ fontSize: 9, color: C.dim }}>REQ</div><div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{v.required}</div></div><div><div style={{ fontSize: 9, color: C.dim }}>DEP</div><div style={{ fontSize: 20, fontWeight: 700, color: v.deployed >= v.required ? C.green : C.yellow }}>{v.deployed}</div></div></div>
              <div style={{ height: 4, background: "#1a2418", borderRadius: 2, marginTop: 6, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(100, v.required > 0 ? (v.deployed / v.required) * 100 : 100)}%`, background: v.deployed >= v.required ? C.green : C.yellow, borderRadius: 2 }} /></div>
            </div> })}
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}><span>Total: <span style={{ color: sd >= sr ? C.green : C.yellow, fontWeight: 700 }}>{sd}</span><span style={{ color: C.dim }}>/{sr}</span></span>{sr - sd > 0 && <span style={{ color: C.red }}>Shortfall: {sr - sd}</span>}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={Sec}><div style={SecT}>COMPLIANCE</div>
          {settings.complianceItems.map(ci => <div key={ci.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.bg}` }}>
            <span style={dotS(a.compliance_status?.[ci.key] ? C.green : C.red)} /><span style={{ flex: 1, fontSize: 12 }}>{ci.label}</span><span style={pillS(a.compliance_status?.[ci.key] ? C.green : C.red)}>{a.compliance_status?.[ci.key] ? "VALID" : "PENDING"}</span>
          </div>)}
        </div>
        <div style={Sec}><div style={SecT}>📎 DOCUMENTS (Supabase Storage)</div>
          <DocUpload docs={a._documents || []} onUpload={f => uploadDoc(a.id, f)} onRemove={(did, sp) => rmDoc(did, sp)} />
        </div>
      </div>
      <div style={Sec}><div style={SecT}>NOTES & CONTACTS</div>
        <div style={{ fontSize: 12, color: C.soft, marginBottom: 10, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{a.notes || "—"}</div>
        {(a.contacts || []).map((ct, i) => <div key={i} style={{ display: "flex", gap: 14, fontSize: 12, color: C.muted, padding: "3px 0" }}><span style={{ color: C.gold }}>{ct.role}</span><span>{ct.name}</span><span>{ct.phone}</span></div>)}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button style={btnS("p")} onClick={() => { setFD({ ...a }); setEditMode(true); setShowForm(true) }}>EDIT</button>
        <button style={btnS("d")} onClick={() => { if (confirm("Delete?")) delAcc(a.id) }}>DELETE</button>
      </div>
    </>);
  };

  // ═══ SETTINGS ═══
  const Settings = () => (<div>
    <div style={{ display: "flex", gap: 4, marginBottom: 18, flexWrap: "wrap" }}>
      {[["general", "General"], ["services", "Services"], ["compliance", "Compliance"], ["health", "Health & Status"], ["staff", "Staff Roles"], ["alerts", "Alerts"], ["billing", "Billing"], ["fields", "Custom Fields"], ["data", "Data"]].map(([k, l]) => <button key={k} style={navB(sTab === k)} onClick={() => setSTab(k)}>{l}</button>)}
    </div>
    {sTab === "general" && <div style={Sec}><div style={SecT}>BRANDING</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div><label style={Lbl}>Company Name</label><input style={I} value={settings.companyName} onChange={e => uS({ companyName: e.target.value })} /></div>
        <div><label style={Lbl}>Tagline</label><input style={I} value={settings.tagline} onChange={e => uS({ tagline: e.target.value })} /></div>
        <div><label style={Lbl}>Currency Symbol</label><input style={{ ...I, width: 80 }} value={settings.currency.symbol} onChange={e => uS({ currency: { ...settings.currency, symbol: e.target.value } })} /></div>
        <div><label style={Lbl}>Locale</label><input style={I} value={settings.currency.locale} onChange={e => uS({ currency: { ...settings.currency, locale: e.target.value } })} /></div>
      </div>
    </div>}
    {sTab === "services" && <div style={Sec}><div style={SecT}>SERVICE TYPES</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {settings.serviceTypes.map((t, i) => <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1a2418", border: `1px solid ${C.border}`, padding: "4px 10px", fontSize: 11, color: C.text }}>
          <InlineEdit value={t} onChange={v => { const u = [...settings.serviceTypes]; u[i] = v; uS({ serviceTypes: u }) }} style={{ fontSize: 11, color: C.text }} />
          <span style={{ color: C.red, cursor: "pointer", fontWeight: 700 }} onClick={() => uS({ serviceTypes: settings.serviceTypes.filter((_, j) => j !== i) })}>×</span>
        </div>)}
      </div>
      <button style={sBtnS("s")} onClick={() => uS({ serviceTypes: [...settings.serviceTypes, "New Service"] })}>+ ADD</button>
    </div>}
    {sTab === "compliance" && <div style={Sec}><div style={SecT}>COMPLIANCE ITEMS</div>
      {settings.complianceItems.map((item, i) => <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <input style={{ ...I, width: 120 }} value={item.key} onChange={e => { const u = [...settings.complianceItems]; u[i] = { ...u[i], key: e.target.value.replace(/\s/g, "") }; uS({ complianceItems: u }) }} />
        <input style={{ ...I, flex: 1 }} value={item.label} onChange={e => { const u = [...settings.complianceItems]; u[i] = { ...u[i], label: e.target.value }; uS({ complianceItems: u }) }} />
        <span style={{ color: C.red, cursor: "pointer", fontWeight: 700 }} onClick={() => uS({ complianceItems: settings.complianceItems.filter((_, j) => j !== i) })}>×</span>
      </div>)}
      <button style={sBtnS("s")} onClick={() => uS({ complianceItems: [...settings.complianceItems, { key: `c${Date.now()}`, label: "New Item" }] })}>+ ADD</button>
    </div>}
    {sTab === "health" && <div style={Sec}><div style={SecT}>HEALTH STATUSES</div>
      {settings.healthStatuses.map((h, i) => <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <input style={{ ...I, width: 80 }} value={h.key} onChange={e => { const u = [...settings.healthStatuses]; u[i] = { ...u[i], key: e.target.value }; uS({ healthStatuses: u }) }} />
        <input type="color" style={{ width: 40, height: 32, padding: 2, background: C.panel, border: `1px solid ${C.border}`, cursor: "pointer" }} value={h.color} onChange={e => { const u = [...settings.healthStatuses]; u[i] = { ...u[i], color: e.target.value }; uS({ healthStatuses: u }) }} />
        <input style={{ ...I, flex: 1 }} value={h.meaning} onChange={e => { const u = [...settings.healthStatuses]; u[i] = { ...u[i], meaning: e.target.value }; uS({ healthStatuses: u }) }} />
        <span style={{ color: C.red, cursor: "pointer", fontWeight: 700 }} onClick={() => uS({ healthStatuses: settings.healthStatuses.filter((_, j) => j !== i) })}>×</span>
      </div>)}
      <button style={sBtnS("s")} onClick={() => uS({ healthStatuses: [...settings.healthStatuses, { key: "New", color: "#888", meaning: "" }] })}>+ ADD</button>
      <div style={{ ...SecT, marginTop: 20 }}>ACCOUNT STATUSES</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {settings.accountStatuses.map((s, i) => <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1a2418", border: `1px solid ${C.border}`, padding: "4px 10px", fontSize: 11 }}>
          <InlineEdit value={s} onChange={v => { const u = [...settings.accountStatuses]; u[i] = v; uS({ accountStatuses: u }) }} style={{ fontSize: 11, color: C.text }} />
          <span style={{ color: C.red, cursor: "pointer", fontWeight: 700 }} onClick={() => uS({ accountStatuses: settings.accountStatuses.filter((_, j) => j !== i) })}>×</span>
        </div>)}
      </div>
      <button style={sBtnS("s")} onClick={() => uS({ accountStatuses: [...settings.accountStatuses, "New"] })}>+ ADD</button>
      <div style={{ ...SecT, marginTop: 20 }}>RENEWAL STATUSES</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {(settings.renewalStatuses || []).map((s, i) => <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1a2418", border: `1px solid ${C.border}`, padding: "4px 10px", fontSize: 11 }}>
          <InlineEdit value={s} onChange={v => { const u = [...(settings.renewalStatuses || [])]; u[i] = v; uS({ renewalStatuses: u }) }} style={{ fontSize: 11, color: C.text }} />
          <span style={{ color: C.red, cursor: "pointer", fontWeight: 700 }} onClick={() => uS({ renewalStatuses: (settings.renewalStatuses || []).filter((_, j) => j !== i) })}>×</span>
        </div>)}
      </div>
      <button style={sBtnS("s")} onClick={() => uS({ renewalStatuses: [...(settings.renewalStatuses || []), "New"] })}>+ ADD</button>
    </div>}
    {sTab === "staff" && <div style={Sec}><div style={SecT}>STAFF ROLES</div>
      <p style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Each role becomes a required/deployed pair per account.</p>
      {settings.staffRoles.map((r, i) => <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <input style={{ ...I, width: 120 }} value={r.key} placeholder="key" onChange={e => { const u = [...settings.staffRoles]; u[i] = { ...u[i], key: e.target.value.replace(/\s/g, "") }; uS({ staffRoles: u }) }} />
        <input style={{ ...I, flex: 1 }} value={r.label} placeholder="Label" onChange={e => { const u = [...settings.staffRoles]; u[i] = { ...u[i], label: e.target.value }; uS({ staffRoles: u }) }} />
        <span style={{ color: C.red, cursor: "pointer", fontWeight: 700 }} onClick={() => uS({ staffRoles: settings.staffRoles.filter((_, j) => j !== i) })}>×</span>
      </div>)}
      <button style={sBtnS("s")} onClick={() => uS({ staffRoles: [...settings.staffRoles, { key: `role${Date.now()}`, label: "New Role" }] })}>+ ADD ROLE</button>
    </div>}
    {sTab === "alerts" && <div style={Sec}><div style={SecT}>ALERT THRESHOLDS</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <div><label style={Lbl}>Renewal Warning (days)</label><input style={I} type="number" value={settings.alertThresholds.renewalDays} onChange={e => uS({ alertThresholds: { ...settings.alertThresholds, renewalDays: Number(e.target.value) } })} /></div>
        <div><label style={Lbl}>Overdue Alert (days)</label><input style={I} type="number" value={settings.alertThresholds.overduePaymentDays} onChange={e => uS({ alertThresholds: { ...settings.alertThresholds, overduePaymentDays: Number(e.target.value) } })} /></div>
        <div><label style={Lbl}>Staff Shortfall (%)</label><input style={I} type="number" value={settings.alertThresholds.staffShortfallPct} onChange={e => uS({ alertThresholds: { ...settings.alertThresholds, staffShortfallPct: Number(e.target.value) } })} /></div>
      </div>
    </div>}
    {sTab === "billing" && <div style={Sec}><div style={SecT}>BILLING DEFAULTS</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div><label style={Lbl}>Invoice Day</label><input style={I} type="number" min={1} max={28} value={settings.invoiceDayDefault} onChange={e => uS({ invoiceDayDefault: Number(e.target.value) })} /></div>
        <div><label style={Lbl}>Default Payment Terms</label><select style={Sel} value={settings.defaultPaymentTerms} onChange={e => uS({ defaultPaymentTerms: Number(e.target.value) })}>{settings.paymentTermsPresets.map(d => <option key={d} value={d}>{d}d</option>)}</select></div>
        <div><label style={Lbl}>Default Billing Cycle</label><select style={Sel} value={settings.defaultBillingCycle} onChange={e => uS({ defaultBillingCycle: e.target.value })}>{settings.billingCycles.map(b => <option key={b}>{b}</option>)}</select></div>
      </div>
    </div>}
    {sTab === "fields" && <div style={Sec}><div style={SecT}>CUSTOM FIELDS</div>
      {settings.customFields.map((f, i) => <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <input style={{ ...I, flex: 1 }} value={f.label} placeholder="Label" onChange={e => { const u = [...settings.customFields]; u[i] = { ...u[i], label: e.target.value }; uS({ customFields: u }) }} />
        <select style={{ ...Sel, width: 100 }} value={f.type} onChange={e => { const u = [...settings.customFields]; u[i] = { ...u[i], type: e.target.value }; uS({ customFields: u }) }}>
          <option value="text">Text</option><option value="number">Number</option><option value="toggle">Yes/No</option><option value="date">Date</option>
        </select>
        <span style={{ color: C.red, cursor: "pointer", fontWeight: 700 }} onClick={() => uS({ customFields: settings.customFields.filter((_, j) => j !== i) })}>×</span>
      </div>)}
      <button style={sBtnS("s")} onClick={() => uS({ customFields: [...settings.customFields, { key: `cf_${Date.now()}`, label: "", type: "text" }] })}>+ ADD FIELD</button>
    </div>}
    {sTab === "data" && <div style={Sec}><div style={SecT}>DATA — SUPABASE BACKEND</div>
      <div style={{ fontSize: 11, color: C.soft, marginBottom: 12, lineHeight: 1.6 }}>
        Connected to <span style={{ color: C.gold }}>iqccddabidfcrsbdehiq.supabase.co</span> (Mumbai ap-south-1)<br />
        Tables: accounts, account_payments, account_documents, account_settings<br />
        Storage: account-docs bucket (5MB limit)
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={btnS("s")} onClick={exportCSV}>📥 EXPORT CSV</button>
        <button style={btnS("s")} onClick={() => loadAll()}>🔄 REFRESH DATA</button>
      </div>
    </div>}
  </div>);

  // ═══ FORM ═══
  const Form = () => {
    if (!formData) return null;
    return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 20, overflowY: "auto" }} onClick={() => setShowForm(false)}>
      <div style={{ background: C.dark, border: `2px solid ${C.gold}`, width: "94%", maxWidth: 720, padding: 22, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, letterSpacing: 2, marginBottom: 14 }}>{editMode ? "EDIT" : "NEW"} ACCOUNT</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={Lbl}>Client</label><input style={I} value={formData.client} onChange={e => setFD({ ...formData, client: e.target.value })} /></div>
          <div><label style={Lbl}>Location</label><input style={I} value={formData.location || ""} onChange={e => setFD({ ...formData, location: e.target.value })} /></div>
          <div><label style={Lbl}>Service Type</label><select style={Sel} value={formData.service_type} onChange={e => setFD({ ...formData, service_type: e.target.value })}>{settings.serviceTypes.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label style={Lbl}>Contract Value ({settings.currency.symbol}/yr)</label><input style={I} type="number" value={formData.contract_value} onChange={e => setFD({ ...formData, contract_value: Number(e.target.value) })} /></div>
          <div><label style={Lbl}>Start</label><input style={I} type="date" value={formData.contract_start || ""} onChange={e => setFD({ ...formData, contract_start: e.target.value })} /></div>
          <div><label style={Lbl}>End</label><input style={I} type="date" value={formData.contract_end || ""} onChange={e => setFD({ ...formData, contract_end: e.target.value })} /></div>
          <div><label style={Lbl}>Billing</label><select style={Sel} value={formData.billing_cycle} onChange={e => setFD({ ...formData, billing_cycle: e.target.value })}>{settings.billingCycles.map(b => <option key={b}>{b}</option>)}</select></div>
          <div><label style={Lbl}>Payment Terms</label><select style={Sel} value={formData.payment_terms} onChange={e => setFD({ ...formData, payment_terms: Number(e.target.value) })}>{settings.paymentTermsPresets.map(d => <option key={d} value={d}>{d}d</option>)}</select></div>
          <div><label style={Lbl}>Status</label><select style={Sel} value={formData.status} onChange={e => setFD({ ...formData, status: e.target.value })}>{settings.accountStatuses.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label style={Lbl}>Health</label><select style={Sel} value={formData.health} onChange={e => setFD({ ...formData, health: e.target.value })}>{settings.healthStatuses.map(h => <option key={h.key} value={h.key}>{h.key}</option>)}</select></div>
          <div><label style={Lbl}>Pending ({settings.currency.symbol})</label><input style={I} type="number" value={formData.pending_amount} onChange={e => setFD({ ...formData, pending_amount: Number(e.target.value) })} /></div>
          <div><label style={Lbl}>Renewal Status</label><select style={Sel} value={formData.renewal_status || ""} onChange={e => setFD({ ...formData, renewal_status: e.target.value })}>{(settings.renewalStatuses || []).map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        {/* Staff Breakdown */}
        <div style={{ marginTop: 14 }}>
          <label style={{ ...Lbl, marginBottom: 8 }}>👥 STAFF BREAKDOWN BY ROLE</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>
            {settings.staffRoles.map(r => { const v = formData.staff_breakdown?.[r.key] || { required: 0, deployed: 0 };
              return <div key={r.key} style={{ background: C.bg, padding: 10, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.gold, letterSpacing: 1, marginBottom: 6 }}>{r.label.toUpperCase()}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div><label style={{ fontSize: 9, color: C.dim }}>Required</label><input style={I} type="number" min={0} value={v.required} onChange={e => setFD({ ...formData, staff_breakdown: { ...formData.staff_breakdown, [r.key]: { ...v, required: Number(e.target.value) } } })} /></div>
                  <div><label style={{ fontSize: 9, color: C.dim }}>Deployed</label><input style={I} type="number" min={0} value={v.deployed} onChange={e => setFD({ ...formData, staff_breakdown: { ...formData.staff_breakdown, [r.key]: { ...v, deployed: Number(e.target.value) } } })} /></div>
                </div>
              </div> })}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Total: {totalStaff(formData.staff_breakdown, "required")} required · {totalStaff(formData.staff_breakdown, "deployed")} deployed</div>
        </div>
        <div style={{ marginTop: 12 }}><label style={Lbl}>Compliance</label>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 4 }}>
            {settings.complianceItems.map(ci => <label key={ci.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.soft, cursor: "pointer" }}>
              <input type="checkbox" checked={formData.compliance_status?.[ci.key] || false} onChange={e => setFD({ ...formData, compliance_status: { ...formData.compliance_status, [ci.key]: e.target.checked } })} />{ci.label}
            </label>)}
          </div>
        </div>
        <div style={{ marginTop: 12 }}><label style={Lbl}>Notes</label><textarea style={{ ...I, height: 50, resize: "vertical" }} value={formData.notes || ""} onChange={e => setFD({ ...formData, notes: e.target.value })} /></div>
        <div style={{ marginTop: 12 }}><label style={Lbl}>Primary Contact</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <input style={I} placeholder="Name" value={formData.contacts?.[0]?.name || ""} onChange={e => setFD({ ...formData, contacts: [{ ...(formData.contacts?.[0] || {}), name: e.target.value }] })} />
            <input style={I} placeholder="Phone" value={formData.contacts?.[0]?.phone || ""} onChange={e => setFD({ ...formData, contacts: [{ ...(formData.contacts?.[0] || {}), phone: e.target.value }] })} />
            <input style={I} placeholder="Role" value={formData.contacts?.[0]?.role || ""} onChange={e => setFD({ ...formData, contacts: [{ ...(formData.contacts?.[0] || {}), role: e.target.value }] })} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button style={btnS("p")} onClick={saveAcc} disabled={syncing}>{syncing ? "SAVING..." : editMode ? "UPDATE" : "CREATE"}</button>
          <button style={btnS("g")} onClick={() => setShowForm(false)}>CANCEL</button>
        </div>
      </div>
    </div>
  };

  return (<div style={{ background: C.bg, minHeight: "100vh", fontFamily: font, color: C.text }}>
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} *::-webkit-scrollbar{width:5px;height:5px} *::-webkit-scrollbar-track{background:${C.bg}} *::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px} *::-webkit-scrollbar-thumb:hover{background:${C.gold}} input[type=color]{padding:2px;height:32px;cursor:pointer}`}</style>
    <div style={{ background: "linear-gradient(180deg,#1a2418 0%,#0f1a0d 100%)", borderBottom: `2px solid ${C.gold}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 6 }}>
      <div><div style={{ fontSize: 16, fontWeight: 700, color: C.gold, letterSpacing: 3 }}>{settings.companyName} ACCOUNTS</div>{settings.showBranding && <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2 }}>{settings.tagline}</div>}</div>
      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
        {syncing && <span style={{ fontSize: 10, color: C.yellow, animation: "pulse 1s infinite" }}>SYNCING...</span>}
        {[["dashboard", "DASHBOARD"], ["analytics", "ANALYTICS"], ["settings", "⚙ SETTINGS"]].map(([k, l]) => <button key={k} style={navB(view === k || (view === "detail" && k === "dashboard"))} onClick={() => { setView(k); setSelId(null) }}>{l}</button>)}
        <span style={{ background: C.green, color: C.bg, padding: "2px 8px", fontSize: 9, fontWeight: 700, letterSpacing: 1, borderRadius: 2 }}>LIVE</span>
        <span style={{ background: C.gold, color: C.bg, padding: "2px 10px", fontSize: 10, fontWeight: 700, letterSpacing: 2, borderRadius: 2 }}>v3.0</span>
      </div>
    </div>
    <div style={{ padding: "18px 20px" }}>
{view === "dashboard" && Dashboard()}
{view === "detail" && Detail()}
{view === "analytics" && Analytics()}
{view === "settings" && Settings()}
    </div>
    {showForm && <Form />}
    {toast && <div style={{ position: "fixed", bottom: 20, right: 20, background: C.gold, color: C.bg, padding: "8px 18px", fontSize: 12, fontWeight: 700, letterSpacing: 1, fontFamily: font, zIndex: 300, borderRadius: 2 }}>{toast}</div>}
  </div>);
}
