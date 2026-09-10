import { z } from "zod";

export const documentSchema = z.object({
  document_number: z.string().min(1, "Nomor dokumen wajib diisi"),
  document_name: z.string().min(1, "Nama dokumen wajib diisi"),
  document_type: z.enum(["Contract", "Mou"], {
    message: "Pilih Contract atau MoU",
  }),
  partner: z.string().min(1, "Nama rekanan wajib diisi"),
  document_date: z.string().min(1, "Tanggal dokumen wajib diisi"),
  effective_date: z.string().min(1, "Tanggal efektif wajib diisi"),
  expiry_date: z.string().min(1, "Tanggal kedaluwarsa wajib diisi"),
  status: z.enum(["draft", "active", "expired", "terminated"]),
  description: z.string().optional(),
});
