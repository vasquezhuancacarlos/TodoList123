import { useState, useEffect, useCallback, useRef } from "react";

//Configuración base
const API = "/api";

//Cache simple en memoria
const cache = new Map();
const CACHE_TTL = 30_000; // 30 segundos

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key, data) { cache.set(key, { data, ts: Date.now() }); }
function cacheInvalidate(prefix) {
  for (const k of cache.keys()) { if (k.startsWith(prefix)) cache.delete(k); }
}

// Hook useTasks
function useTasks() {
  const [tasks, setTasks]         = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]     = useState(false);
  const [filter, setFilter]       = useState("all"); // all | pending | done

  const fetchTasks = useCallback(async (page = 1) => {
    const completedParam =
      filter === "pending" ? "&completed=false" :
      filter === "done"    ? "&completed=true"  : "";
    const key = `tasks:${page}:${filter}`;

    const cached = cacheGet(key);
    if (cached) {
      setTasks(cached.data);
      setPagination(cached.pagination);
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(`${API}/tasks?page=${page}&limit=5${completedParam}`);
      const json = await r.json();
      setTasks(json.data);
      setPagination({ ...json.pagination });
      cacheSet(key, { data: json.data, pagination: json.pagination });
    } catch { /* network error */ }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchTasks(1); }, [fetchTasks]);

  const goToPage = (p) => fetchTasks(p);

  const toggleTask = async (id) => {
    try {
      await fetch(`${API}/tasks/${id}/toggle`, { method: "PATCH" });
      cacheInvalidate("tasks:");
      fetchTasks(pagination.currentPage);
    } catch {}
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
      cacheInvalidate("tasks:");
      fetchTasks(pagination.currentPage);
    } catch {}
  };

  const createTask = async (title) => {
    try {
      await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      cacheInvalidate("tasks:");
      fetchTasks(1);
    } catch {}
  };

  return { tasks, pagination, loading, filter, setFilter, goToPage, toggleTask, deleteTask, createTask };
}

