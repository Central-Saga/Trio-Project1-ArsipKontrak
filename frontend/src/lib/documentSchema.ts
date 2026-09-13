import { z } from "zod";

export const documentSchema = z.object({
  project_id: z.string().min(1, "Project wajib dipilih"),
  document_number: z.string().min(1, "Nomor dokumen wajib diisi"),
  document_name: z.string().min(1, "Nama dokumen wajib diisi"),
  document_type: z.enum(["contract", "mou"], {
    message: "Pilih Contract atau MoU",
  }),
  partner: z.string().min(1, "Nama rekanan wajib diisi"),
  document_date: z.string().min(1, "Tanggal dokumen wajib diisi"),
  effective_date: z.string().min(1, "Tanggal efektif wajib diisi"),
  expiry_date: z.string().min(1, "Tanggal kedaluwarsa wajib diisi"),
  status: z.enum(["draft", "active", "expired", "terminated"]),
  description: z.string().optional(),
  file: z
    .custom<File>((val) => val instanceof File, {
      message: "File PDF wajib diunggah",
    })
    .refine((file) => file?.type === "application/pdf", "Format file harus PDF")
    .refine(
      (file) => file?.size <= 20 * 1024 * 1024,
      "Ukuran file maksimal 20 MB",
    ),
});

export type DocumentFormValues = z.infer<typeof documentSchema>;
