import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HistoryTransfer } from "./HistoryTransfer";
import { serializeHistory } from "../services/historyTransfer";

function backupFile(text: string): File {
  const file = new File([text], "history.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: vi.fn().mockResolvedValue(text) });
  return file;
}

describe("HistoryTransfer", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reads JSON files, reports counts and allows selecting the same file again", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockReturnValue({ imported: 2, skipped: 1 });
    render(<HistoryTransfer sessions={[]} onImport={onImport} />);
    const input = screen.getByLabelText("Archivo de historial JSON");
    const text = serializeHistory([]);
    const file = backupFile(text);
    await user.upload(input, file);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Sesiones importadas: 2. Omitidas por identificador existente: 1.",
    );
    expect(onImport).toHaveBeenCalledWith(text);
    await user.upload(input, file);
    expect(onImport).toHaveBeenCalledTimes(2);
  });

  it("reports validation and persistence errors without a success message", async () => {
    const user = userEvent.setup();
    render(<HistoryTransfer sessions={[]} onImport={() => { throw new Error("Archivo inválido"); }} />);
    await user.upload(screen.getByLabelText("Archivo de historial JSON"), backupFile("{}"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Archivo inválido");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("reports file reading failures without attempting an import", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    const file = new File([""], "history.json", { type: "application/json" });
    Object.defineProperty(file, "text", {
      value: vi.fn().mockRejectedValue(new Error("No se pudo leer el archivo")),
    });
    render(<HistoryTransfer sessions={[]} onImport={onImport} />);
    await user.upload(screen.getByLabelText("Archivo de historial JSON"), file);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo leer el archivo");
    expect(onImport).not.toHaveBeenCalled();
  });

  it("downloads a versioned JSON backup and cleans up its temporary URL", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn((_blob: Blob) => "blob:test-history");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<HistoryTransfer sessions={[]} onImport={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Exportar historial" }));
    expect(click).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    const blob: Blob = createObjectURL.mock.calls[0][0];
    const contents = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(blob);
    });
    expect(JSON.parse(contents)).toMatchObject({
      format: "padel-performance-trainer-history", version: 1, sessions: [],
    });
    expect(screen.getByRole("status")).toHaveTextContent("preparada para descargar");
    expect(document.querySelector('a[download]')).not.toBeInTheDocument();
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-history"), {
      timeout: 2000,
    });
  });

  it("reports download preparation failures", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("URL", { createObjectURL: () => { throw new Error("Download unavailable"); } });
    render(<HistoryTransfer sessions={[]} onImport={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Exportar historial" }));
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo exportar");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