//Hook useDrive
function useDrive() {
  const [files, setFiles]       = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [uploadState, setUploadState]   = useState(null);
  // uploadState: null | { status:'conflict', existingFile, tempName, pendingFile }

  const fetchFiles = useCallback(async () => {
    setDriveLoading(true);
    try {
      const r    = await fetch(`${API}/drive`);
      const json = await r.json();
      setFiles(json.data || []);
    } catch {}
    finally { setDriveLoading(false); }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const uploadFile = async (file, replace = false, tempName = null) => {
    const form = new FormData();
    if (replace && tempName) {
      // Re-enviar indicando reemplazo confirmado — necesitamos el mismo binario
      form.append("file", file);
      form.append("replace", "true");
    } else {
      form.append("file", file);
    }

    setDriveLoading(true);
    try {
      const r    = await fetch(`${API}/drive/upload`, { method: "POST", body: form });
      const json = await r.json();

      if (r.status === 409) {
        // Conflicto: archivo duplicado
        setUploadState({ status: "conflict", existingFile: json.existingFile, tempName: json.tempName, pendingFile: file });
      } else {
        setUploadState(null);
        fetchFiles();
      }
    } catch {}
    finally { setDriveLoading(false); }
  };

  const confirmReplace = async () => {
    if (!uploadState) return;
    await uploadFile(uploadState.pendingFile, true, uploadState.tempName);
  };

  const cancelReplace = async () => {
    if (!uploadState?.tempName) return;
    try {
      await fetch(`${API}/drive/cancel-replace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempName: uploadState.tempName })
      });
    } catch {}
    setUploadState(null);
  };

  const downloadFile = (id, name) => {
    const a   = document.createElement("a");
    a.href    = `${API}/drive/${id}/download`;
    a.download = name;
    a.click();
  };

  const deleteFile = async (id) => {
    try {
      await fetch(`${API}/drive/${id}`, { method: "DELETE" });
      fetchFiles();
    } catch {}
  };

  return { files, driveLoading, uploadState, uploadFile, confirmReplace, cancelReplace, downloadFile, deleteFile };
}

// Helpers UI
function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "justo ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function Badge({ completed }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 1,
      background: completed ? "#d1fae5" : "#fef3c7",
      color:      completed ? "#065f46" : "#92400e"
    }}>
      {completed ? "✓ LISTO" : "● PENDIENTE"}
    </span>
  );
}

//Modal de conflicto
function ConflictModal({ uploadState, onConfirm, onCancel }) {
  if (!uploadState || uploadState.status !== "conflict") return null;
  const { existingFile } = uploadState;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#1e1e2e", borderRadius: 16, padding: "32px 36px",
        maxWidth: 440, width: "90%", border: "1px solid #3b3b5c",
        boxShadow: "0 24px 60px rgba(0,0,0,.6)"
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ margin: "0 0 8px", color: "#f5c542", fontFamily: "'DM Serif Display', serif", fontSize: 22 }}>
          Archivo duplicado
        </h3>
        <p style={{ color: "#a0a0c0", fontSize: 14, margin: "0 0 16px", lineHeight: 1.6 }}>
          Ya existe <strong style={{ color: "#e2e2f0" }}>"{existingFile?.originalName}"</strong> subido{" "}
          <strong style={{ color: "#e2e2f0" }}>{timeAgo(existingFile?.updatedAt)}</strong>{" "}
          ({formatBytes(existingFile?.size || 0)}).
        </p>
        <p style={{ color: "#a0a0c0", fontSize: 13, margin: "0 0 24px" }}>
          ¿Quieres reemplazarlo con el nuevo archivo o cancelar la subida?
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
            background: "#f5c542", color: "#1a1a2e", fontWeight: 700, cursor: "pointer", fontSize: 14
          }}>
            Reemplazar
          </button>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #3b3b5c",
            background: "transparent", color: "#a0a0c0", fontWeight: 600, cursor: "pointer", fontSize: 14
          }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

//Sección: Task List
function TaskSection() {
  const { tasks, pagination, loading, filter, setFilter, goToPage, toggleTask, deleteTask, createTask } = useTasks();
  const [newTitle, setNewTitle] = useState("");
  const [hovered, setHovered]  = useState(null);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createTask(newTitle.trim());
    setNewTitle("");
  };

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#e2e2f0" }}>
          Tareas
        </h2>
        <span style={{ fontSize: 12, color: "#6b6b8a", background: "#2a2a3e", padding: "4px 12px", borderRadius: 20 }}>
          {pagination.total} total
        </span>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "pending", "done"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "5px 16px", borderRadius: 20, border: "1px solid",
            borderColor: filter === f ? "#7c7cff" : "#3b3b5c",
            background: filter === f ? "#7c7cff22" : "transparent",
            color: filter === f ? "#a0a0ff" : "#6b6b8a",
            cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all .15s"
          }}>
            {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : "Listas"}
          </button>
        ))}
      </div>

      {/* Crear tarea */}
      <form onSubmit={handleCreate} style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Nueva tarea..."
          style={{
            flex: 1, padding: "10px 16px", borderRadius: 10,
            border: "1px solid #3b3b5c", background: "#2a2a3e",
            color: "#e2e2f0", fontSize: 14, outline: "none"
          }}
        />
        <button type="submit" style={{
          padding: "10px 20px", borderRadius: 10, border: "none",
          background: "#7c7cff", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14
        }}>
          + Añadir
        </button>
      </form>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#6b6b8a", padding: 40 }}>Cargando...</div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6b6b8a", padding: 40, fontSize: 14 }}>
          Sin tareas en este filtro
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {tasks.map(task => (
            <li key={task._id}
              onMouseEnter={() => setHovered(task._id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: "#2a2a3e", borderRadius: 12,
                border: `1px solid ${hovered === task._id ? "#7c7cff44" : "#3b3b5c"}`,
                padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
                transition: "border-color .15s"
              }}>

              {/* Toggle checkbox */}
              <button onClick={() => toggleTask(task._id)} title="PATCH toggle" style={{
                width: 24, height: 24, borderRadius: 6, border: "2px solid",
                borderColor: task.completed ? "#34d399" : "#4b4b6b",
                background: task.completed ? "#34d39922" : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 14, color: "#34d399", transition: "all .15s"
              }}>
                {task.completed ? "✓" : ""}
              </button>

              {/* Contenido */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: 15, color: task.completed ? "#6b6b8a" : "#e2e2f0",
                  textDecoration: task.completed ? "line-through" : "none",
                  display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {task.title}
                </span>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
                  <Badge completed={task.completed} />
                  <a
                    href={`${API}/tasks/${task._id}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Ver en API"
                    style={{ fontSize: 11, color: "#7c7cff", textDecoration: "none", opacity: .7 }}
                  >
                    🔗 /api/tasks/{task._id.slice(-6)}
                  </a>
                  <span style={{ fontSize: 11, color: "#6b6b8a" }}>{timeAgo(task.createdAt)}</span>
                </div>
              </div>

              {/* Eliminar */}
              {hovered === task._id && (
                <button onClick={() => deleteTask(task._id)} style={{
                  background: "#ff4d4d22", border: "1px solid #ff4d4d44",
                  color: "#ff7070", borderRadius: 8, padding: "4px 10px",
                  cursor: "pointer", fontSize: 12, fontWeight: 600
                }}>
                  Eliminar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 24 }}>
          <button
            onClick={() => goToPage(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid #3b3b5c",
              background: "transparent", color: pagination.hasPrevPage ? "#a0a0ff" : "#3b3b5c",
              cursor: pagination.hasPrevPage ? "pointer" : "default", fontSize: 13
            }}>
            ← Anterior
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => goToPage(p)} style={{
              width: 34, height: 34, borderRadius: 8, border: "1px solid",
              borderColor: p === pagination.currentPage ? "#7c7cff" : "#3b3b5c",
              background: p === pagination.currentPage ? "#7c7cff22" : "transparent",
              color: p === pagination.currentPage ? "#a0a0ff" : "#6b6b8a",
              cursor: "pointer", fontSize: 13, fontWeight: p === pagination.currentPage ? 700 : 400
            }}>
              {p}
            </button>
          ))}
          <button
            onClick={() => goToPage(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid #3b3b5c",
              background: "transparent", color: pagination.hasNextPage ? "#a0a0ff" : "#3b3b5c",
              cursor: pagination.hasNextPage ? "pointer" : "default", fontSize: 13
            }}>
            Siguiente →
          </button>
        </div>
      )}
    </section>
  );
}

