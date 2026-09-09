"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface ProjectItem {
  id: number;
  project_name: string;
  project_code: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadDocumentModal({ isOpen, onClose, onSuccess }: Props) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    project_id: "",
    document_number: "",
    document_name: "",
    document_type: "contract",
    partner: "",
    document_date: "",
    effective_date: "",
    expiry_date: "",
    status: "draft",
    description: "",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchProjects = async () => {
        try {
          setLoadingProjects(true);
          const res = await api.get("/projects");
          setProjects(res.data);
          if (res.data.length > 0) {
            setFormData((prev) => ({ ...prev, project_id: res.data[0].id.toString() }));
          }
        } catch {
          // fallback jika fetch gagal
        } finally {
          setLoadingProjects(false);
        }
      };
      fetchProjects();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setErrorMsg("Format berkas arsip harus bertipe PDF.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setErrorMsg("Ukuran berkas PDF maksimal 20 MB.");
        return;
      }
      setErrorMsg("");
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Silakan pilih file PDF kontrak/MoU.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const payload = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      payload.append(key, val);
    });
    payload.append("file", selectedFile);

    try {
      await api.post("/documents", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response;
      const firstValidationError = response?.data?.errors ? Object.values(response.data.errors)[0]?.[0] : undefined;
      const msg = response?.data?.message || firstValidationError || "Gagal mengunggah dokumen.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[calc(100vh-2rem)] my-4 overflow-hidden border border-slate-800 flex flex-col">
        <div className="bg-emerald-800 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div>
            <h3 className="text-lg font-semibold tracking-wide">Unggah Dokumen Baru</h3>
            <p className="text-xs text-emerald-100">Lengkapi data arsip kontrak/MoU beserta berkas PDF terenkripsi</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="text-emerald-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-emerald-700/50 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-5 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Pilih Project</label>
              <select
                name="project_id"
                required
                value={formData.project_id}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2 px-3 text-slate-100"
              >
                {loadingProjects ? (
                  <option value="">Memuat project...</option>
                ) : (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.project_code}] {p.project_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Tipe Dokumen</label>
              <select
                name="document_type"
                value={formData.document_type}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2 px-3 text-slate-100"
              >
                <option value="contract">Contract</option>
                <option value="mou">MoU</option>
                <option value="adendum">Adendum</option>
                <option value="agreement">Agreement</option>
                <option value="supporting">Supporting</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nomor Dokumen</label>
              <input
                type="text"
                name="document_number"
                required
                placeholder="CTR/2026/IX/003"
                value={formData.document_number}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2 px-3 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Pihak Rekanan (Partner)</label>
              <input
                type="text"
                name="partner"
                required
                placeholder="PT Bonjaka Jaya"
                value={formData.partner}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2 px-3 text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nama Dokumen</label>
            <input
              type="text"
              name="document_name"
              required
              placeholder="Perjanjian Kerja Sama Penyediaan Layanan Infrastruktur"
              value={formData.document_name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2 px-3 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Tanggal Dokumen</label>
              <input
                type="date"
                name="document_date"
                required
                value={formData.document_date}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2 px-3 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Tanggal Efektif</label>
              <input
                type="date"
                name="effective_date"
                required
                value={formData.effective_date}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2 px-3 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Tanggal Berakhir</label>
              <input
                type="date"
                name="expiry_date"
                required
                value={formData.expiry_date}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2 px-3 text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Berkas PDF Dokumen (Max 20MB)</label>
            <div className="mt-1 flex justify-center px-6 pt-3 pb-4 border-2 border-slate-700 border-dashed rounded-xl hover:border-emerald-500 transition-colors bg-slate-800/40">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-9 w-9 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-slate-300 justify-center">
                  <label className="relative cursor-pointer rounded-md font-medium text-emerald-700 hover:text-emerald-800 focus-within:outline-none">
                    <span>{selectedFile ? selectedFile.name : "Unggah berkas"}</span>
                    <input type="file" className="sr-only" accept=".pdf" required={!selectedFile} onChange={handleFileChange} />
                  </label>
                  {!selectedFile && <p className="pl-1">atau seret ke sini</p>}
                </div>
                <p className="text-xs text-slate-500">PDF hingga 20MB (Terenkripsi Aman)</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Deskripsi / Ringkasan (Opsional)</label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Catatan ruang lingkup atau klausul penting..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2 px-3 text-slate-100 placeholder:text-slate-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-emerald-900/20 disabled:opacity-50"
            >
              {submitting ? "Mengunggah & Menghitung Hash..." : "Unggah & Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
