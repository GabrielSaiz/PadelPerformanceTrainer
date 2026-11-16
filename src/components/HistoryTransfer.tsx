import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import type { WorkoutSession } from "../types/training";
import { serializeHistory, type HistoryImportResult } from "../services/historyTransfer";

interface HistoryTransferProps {
  sessions: WorkoutSession[];
  onImport: (text: string) => HistoryImportResult;
}

export function HistoryTransfer({ sessions, onImport }: HistoryTransferProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function exportHistory(): void {
    setMessage(null);
    setError(null);
    let url: string | undefined;
    const link = document.createElement("a");
    try {
      const backup = serializeHistory(sessions);
      url = URL.createObjectURL(new Blob([backup], { type: "application/json" }));
      link.href = url;
      link.download = `padel-history-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      setMessage("Copia del historial preparada para descargar.");
    } catch (exportError) {
      setError(exportError instanceof Error
        ? `No se pudo exportar el historial: ${exportError.message}`
        : "No se pudo exportar el historial.");
    } finally {
      link.remove();
      if (url) {
        const downloadUrl = url;
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      }
    }
  }

  async function importFile(file: File): Promise<void> {
    setMessage(null);
    setError(null);
    setIsImporting(true);
    try {
      const text = await file.text();
      const result = onImport(text);
      setMessage(
        `Sesiones importadas: ${result.imported}. Omitidas por identificador existente: ${result.skipped}.`,
      );
    } catch (importError) {
      setError(importError instanceof Error
        ? `No se pudo importar el historial: ${importError.message}`
        : "No se pudo leer o importar el archivo.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="history-transfer card-surface" aria-labelledby="history-transfer-title">
      <h2 id="history-transfer-title">Importar y exportar</h2>
      <p>
        Guarda una copia JSON de las sesiones completadas con sus series, cargas y notas.
        Al importar se combinan sin duplicar: se conserva la sesión local si el identificador
        ya existe. La sesión en curso no se modifica ni se exporta.
      </p>
      <div className="history-transfer-actions">
        <button className="button button-dark" type="button" onClick={exportHistory}>
          <Download size={16} aria-hidden="true" /> Exportar historial
        </button>
        <button
          className="button button-dark"
          type="button"
          disabled={isImporting}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={16} aria-hidden="true" />
          {isImporting ? "Importando…" : "Importar historial"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          aria-label="Archivo de historial JSON"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void importFile(file);
          }}
        />
      </div>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
