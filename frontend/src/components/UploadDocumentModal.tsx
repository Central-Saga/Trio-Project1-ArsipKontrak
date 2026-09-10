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
  secureMode: boolean;
}

export default function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  secureMode,
}: Props) {
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
            setFormData((prev) => ({
              ...prev,
              project_id: res.data[0].id.toString(),
            }));
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
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
    payload.append("secure_mode", secureMode ? "1" : "0");

    try {
      await api.post("/documents", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const response = (
        err as {
          response?: {
            data?: { message?: string; errors?: Record<string, string[]> };
          };
        }
      ).response;
      const firstValidationError = response?.data?.errors
        ? Object.values(response.data.errors)[0]?.[0]
        : undefined;
      const msg =
        response?.data?.message ||
        firstValidationError ||
        "Gagal mengunggah dokumen.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0b1f14]/90 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl shadow-[0_0_50px_rgba(4,47,27,0.5)] text-slate-100 w-full max-w-3xl max-h-[calc(100vh-2rem)] my-4 overflow-hidden flex flex-col">
        <div className="border-b border-emerald-500/10 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div>
            <h3 className="text-lg font-semibold tracking-wide">
              Unggah Dokumen Baru
            </h3>
            <p className="text-xs text-emerald-100">
              Lengkapi data arsip kontrak/MoU beserta berkas PDF terenkripsi
            </p>
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Pilih Project
              </label>
              <select
                name="project_id"
                required
                value={formData.project_id}
                onChange={handleChange}
                className="w-full rounded-xl border border-emerald-500/30 bg-[#07140c]/90 px-4 py-3 text-sm text-white shadow-inner transition focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Tipe Dokumen
              </label>
              <select
                name="document_type"
                value={formData.document_type}
                onChange={handleChange}
                className="w-full rounded-xl border border-emerald-500/30 bg-[#07140c]/90 px-4 py-3 text-sm text-white shadow-inner transition focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="contract">Contract</option>
                <option value="mou">MoU</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Nomor Dokumen
              </label>
              <input
                type="text"
                name="document_number"
                required
                placeholder="CTR/2026/IX/003"
                value={formData.document_number}
                onChange={handleChange}
                className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/80 shadow-sm focus:border-emerald-400 focus:ring-emerald-400 text-sm py-2 px-3 text-slate-100 placeholder:text-emerald-300/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Pihak Rekanan (Partner)
              </label>
              <input
                type="text"
                name="partner"
                required
                placeholder="PT Bonjaka Jaya"
                value={formData.partner}
                onChange={handleChange}
                className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/80 shadow-sm focus:border-emerald-400 focus:ring-emerald-400 text-sm py-2 px-3 text-slate-100 placeholder:text-emerald-300/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Nama Dokumen
            </label>
            <input
              type="text"
              name="document_name"
              required
              placeholder="Perjanjian Kerja Sama Penyediaan Layanan Infrastruktur"
              value={formData.document_name}
              onChange={handleChange}
              className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/80 shadow-sm focus:border-emerald-400 focus:ring-emerald-400 text-sm py-2 px-3 text-slate-100 placeholder:text-emerald-300/60"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Tanggal Dokumen
              </label>
              <input
                type="date"
                name="document_date"
                required
                value={formData.document_date}
                onChange={handleChange}
                className="w-full rounded-xl border border-emerald-500/30 bg-[#07140c]/90 px-4 py-3 text-sm text-white shadow-inner transition focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Tanggal Efektif
              </label>
              <input
                type="date"
                name="effective_date"
                required
                value={formData.effective_date}
                onChange={handleChange}
                className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/80 shadow-sm focus:border-emerald-400 focus:ring-emerald-400 text-sm py-2 px-3 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Tanggal Berakhir
              </label>
              <input
                type="date"
                name="expiry_date"
                required
                value={formData.expiry_date}
                onChange={handleChange}
                className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/80 shadow-sm focus:border-emerald-400 focus:ring-emerald-400 text-sm py-2 px-3 text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Berkas PDF Dokumen (Max 20MB)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-3 pb-4 border-2 border-emerald-500/20 border-dashed rounded-xl hover:border-emerald-400 transition-colors bg-[#07140c]/60">
              <div className="space-y-1 text-center">
                  <svg
                  className="mx-auto h-9 w-9 text-emerald-400/60"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-slate-300 justify-center">
                  <label className="relative cursor-pointer rounded-md font-medium text-emerald-300 hover:text-emerald-200 focus-within:outline-none">
                    <span>
                      {selectedFile ? selectedFile.name : "Unggah berkas"}
                    </span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf"
                      required={!selectedFile}
                      onChange={handleFileChange}
                    />
                  </label>
                  {!selectedFile && <p className="pl-1">atau seret ke sini</p>}
                </div>
                <p className="text-xs text-emerald-300/60">
                  PDF hingga 20MB (Terenkripsi Aman)
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Deskripsi / Ringkasan (Opsional)
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Catatan ruang lingkup atau klausul penting..."
              className="w-full rounded-xl border border-emerald-500/20 bg-[#07140c]/80 shadow-sm focus:border-emerald-400 focus:ring-emerald-400 text-sm py-2 px-3 text-slate-100 placeholder:text-emerald-300/60"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/20 text-emerald-300 rounded-xl text-sm font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/50 transition-all duration-300 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
            >
              {submitting
                ? "Mengunggah & Menghitung Hash..."
                : "Unggah & Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
