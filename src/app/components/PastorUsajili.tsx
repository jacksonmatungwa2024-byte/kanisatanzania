"use client"

import React, { useEffect, useState, useCallback } from "react"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import "./PastorUsajili.css"

// REMOVE unused static import of html2pdf
// import html2pdf from "html2pdf.js"

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

// ---------------- TYPES --------------------

type WatuRow = {
  id: number
  majina: string
  simu?: string | null
  jinsi: string
  umbo: string
  bahasha?: string | null
  muumini_namba?: string | null
  created_at?: string | null
  [key: string]: any
}

type MahadhurioRow = {
  id: number
  muumini_id?: number | null
  muumini_namba?: string | null
  majina?: string | null
  aina?: string | null
  ibada?: string | null
  tarehe?: string | null
  created_at?: string | null
  [key: string]: any
}

type ApprovalRow = {
  id: number
  muumini_id: string
  status?: string
  tarehe: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

type WokovuRow = {
  id: string
  muumini_id?: number | null
  muumini_namba?: string | null
  majina?: string | null
  tarehe?: string | null
  ushuhuda?: string | null
  sajili_na?: string | null
  created_at?: string | null
  [key: string]: any
}

// ----------------------------------------

export default function PastorUsajili() {
  const [active, setActive] =
    useState<"waliosajiliwa" | "mahadhurio" | "wachanga">("waliosajiliwa")
  const [wachangaSub, setWachangaSub] =
    useState<"approval" | "waliokoka">("approval")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const REFRESH_MS = 2 * 60 * 1000

  const [watu, setWatu] = useState<WatuRow[]>([])
  const [watuQuery, setWatuQuery] = useState("")
  const [watuPage, setWatuPage] = useState(1)
  const WATU_PAGE_SIZE = 50

  const [mahadhurio, setMahadhurio] = useState<MahadhurioRow[]>([])
  const [mhFilterRange, setMhFilterRange] =
    useState<"siku" | "wiki" | "mwezi">("siku")
  const [mhDate, setMhDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  )
  const [mhPage, setMhPage] = useState(1)
  const MH_PAGE_SIZE = 50

  const [approvals, setApprovals] = useState<ApprovalRow[]>([])
  const [approvalsPage, setApprovalsPage] = useState(1)
  const APPROVALS_PAGE_SIZE = 50

  const [wokovu, setWokovu] = useState<WokovuRow[]>([])
  const [wokovuPage, setWokovuPage] = useState(1)
  const WOKOVU_PAGE_SIZE = 50

  // ---------------- FETCH FUNCTIONS WITH useCallback --------------------

  const fetchWatu = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const offset = (watuPage - 1) * WATU_PAGE_SIZE

      let query = supabase
        .from("watu")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + WATU_PAGE_SIZE - 1)

      if (watuQuery.trim()) {
        const like = `%${watuQuery.trim()}%`
        query = supabase
          .from("watu")
          .select("*")
          .or(
            `majina.ilike.${like},muumini_namba.ilike.${like},simu.ilike.${like},bahasha.ilike.${like}`
          )
          .order("created_at", { ascending: false })
          .range(offset, offset + WATU_PAGE_SIZE - 1)
      }

      const { data, error } = await query
      if (error) throw error
      setWatu(data ?? [])
    } catch (err: any) {
      setError(err.message ?? String(err))
      setWatu([])
    } finally {
      setLoading(false)
    }
  }, [watuPage, watuQuery])

  const fetchMahadhurio = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const offset = (mhPage - 1) * MH_PAGE_SIZE
      const base = new Date(mhDate)

      let start = new Date(base)
      let end = new Date(base)

      if (mhFilterRange === "siku") {
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
      } else if (mhFilterRange === "wiki") {
        const day = base.getDay()
        const diff = (day + 6) % 7
        start = new Date(base)
        start.setDate(base.getDate() - diff)
        start.setHours(0, 0, 0, 0)

        end = new Date(start)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
      } else {
        start = new Date(base.getFullYear(), base.getMonth(), 1)
        end = new Date(base.getFullYear(), base.getMonth() + 1, 0)
        end.setHours(23, 59, 59, 999)
      }

      const startISO = start.toISOString().split("T")[0]
      const endISO = end.toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("mahadhurio")
        .select("*")
        .gte("tarehe", startISO)
        .lte("tarehe", endISO)
        .order("tarehe", { ascending: false })
        .range(offset, offset + MH_PAGE_SIZE - 1)

      if (error) throw error
      setMahadhurio(data ?? [])
    } catch (err: any) {
      setError(err.message ?? String(err))
      setMahadhurio([])
    } finally {
      setLoading(false)
    }
  }, [mhDate, mhFilterRange, mhPage])

  const fetchApprovals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const offset = (approvalsPage - 1) * APPROVALS_PAGE_SIZE
      const { data, error } = await supabase
        .from("mafunzo")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .range(offset, offset + APPROVALS_PAGE_SIZE - 1)

      if (error) throw error
      setApprovals(data ?? [])
    } catch (err: any) {
      setError(err.message ?? String(err))
      setApprovals([])
    } finally {
      setLoading(false)
    }
  }, [approvalsPage])

  const fetchWokovu = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const offset = (wokovuPage - 1) * WOKOVU_PAGE_SIZE
      const { data, error } = await supabase
        .from("wokovu")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + WOKOVU_PAGE_SIZE - 1)

      if (error) throw error
      setWokovu(data ?? [])
    } catch (err: any) {
      setError(err.message ?? String(err))
      setWokovu([])
    } finally {
      setLoading(false)
    }
  }, [wokovuPage])

  // ---------------- USE EFFECTS --------------------

  useEffect(() => {
    fetchWatu()
  }, [fetchWatu])

  useEffect(() => {
    fetchMahadhurio()
  }, [fetchMahadhurio])

  useEffect(() => {
    fetchApprovals()
    fetchWokovu()
  }, [fetchApprovals, fetchWokovu, wachangaSub])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      if (active === "waliosajiliwa") fetchWatu()
      if (active === "mahadhurio") fetchMahadhurio()
      if (active === "wachanga") {
        fetchApprovals()
        fetchWokovu()
      }
    }, REFRESH_MS)

    return () => clearInterval(interval)
  }, [
    autoRefresh,
    active,
    REFRESH_MS,
    fetchWatu,
    fetchMahadhurio,
    fetchApprovals,
    fetchWokovu,
  ])

  // ---------------- PRINT TABLE --------------------

  async function printTable(tableId: string) {
    if (typeof window === "undefined") return

    const table = document.getElementById(tableId)
    if (!table) {
      alert("Hakuna jedwali la kuchapisha")
      return
    }

    // Dynamic import to avoid unused import
    const html2pdf = (await import("html2pdf.js")).default

    const container = document.createElement("div")
    container.style.backgroundColor = "#0b1e3a"
    container.style.color = "#e0f2e9"
    container.style.padding = "20px"

    const tableClone = table.cloneNode(true) as HTMLElement

    const options = {
      margin: 10,
      filename: `${tableId}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    }

    html2pdf().set(options).from(tableClone).save()
  }

  // ---------------- CSV EXPORT --------------------

  function downloadCSV<T extends Record<string, any>>(
    rows: T[],
    filename = "export.csv"
  ) {
    if (!rows.length) {
      alert("Hakuna data ya kupakua")
      return
    }

    const keys = Array.from(
      rows.reduce((s, r) => {
        Object.keys(r).forEach((k) => s.add(k))
        return s
      }, new Set<string>())
    )

    const csv = [
      keys.join(","),
      ...rows.map((r) =>
        keys
          .map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  // ---------------- UI --------------------

  return (
    <>
      <div className="navbar">
        <button onClick={() => setActive("waliosajiliwa")}>Waliosajiliwa</button>
        <button onClick={() => setActive("mahadhurio")}>Mahadhurio</button>
        <button onClick={() => setActive("wachanga")}>Wachanga</button>
      </div>

      {error && <div>{error}</div>}
      {loading && <div>Loading...</div>}

      {/* --- WALIOSAJILIWA --- */}
      {active === "waliosajiliwa" && (
        <>
          <input
            placeholder="Tafuta..."
            value={watuQuery}
            onChange={(e) => setWatuQuery(e.target.value)}
          />
          <table id="table-waliosajiliwa">
            <thead>
              <tr>
                <th>Majina</th>
                <th>Simu</th>
                <th>Jinsi</th>
                <th>Umbo</th>
                <th>Bahasha</th>
                <th>Muumini Namba</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {watu.map((w) => (
                <tr key={w.id}>
                  <td>{w.majina}</td>
                  <td>{w.simu ?? "-"}</td>
                  <td>{w.jinsi}</td>
                  <td>{w.umbo}</td>
                  <td>{w.bahasha ?? "-"}</td>
                  <td>{w.muumini_namba ?? "-"}</td>
                  <td>{w.created_at ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={() => printTable("table-waliosajiliwa")}>
            Print PDF
          </button>
          <button onClick={() => downloadCSV(watu, "waliosajiliwa.csv")}>
            Download CSV
          </button>
        </>
      )}

      {/* --- MAHADHURIO --- */}
      {active === "mahadhurio" && (
        <>
          <div>
            <select
              value={mhFilterRange}
              onChange={(e) => setMhFilterRange(e.target.value as any)}
            >
              <option value="siku">Siku</option>
              <option value="wiki">Wiki</option>
              <option value="mwezi">Mwezi</option>
            </select>

            <input
              type="date"
              value={mhDate}
              onChange={(e) => setMhDate(e.target.value)}
            />
          </div>

          <table id="table-mahadhurio">
            <thead>
              <tr>
                <th>Tarehe</th>
                <th>Majina</th>
                <th>Aina</th>
                <th>Ibada</th>
              </tr>
            </thead>
            <tbody>
              {mahadhurio.map((mh) => (
                <tr key={mh.id}>
                  <td>{mh.tarehe ?? "-"}</td>
                  <td>{mh.majina ?? "-"}</td>
                  <td>{mh.aina ?? "-"}</td>
                  <td>{mh.ibada ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={() => printTable("table-mahadhurio")}>
            Print PDF
          </button>
          <button onClick={() => downloadCSV(mahadhurio, "mahadhurio.csv")}>
            Download CSV
          </button>
        </>
      )}

      {/* ---- WACHANGA ---- */}
      {active === "wachanga" && (
        <>
          <div>
            <button onClick={() => setWachangaSub("approval")}>Approvals</button>
            <button onClick={() => setWachangaSub("waliokoka")}>Waliokoka</button>
          </div>

          {wachangaSub === "approval" && (
            <>
              <table id="table-approval">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Muumini ID</th>
                    <th>Status</th>
                    <th>Tarehe</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((a) => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.muumini_id}</td>
                      <td>{a.status ?? "-"}</td>
                      <td>{a.tarehe}</td>
                      <td>{a.created_at ?? "-"}</td>
                      <td>{a.updated_at ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button onClick={() => printTable("table-approval")}>
                Print PDF
              </button>
              <button onClick={() => downloadCSV(approvals, "approvals.csv")}>
                Download CSV
              </button>
            </>
          )}

          {wachangaSub === "waliokoka" && (
            <>
              <table id="table-waliokoka">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Muumini ID</th>
                    <th>Muumini Namba</th>
                    <th>Majina</th>
                    <th>Tarehe</th>
                    <th<Ushuhuda</th>
                    <th>Sajili Na</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {wokovu.map((w) => (
                    <tr key={w.id}>
                      <td>{w.id}</td>
                      <td>{w.muumini_id ?? "-"}</td>
                      <td>{w.muumini_namba ?? "-"}</td>
                      <td>{w.majina ?? "-"}</td>
                      <td>{w.tarehe ?? "-"}</td>
                      <td>{w.ushuhuda ?? "-"}</td>
                      <td>{w.sajili_na ?? "-"}</td>
                      <td>{w.created_at ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button onClick={() => printTable("table-waliokoka")}>
                Print PDF
              </button>
              <button onClick={() => downloadCSV(wokovu, "waliokoka.csv")}>
                Download CSV
              </button>
            </>
          )}
        </>
      )}
    </>
  )
}
