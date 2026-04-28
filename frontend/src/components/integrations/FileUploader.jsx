import React, { useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function FileUploader({ onImported }) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [filename, setFilename] = useState("");

  const downloadTemplate = () => {
    const url = `${API}/orders-docs/template`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "uniroute-orders-template.csv";
    a.click();
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!/\.(csv|xlsx)$/i.test(file.name)) {
      toast.error("Please upload a .csv or .xlsx file");
      return;
    }
    setFilename(file.name);
    setBusy(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await axios.post(`${API}/orders-docs/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(r.data);
      toast.success(`Imported ${r.data.imported} of ${r.data.total_rows} rows`);
      onImported?.(r.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Upload failed");
    } finally { setBusy(false); }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="border border-neutral-200 bg-white" data-testid="file-uploader">
      <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
        <div>
          <div className="font-display font-medium text-xl text-neutral-950 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-neutral-700" /> Upload Excel / CSV
          </div>
          <div className="text-sm text-neutral-500 mt-0.5">
            Each row = one PO or SO linked to a shipment ID. Required columns: <span className="font-mono text-neutral-700">doc_type, doc_number, party, shipment_id</span>.
          </div>
        </div>
        <button
          onClick={downloadTemplate}
          data-testid="download-template-button"
          className="px-3 py-2 text-[11px] font-bold tracking-[0.18em] uppercase border bg-white text-neutral-700 border-neutral-200 hover:border-neutral-950 flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-3 h-3" /> Template
        </button>
      </div>

      <div className="p-6">
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          data-testid="drop-zone"
          className={`border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
            dragOver ? "border-neutral-950 bg-neutral-50" : "border-neutral-300 bg-[#FAFAFA] hover:border-neutral-500"
          }`}
        >
          <Upload className="w-7 h-7 text-neutral-500 mx-auto mb-3" />
          <div className="font-display font-medium text-neutral-950">
            {filename ? `Selected: ${filename}` : "Click or drag a CSV / XLSX file"}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Up to ~10 MB. Mock environment — no data leaves the demo.</div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            data-testid="file-input"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {busy && (
          <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Parsing &amp; validating rows…
          </div>
        )}

        {result && (
          <div className="mt-6" data-testid="upload-result">
            <div className="grid grid-cols-3 gap-px bg-neutral-200 border border-neutral-200 mb-4">
              <div className="bg-white p-4">
                <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Total rows</div>
                <div className="font-mono text-2xl text-neutral-950 mt-1">{result.total_rows}</div>
              </div>
              <div className="bg-white p-4">
                <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Imported</div>
                <div className="font-mono text-2xl text-emerald-700 mt-1">{result.imported}</div>
              </div>
              <div className="bg-white p-4">
                <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Errors</div>
                <div className="font-mono text-2xl text-red-700 mt-1">{result.errors}</div>
              </div>
            </div>

            <div className="border border-neutral-200 overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead className="bg-[#FAFAFA] border-b border-neutral-200">
                  <tr>
                    {["", "Type", "Doc number", "Party", "Shipment ID", "Value", "Status"].map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {result.preview.map((d, i) => (
                    <tr key={d.id} className={d.valid ? "" : "bg-red-50"}>
                      <td className="px-3 py-2">
                        {d.valid
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          : <AlertCircle className="w-4 h-4 text-red-600" />}
                      </td>
                      <td className="px-3 py-2 font-mono text-[12px]">{d.doc_type}</td>
                      <td className="px-3 py-2 font-mono text-[12px] text-neutral-950">{d.doc_number}</td>
                      <td className="px-3 py-2 text-[12px]">{d.party}</td>
                      <td className="px-3 py-2 font-mono text-[12px]">{d.shipment_id}</td>
                      <td className="px-3 py-2 font-mono text-[12px]">${(d.value_usd || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-[11px]">
                        {d.valid
                          ? <span className="text-emerald-700">imported</span>
                          : <span className="text-red-700">{d.error}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
