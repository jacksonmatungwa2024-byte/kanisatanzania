"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { SetActiveTab } from "@/types/tabs";
import styles from "./Reports.css";

interface ReportsDashboardProps {
  setActiveTab: SetActiveTab;
}

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Row = Record<string, any>;

export default function ReportsDashboard({ setActiveTab }: ReportsDashboardProps) {
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState({
    wokovu: 0,
    watu: 0,
    ushuhuda: 0,
    mafunzo: 0,
    mahadhurio: 0,
  });
  const [rows, setRows] = useState<{ [k: string]: Row[] }>({
    wokovu: [],
    watu: [],
    ushuhuda: [],
    mafunzo: [],
    mahadhurio: [],
  });
  const [mahadhurioGroups, setMahadhurioGroups] = useState<Row[]>([]);
  const [mahadhurioIbada, setMahadhurioIbada] = useState<Row[]>([]);
  const [autoRefreshOn, setAutoRefreshOn] = useState<boolean>(true);
  const refreshTimer = useRef<number | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadAll();
    if (autoRefreshOn) startAutoRefresh();
    return () => stopAutoRefresh();
  }, [date, autoRefreshOn]);

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer.current = window.setInterval(() => loadAll(), 2 * 60 * 1000);
  }

  function stopAutoRefresh() {
    if (refreshTimer.current) {
      window.clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    }
  }

  function getDateFilter(query: any, dateStr: string, field = "tarehe") {
    if (!dateStr) return query;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return query.eq(field, dateStr);
    } else if (/^\d{4}-\d{2}$/.test(dateStr) || /^\d{4}$/.test(dateStr)) {
      return query.like(field, `${dateStr}-%`);
    }
    return query;
  }

  function getDistinctByUser(data: Row[]) {
    return Array.from(new Map(data.map((d) => [d.muumini_namba ?? d.majina, d])).values());
  }

  async function loadAll() {
    setLoading(true);
    try {
      const newRows: typeof rows = {
        wokovu: [],
        watu: [],
        ushuhuda: [],
        mafunzo: [],
        mahadhurio: [],
      };

      // === Wokovu ===
      {
        let q = supabase.from("wokovu").select("*").order("tarehe", { ascending: false }).limit(1000);
        q = getDateFilter(q, date, "tarehe");
        const { data, error } = await q;
        if (error) throw error;
        newRows.wokovu = getDistinctByUser(data ?? []);
      }

      // === Watu ===
      {
        let q = supabase.from("watu").select("*").order("created_at", { ascending: false }).limit(1000);
        if (date) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            q = q.gte("created_at", `${date}T00:00:00`).lt("created_at", `${date}T23:59:59`);
          } else {
            q = q.like("created_at", `${date}-%`);
          }
        }
        const { data, error } = await q;
        if (error) throw error;
        newRows.watu = getDistinctByUser(data ?? []);
      }

      // === Ushuhuda ===
      {
        let q = supabase.from("ushuhuda").select("*").order("tarehe", { ascending: false }).limit(2000);
        q = getDateFilter(q, date, "tarehe");
        const { data, error } = await q;
        if (error) throw error;
        newRows.ushuhuda = getDistinctByUser(data ?? []);
      }

      // === Mafunzo ===
      {
        let q = supabase.from("mafunzo").select("*").order("tarehe", { ascending: false }).limit(3000);
        q = getDateFilter(q, date, "tarehe");
        const { data, error } = await q;
        if (error) throw error;
        newRows.mafunzo = getDistinctByUser(data ?? []);
      }

      // === Mahadhurio breakdown kwa group & ibada ===
      {
        let q = supabase.from("mahadhurio").select("jinsi, ibada, id, tarehe");
        q = getDateFilter(q, date, "tarehe");
        const { data, error } = await q;
        if (error) throw error;

        const allMahadhurio = data ?? [];

        const groupCounts: Record<string, number> = {
          "Watu Wazima": 0,
          "Watoto": 0,
          "Kijana": 0,
        };
        const ibadaCounts: Record<string, number> = {};
        let generalTotal = 0;

        const groupMap: Record<string, string> = {
          Me: "Watu Wazima",
          Ke: "Watu Wazima",
          Watoto: "Watoto",
          Kijana: "Kijana",
          "": "Haijatajwa",
          undefined: "Haijatajwa",
        };

        for (const row of allMahadhurio) {
          const group = groupMap[row.jinsi] || "Haijatajwa";
          if (groupCounts[group] !== undefined) groupCounts[group] += 1;

          const iba = row.ibada || "Haijatajwa";
          ibadaCounts[iba] = (ibadaCounts[iba] || 0) + 1;

          generalTotal += 1;
        }

        const groupData = Object.entries(groupCounts).map(([group, count]) => ({ group, count }));
        const ibadaData = Object.entries(ibadaCounts).map(([ibada, count]) => ({ ibada, count }));

        setMahadhurioGroups(groupData);
        setMahadhurioIbada(ibadaData);

        newRows.mahadhurio = allMahadhurio;

        setRows(newRows);
        setSummary({
          wokovu: newRows.wokovu.length,
          watu: newRows.watu.length,
          ushuhuda: newRows.ushuhuda.length,
          mafunzo: newRows.mafunzo.length,
          mahadhurio: generalTotal,
        });
      }
    } catch (err) {
      console.error("LoadAll error:", err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  }

  const maxGroup = Math.max(
    1,
    ...mahadhurioGroups.map((g) => g.count),
    1
  );
  const maxIbada = Math.max(
    1,
    ...mahadhurioIbada.map((i) => i.count),
    1
  );

  const MiniBar = ({ value, max = 100 }: { value: number; max?: number }) => {
    const pct = max === 0 ? 0 : Math.min(100, Math.round((value / Math.max(1, max)) * 100));
    const w = Math.max(20, Math.round((pct / 100) * 240));
    return (
      <svg width="260" height="20">
        <rect x={0} y={0} width={260} height={20} rx={10} fill="#efe9f6" />
        <rect x={0} y={0} width={w} height={20} rx={10} fill="#6a1b9a" />
        <text x={8} y={14} fontSize={12} fill="#fff" fontWeight={700}>
          {value}
        </text>
      </svg>
    );
  };

  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const newWin = window.open("", "_blank", "width=900,height=700");
    if (!newWin) return;

    newWin.document.write(`
      <html>
        <head>
          <title>Rhema Report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #3c1361; padding: 20px; background-color: #fff; }
            h2,h3,h4 { text-align: center; }
            svg { display: block; margin-top: 4px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    newWin.document.close();
    newWin.focus();
    newWin.print();
    newWin.close();
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h3 className={styles.title}>Reports Dashboard</h3>
        <div className={styles.controls}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={styles.input}
          />
          <button onClick={loadAll} className={styles.runBtn}>
            {loading ? "Loading..." : "Run"}
          </button>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={autoRefreshOn}
              onChange={(e) => setAutoRefreshOn(e.target.checked)}
            />
            Auto-refresh 2m
          </label>
        </div>
      </div>

      {/* Print / PDF content only */}
      <div ref={printRef}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img src="/rhema.jpg" alt="Rhema Logo" style={{ height: "80px" }} />
          <h2>Basi iqweni na akili mkeshe katika sala</h2>
          <p style={{ fontStyle: "italic" }}>1 Petro 4:7</p>
        </div>

        <h3>Summary</h3>
        {[
          { label: "Waliyookoka", value: summary.wokovu },
          { label: "Waliosajiliwa", value: summary.watu },
          { label: "Walioshuhudia", value: summary.ushuhuda },
          { label: "Mafunzo", value: summary.mafunzo },
          { label: "Mahadhurio (Jumla)", value: summary.mahadhurio },
        ].map((item) => (
          <div key={item.label} style={{ marginBottom: "8px" }}>
            <strong>{item.label}:</strong> {item.value}
          </div>
        ))}

        {/* Bar charts kwa Group */}
        {mahadhurioGroups.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h4>Mahadhurio kwa Group</h4>
            {mahadhurioGroups.map((r) => (
              <div key={r.group} style={{ marginBottom: "6px" }}>
                <strong>{r.group}:</strong> <MiniBar value={r.count} max={maxGroup} />
              </div>
            ))}
          </div>
        )}

        {/* Bar charts kwa Ibada/Sherehe */}
        {mahadhurioIbada.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h4>Mahadhurio kwa Ibada / Sherehe</h4>
            {mahadhurioIbada.map((r) => (
              <div key={r.ibada} style={{ marginBottom: "6px" }}>
                <strong>{r.ibada || "Haijatajwa"}:</strong> <MiniBar value={r.count} max={maxIbada} />
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <button onClick={handlePrint} style={{ padding: "10px 20px", fontWeight: 700 }}>
            Print / PDF
          </button>
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={() => setActiveTab && setActiveTab("home")} className={styles.backBtn}>
          Back
        </button>
      </div>
    </div>
  );
}
