"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "./Mafunzo.css";
import { SetActiveTab } from "../../types/tabs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Muumini {
  id?: string;
  muumini_id?: number;
  muumini_namba?: string;
  majina?: string;
  tarehe?: string;
}

interface MafunzoRecord {
  id?: string;
  muumini_id: number;
  somo: string;
  tarehe: string;
  mwalimu?: string;
  ushauri?: string;
  huduma?: string;
  status: "pending" | "approved" | "ongoing";
}

interface ApprovalRecord {
  id?: string;
  muumini_id: number;
  majina?: string;
  title?: string;
  description?: string;
  status: "pending" | "approved";
  tarehe?: string;
  created_at?: string;
  requested_by?: string;
  department?: string;
}

interface MafunzoMuuminiProps {
  setActiveTab: SetActiveTab;
}

const tareheLeo = new Date().toISOString().split("T")[0];

export default function MafunzoMuumini({ setActiveTab }: MafunzoMuuminiProps) {
  const [searchNamba, setSearchNamba] = useState("");
  const [searchMajina, setSearchMajina] = useState("");
  const [wanaoanza, setWanaoanza] = useState<Muumini[]>([]);
  const [wanaoendelea, setWanaoendelea] = useState<Muumini[]>([]);
  const [pendingApproval, setPendingApproval] = useState<Muumini[]>([]);
  const [approvedList, setApprovedList] = useState<Muumini[]>([]);
  const [selected, setSelected] = useState<Muumini | null>(null);
  const [masomoYaliyofundishwa, setMasomoYaliyofundishwa] = useState<MafunzoRecord[]>([]);
  const [masomoYaLeo, setMasomoYaLeo] = useState<MafunzoRecord[]>([]);
  const [alreadyTaughtToday, setAlreadyTaughtToday] = useState<string[]>([]);
  const [totalTarget, setTotalTarget] = useState<number>(17);
  const [somoMoja, setSomoMoja] = useState("");
  const [ushauriLeo, setUshauriLeo] = useState("");
  const [hudumaLeo, setHudumaLeo] = useState("");
  const [mwalimuLeo, setMwalimuLeo] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setGroupTab] = useState<"wanaoanza" | "wanaoendelea" | "pending" | "approved" | "approvalPending">("wanaoanza");
  const [approvalList, setApprovalList] = useState<ApprovalRecord[]>([]);

  // Fetch waliokoka with search
  useEffect(() => {
    const timer = setTimeout(fetchAndCategorizeWaliokoka, 300);
    return () => clearTimeout(timer);
  }, [searchNamba, searchMajina]);

  useEffect(() => {
    fetchApprovalList();
  }, []);

  async function fetchAndCategorizeWaliokoka() {
    setLoadingList(true);
    setMessage("");
    try {
      const { data: wokovu, error: errorWokovu } = await supabase
        .from("wokovu")
        .select("*")
        .ilike("muumini_namba", `%${searchNamba}%`)
        .ilike("majina", `%${searchMajina}%`)
        .order("tarehe", { ascending: false });
      if (errorWokovu) throw errorWokovu;

      const { data: lessons, error: errorLessons } = await supabase
        .from("mafunzo")
        .select("*")
        .order("tarehe", { ascending: true });
      if (errorLessons) throw errorLessons;

      const lessonCounts: Record<number, number> = {};
      const statusMap: Record<number, "pending" | "approved" | "ongoing"> = {};

      for (const rec of lessons ?? []) {
        if (!rec.muumini_id) continue;
        if (rec.somo !== "Approval marker") lessonCounts[rec.muumini_id] = (lessonCounts[rec.muumini_id] ?? 0) + 1;
        if (!statusMap[rec.muumini_id]) statusMap[rec.muumini_id] = rec.status;
        else if (rec.status === "approved") statusMap[rec.muumini_id] = "approved";
        else if (rec.status === "pending" && statusMap[rec.muumini_id] !== "approved") statusMap[rec.muumini_id] = "pending";
      }

      const WANAOANZA: Muumini[] = [];
      const WANAOENDELEA: Muumini[] = [];
      const PENDING: Muumini[] = [];
      const APPROVED: Muumini[] = [];
      const TARGET = 17;

      for (const w of wokovu ?? []) {
        if (!w.muumini_id) continue;
        const count = lessonCounts[w.muumini_id] ?? 0;
        const status = statusMap[w.muumini_id] ?? "ongoing";

        if (status === "approved") APPROVED.push(w);
        else if (status === "pending" && count >= TARGET) PENDING.push(w);
        else if (count === 0) WANAOANZA.push(w);
        else if (count < TARGET) WANAOENDELEA.push(w);
        else PENDING.push(w);
      }

      setWanaoanza(WANAOANZA);
      setWanaoendelea(WANAOENDELEA);
      setPendingApproval(PENDING);
      setApprovedList(APPROVED);
    } catch (error) {
      console.error(error);
      setMessage("Hitilafu wakati wa ku-load waliokoka");
      setWanaoanza([]);
      setWanaoendelea([]);
      setPendingApproval([]);
      setApprovedList([]);
    } finally {
      setLoadingList(false);
    }
  }

 async function fetchApprovalList() {
  try {
    const { data, error } = await supabase
      .from("approval")
      .select(`*, muumini:wokovu!inner(muumini_id, majina)`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setApprovalList(data ?? []);
  } catch (error) {
    console.error("Error fetching approvals:", error);
  }
}


  async function openMafunzo(muu: Muumini) {
    if (!muu.muumini_id) return;
    setSelected(muu);
    setMasomoYaliyofundishwa([]);
    setMasomoYaLeo([]);
    setAlreadyTaughtToday([]);
    setSomoMoja("");
    setUshauriLeo("");
    setHudumaLeo("");
    setMwalimuLeo("");
    setProgress(0);
    setMessage("");
    setLoadingLessons(true);
    try {
      const { data, error } = await supabase
        .from("mafunzo")
        .select("*")
        .eq("muumini_id", muu.muumini_id)
        .order("tarehe", { ascending: true });
      if (error) throw error;

      const all = data ?? [];
      if (all.some((r) => r.status === "approved")) {
        setMessage("✅ Muumini tayari amepelekwa kwa approval");
        setSelected(null);
        return;
      }

      setMasomoYaliyofundishwa(all);
      const leo = all.filter((r) => r.tarehe === tareheLeo);
      setMasomoYaLeo(leo);
      setAlreadyTaughtToday(leo.map((r) => r.somo));

      const count = all.filter((r) => r.somo !== "Approval marker").length;
      setTotalTarget(17);
      setProgress(Math.min(100, Math.round((count / 17) * 100)));
      setMessage(count < 17 ? "⚠️ Huyu mtu bado yupo kwenye mafunzo" : "✅ Mafunzo yamemalizika, wasilisha kwa approval");
    } catch (error) {
      console.error(error);
      setMessage("Hitilafu wakati wa ku-load mafunzo");
    } finally {
      setLoadingLessons(false);
    }
  }

  async function submitSingleLesson() {
    if (!selected?.muumini_id || !somoMoja.trim()) return setMessage("Chagua muumini na andika somo");
    if (alreadyTaughtToday.includes(somoMoja.trim())) return setMessage("⚠️ Somo hili tayari limefundishwa leo");

    setSubmitting(true);
    try {
      const { error } = await supabase.from("mafunzo").insert({
        muumini_id: selected.muumini_id,
        somo: somoMoja.trim(),
        tarehe: tareheLeo,
        mwalimu: mwalimuLeo.trim(),
        ushauri: ushauriLeo.trim(),
        huduma: hudumaLeo.trim(),
        status: "pending",
      });
      if (error) throw error;

      setMessage(`✅ Somo "${somoMoja.trim()}" limehifadhiwa`);
      setSomoMoja("");
      await openMafunzo(selected);
    } catch (error) {
      console.error(error);
      setMessage("Hitilafu wakati wa kuhifadhi somo");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitForApproval() {
    if (!selected?.muumini_id || !selected?.majina) return;

    setSubmitting(true);
    try {
      await supabase.from("mafunzo").insert({
        muumini_id: selected.muumini_id,
        somo: "Approval marker",
        tarehe: tareheLeo,
        status: "approved",
        mwalimu: mwalimuLeo.trim(),
        ushauri: ushauriLeo.trim(),
        huduma: hudumaLeo.trim(),
      });

      await supabase.from("approval").insert({
  muumini_id: selected.muumini_id,
  title: "Muumini Approval",
  description: `Muumini ${selected.majina} amemaliza mafunzo`,
  status: "pending",
  tarehe: tareheLeo,
  created_at: new Date().toISOString(),
  requested_by: mwalimuLeo.trim(),
  majina: selected.majina,
  department: "Mafunzo",
});


      setMessage(`✅ ${selected.majina} amewasilishwa kwa approval`);
      setSelected(null);
      fetchAndCategorizeWaliokoka();
      fetchApprovalList();
      setActiveTab("home");
    } catch (error) {
      console.error(error);
      setMessage("Hitilafu wakati wa kuwasilisha kwa approval");
    } finally {
      setSubmitting(false);
    }
  }

  function renderMuuminiRows(list: Muumini[]) {
    if (loadingList) return <tr><td colSpan={5}>Inapakia...</td></tr>;
    if (list.length === 0) return <tr><td colSpan={5}>Hakuna waliokoka waliopatikana</td></tr>;
    return list.map((muu, i) => (
      <tr key={muu.id ?? i}>
        <td>{i + 1}</td>
        <td>{muu.muumini_namba}</td>
        <td>{muu.majina}</td>
        <td>{muu.tarehe}</td>
        <td><button onClick={() => openMafunzo(muu)}>Fungua</button></td>
      </tr>
    ));
  }

  function renderApprovalRows(list: ApprovalRecord[]) {
    if (list.length === 0) return <tr><td colSpan={5}>Hakuna approval pending</td></tr>;
    return list.map((app, i) => (
      <tr key={app.id ?? i}>
        <td>{i + 1}</td>
        <td>{(app as any).muumini?.majina ?? app.majina}</td>
        <td>{app.muumini_id}</td>
        <td>{app.tarehe}</td>
        <td>{app.status}</td>
      </tr>
    ));
  }

  return (
    <>
      <h2 className={styles.title}>Mafunzo ya Muumini</h2>

      <div className={styles.searchWrapper}>
        <input type="text" placeholder="Tafuta Namba" value={searchNamba} onChange={(e) => setSearchNamba(e.target.value)} className={styles.searchInput}/>
        <input type="text" placeholder="Tafuta Majina" value={searchMajina} onChange={(e) => setSearchMajina(e.target.value)} className={styles.searchInput}/>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tabBtn} ${activeTab === "wanaoanza" ? styles.activeTab : ""}`} onClick={() => setGroupTab("wanaoanza")}>Wanaanza ({wanaoanza.length})</button>
        <button className={`${styles.tabBtn} ${activeTab === "wanaoendelea" ? styles.activeTab : ""}`} onClick={() => setGroupTab("wanaoendelea")}>Wanaoendelea ({wanaoendelea.length})</button>
        <button className={`${styles.tabBtn} ${activeTab === "pending" ? styles.activeTab : ""}`} onClick={() => setGroupTab("pending")}>Pending Approval ({pendingApproval.length})</button>
        <button className={`${styles.tabBtn} ${activeTab === "approved" ? styles.activeTab : ""}`} onClick={() => setGroupTab("approved")}>Approved ({approvedList.length})</button>
        <button className={`${styles.tabBtn} ${activeTab === "approvalPending" ? styles.activeTab : ""}`} onClick={() => setGroupTab("approvalPending")}>Approval Pending ({approvalList.filter(a => a.status === "pending").length})</button>
      </div>

      {message && <p className={styles.message}>{message}</p>}

      {activeTab !== "approvalPending" ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Namba</th>
              <th>Majina</th>
              <th>Tarehe ya Wokovu</th>
              <th>Kitendo</th>
            </tr>
          </thead>
          <tbody>
            {activeTab === "wanaoanza" && renderMuuminiRows(wanaoanza)}
            {activeTab === "wanaoendelea" && renderMuuminiRows(wanaoendelea)}
            {activeTab === "pending" && renderMuuminiRows(pendingApproval)}
            {activeTab === "approved" && renderMuuminiRows(approvedList)}
          </tbody>
        </table>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Majina</th>
              <th>ID</th>
              <th>Tarehe</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {renderApprovalRows(approvalList.filter(a => a.status === "pending"))}
          </tbody>
        </table>
      )}

      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelected(null)} aria-label="Close modal">✖</button>
            <h3>{selected.majina}</h3>
            <p><strong>Namba:</strong> {selected.muumini_namba}</p>
            <p><strong>Tarehe ya Wokovu:</strong> {selected.tarehe}</p>

            <div className={styles.lessonHistory}>
              <h4>📖 Masomo Yaliyopita</h4>
              {loadingLessons ? <p>Inapakia masomo...</p> :
                masomoYaliyofundishwa.length === 0 ? <p>Hakuna somo lililofundishwa bado</p> :
                  <ul>{masomoYaliyofundishwa.map((m, i) => <li key={i}>{m.tarehe} - {m.somo}</li>)}</ul>
              }
            </div>

            <div className={styles.lessonForm}>
              <h4>Endelea Kufundisha</h4>
              <input type="text" placeholder="Somo jipya" value={somoMoja} onChange={(e) => setSomoMoja(e.target.value)} disabled={progress === 100 || submitting} />
              <input type="text" placeholder="Jina la Mwalimu" value={mwalimuLeo} onChange={(e) => setMwalimuLeo(e.target.value)} disabled={submitting} />
              <input type="text" placeholder="Ushauri" value={ushauriLeo} onChange={(e) => setUshauriLeo(e.target.value)} disabled={submitting} />
              <input type="text" placeholder="Huduma" value={hudumaLeo} onChange={(e) => setHudumaLeo(e.target.value)} disabled={submitting} />
              <button onClick={submitSingleLesson} disabled={submitting || progress === 100 || !somoMoja.trim()} className={styles.saveBtn}>💾 Hifadhi Somo</button>
            </div>

            <div className={styles.progressWrapper}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}></div>
              <p>{masomoYaliyofundishwa.filter((r) => r.somo !== "Approval marker").length}/{totalTarget} Masomo</p>
            </div>

            {progress === 100 && (
              <div className={styles.approvalSection}>
                <p>
                  <strong>Muumini:</strong> {selected?.majina} <br />
                  <strong>Namba:</strong> {selected?.muumini_namba}
                </p>
                <button 
                  onClick={submitForApproval} 
                  disabled={submitting} 
                  className={styles.approvalBtn}
                >
                  📨 Wasilisha {selected?.majina} kwa Approval
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
