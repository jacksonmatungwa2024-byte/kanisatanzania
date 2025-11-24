"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import styles from "../components/Media.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Announcement = {
  id: number;
  receiver_name: string;
  receiver_role: string;
  title: string;
  description?: string;
  media_url?: string;
  created_at?: string;
  status?: string;
  scheduled_for?: string;
  approved_by?: string;
  viewed?: boolean;
  viewed_at?: string;
  sender_branch?: string;
};

export default function MediaPanel() {
  const [matangazo, setMatangazo] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newAlert, setNewAlert] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const currentMediaName = "Media Team";

  useEffect(() => {
    fetchMatangazo();
    cleanupOldAnnouncements();

    const subscription = supabase
      .channel("pastor-announcements-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pastor_announcements" },
        () => {
          setNewAlert(true);
          fetchMatangazo();
        }
      )
      .subscribe();

    const interval = setInterval(cleanupOldAnnouncements, 60 * 60 * 1000);

    return () => {
      supabase.removeChannel(subscription);
      clearInterval(interval);
    };
  }, []);

  async function cleanupOldAnnouncements() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("pastor_announcements")
      .delete()
      .lt("created_at", cutoff);
    if (error) console.error("Auto-cleanup error:", error);
  }

  async function fetchMatangazo() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pastor_announcements")
        .select("*")
        .eq("receiver_name", currentMediaName)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMatangazo(data ?? []);
    } catch (err) {
      console.error("Error fetching matangazo:", err);
      setError("Imeshindikana kupakia matangazo.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAnnouncement(id: number) {
    const confirmDelete = window.confirm("⚠️ Unahakikisha unataka kufuta tangazo hili?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("pastor_announcements")
      .delete()
      .eq("id", id);
    if (error) console.error("Error deleting announcement:", error);
    else console.log("✅ Tangazo limefutwa.");
    setMatangazo((prev) => prev.filter((m) => m.id !== id));
  }

  function openFileViewer(urls: string[], id: number) {
    setSelectedFiles(urls);
    setSelectedId(id);
    setHasDownloaded(false);
  }

  function closeFileViewer() {
    if (!selectedId) return;

    // If not downloaded, warn user before deletion
    if (!hasDownloaded) {
      const confirmSkip = window.confirm(
        "⚠️ Hujadownload faili hili. Ukifunga sasa, litafutika. Unataka kufuta bila kudownload?"
      );
      if (confirmSkip) {
        deleteAnnouncement(selectedId);
      }
    } else {
      // Already downloaded → delete immediately
      deleteAnnouncement(selectedId);
    }

    setSelectedFiles([]);
    setSelectedId(null);
    setHasDownloaded(false);
  }

  const isSupportedFile = (url: string) =>
    /\.(pdf|jpg|jpeg|png|gif|docx?|pptx?|xlsx?|txt)$/i.test(url);

  function getFileNameFromUrl(url: string) {
    try {
      return decodeURIComponent(url.split("/").pop() || "faili");
    } catch {
      return "faili";
    }
  }

  async function downloadFile(url: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = getFileNameFromUrl(url);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setHasDownloaded(true);

      // Delete announcement immediately after download
      if (selectedId) {
        await deleteAnnouncement(selectedId);
        closeFileViewer();
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  }

  if (loading) return <p>⏳ Inapakia matangazo...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🎥 Matangazo ya {currentMediaName}</h2>
        {newAlert && <span className={styles.bell}>🔔 Tangazo Jipya!</span>}
      </div>

      {matangazo.length === 0 ? (
        <p>📭 Hakuna matangazo kwa sasa.</p>
      ) : (
        <div className={styles.list}>
          {matangazo.map((m) => {
            const fileList =
              m.media_url?.split(",").map((f) => f.trim()).filter(Boolean) || [];

            return (
              <div key={m.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>{m.title}</h3>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => deleteAnnouncement(m.id)}
                  >
                    🗑️ Futa
                  </button>
                </div>

                <p>{m.description || "—"}</p>

                {fileList.length > 0 && (
                  <div className={styles.fileList}>
                    {fileList.map((file, index) => (
                      <div key={index} className={styles.fileActions}>
                        <button
                          className={styles.viewBtn}
                          onClick={() => openFileViewer([file], m.id)}
                        >
                          📂 Fungua Faili {index + 1}
                        </button>
                        <button
                          className={styles.downloadBtn}
                          onClick={() => downloadFile(file)}
                        >
                          ⬇️ Pakua
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.footer}>
                  <span>
                    🕒{" "}
                    {m.created_at
                      ? new Date(m.created_at).toLocaleString()
                      : "—"}
                  </span>
                  {m.sender_branch && (
                    <span>🏠 Kutoka: {m.sender_branch}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className={styles.viewerOverlay} onClick={closeFileViewer}>
          <div
            className={styles.viewerModal}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.closeBtn} onClick={closeFileViewer}>
              ✖ Funga
            </button>

            {selectedFiles.every(isSupportedFile) ? (
              <DocViewer
                documents={selectedFiles.map((uri) => ({ uri }))}
                pluginRenderers={DocViewerRenderers}
                style={{ height: "80vh", borderRadius: "8px" }}
                config={{ header: { disableHeader: true } }}
              />
            ) : (
              <div className={styles.fallback}>
                <p>⚠️ Baadhi ya faili hayawezi kufunguliwa moja kwa moja.</p>
                {selectedFiles.map((file, i) => (
                  <div key={i} className={styles.fileActions}>
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkBtn}
                    >
                      📂 Fungua Faili {i + 1}
                    </a>
                    <button
                      className={styles.downloadBtn}
                      onClick={() => downloadFile(file)}
                    >
                      ⬇️ Pakua
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