//Sección: Drive
function DriveSection() {
  const { files, driveLoading, uploadState, uploadFile, confirmReplace, cancelReplace, downloadFile, deleteFile } = useDrive();
  const inputRef    = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [hovered, setHovered]   = useState(null);

  const handleFiles = (fileList) => {
    const file = fileList[0];
    if (file) uploadFile(file);
  };

  const iconFor = (mime) => {
    if (mime?.startsWith("image/"))       return "🖼️";
    if (mime?.includes("pdf"))            return "📄";
    if (mime?.includes("zip") || mime?.includes("rar")) return "🗜️";
    if (mime?.includes("spreadsheet") || mime?.includes("excel")) return "📊";
    if (mime?.includes("word"))           return "📝";
    if (mime?.includes("video"))          return "🎬";
    if (mime?.includes("audio"))          return "🎵";
    return "📁";
  };

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#e2e2f0" }}>
          Drive
        </h2>
        <span style={{ fontSize: 12, color: "#6b6b8a", background: "#2a2a3e", padding: "4px 12px", borderRadius: 20 }}>
          {files.length} archivo{files.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "#7c7cff" : "#3b3b5c"}`,
          borderRadius: 14, padding: "28px 20px", textAlign: "center",
          cursor: "pointer", marginBottom: 24,
          background: dragOver ? "#7c7cff0a" : "#2a2a3e22",
          transition: "all .2s"
        }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>☁️</div>
        <p style={{ margin: 0, color: "#a0a0c0", fontSize: 14 }}>
          Arrastra un archivo o <span style={{ color: "#7c7cff", fontWeight: 600 }}>haz clic para elegir</span>
        </p>
        <p style={{ margin: "4px 0 0", color: "#6b6b8a", fontSize: 12 }}>Máx 50 MB</p>
        <input ref={inputRef} type="file" hidden onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Lista de archivos */}
      {driveLoading && !uploadState ? (
        <div style={{ textAlign: "center", color: "#6b6b8a", padding: 30 }}>Cargando...</div>
      ) : files.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6b6b8a", padding: 30, fontSize: 14 }}>
          Sin archivos aún
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {files.map(f => (
            <li key={f._id}
              onMouseEnter={() => setHovered(f._id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: "#2a2a3e", borderRadius: 12,
                border: `1px solid ${hovered === f._id ? "#7c7cff44" : "#3b3b5c"}`,
                padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                transition: "border-color .15s"
              }}>

              <span style={{ fontSize: 24, flexShrink: 0 }}>{iconFor(f.mimeType)}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: 14, color: "#e2e2f0", display: "block",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {f.originalName}
                </span>
                <div style={{ display: "flex", gap: 12, marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: "#6b6b8a" }}>{formatBytes(f.size)}</span>
                  <span style={{ fontSize: 11, color: "#6b6b8a" }}>{f.mimeType}</span>
                  <span style={{ fontSize: 11, color: "#6b6b8a" }}>{timeAgo(f.createdAt)}</span>
                  {f.replaceCount > 0 && (
                    <span style={{ fontSize: 11, color: "#f5c542" }}>↻ v{f.replaceCount + 1}</span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => downloadFile(f._id, f.originalName)}
                  title="Descargar"
                  style={{
                    padding: "5px 12px", borderRadius: 8, border: "1px solid #3b5c3b",
                    background: "#34d39911", color: "#34d399",
                    cursor: "pointer", fontSize: 12, fontWeight: 600
                  }}>
                  ↓ Bajar
                </button>
                {hovered === f._id && (
                  <button
                    onClick={() => deleteFile(f._id)}
                    style={{
                      padding: "5px 12px", borderRadius: 8, border: "1px solid #ff4d4d44",
                      background: "#ff4d4d11", color: "#ff7070",
                      cursor: "pointer", fontSize: 12, fontWeight: 600
                    }}>
                    Eliminar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal conflicto */}
      <ConflictModal
        uploadState={uploadState}
        onConfirm={confirmReplace}
        onCancel={cancelReplace}
      />
    </section>
  );
}

//App principal
export default function App() {
  const [tab, setTab] = useState("tasks");

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #13131f; font-family: 'DM Sans', sans-serif; color: #e2e2f0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1e1e2e; }
        ::-webkit-scrollbar-thumb { background: #3b3b5c; border-radius: 3px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#13131f" }}>
        {/* Header */}
        <header style={{
          background: "#1e1e2e", borderBottom: "1px solid #2a2a3e",
          padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🗂️</span>
            <h1 style={{
              margin: 0, fontFamily: "'DM Serif Display', serif",
              fontSize: 22, color: "#e2e2f0", fontWeight: 400
            }}>
              TodoList <span style={{ color: "#7c7cff" }}>+</span> Drive
            </h1>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { id: "tasks", label: "📋 Tareas" },
              { id: "drive", label: "☁️ Drive"  }
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                padding: "8px 20px", borderRadius: 10, border: "1px solid",
                borderColor: tab === id ? "#7c7cff" : "#3b3b5c",
                background: tab === id ? "#7c7cff22" : "transparent",
                color: tab === id ? "#a0a0ff" : "#6b6b8a",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600, fontSize: 14, transition: "all .15s"
              }}>
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* Contenido */}
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "36px 24px" }}>
          {tab === "tasks" ? <TaskSection /> : <DriveSection />}
        </main>
      </div>
    </>
  );
}