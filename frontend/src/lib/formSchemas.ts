import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid");

const pdfFileSchema = z
  .instanceof(File, { message: "Berkas PDF wajib diunggah" })
  .refine(
    (file) => file.type === "application/pdf",
    "Format file harus PDF",
  )
  .refine(
    (file) => file.size <= 20 * 1024 * 1024,
    "Ukuran file maksimal 20 MB",
  );

export const uploadDocumentSchema = z
  .object({
    projectId: z.number().int().positive("Project wajib dipilih"),
    title: z
      .string()
      .trim()
      .min(1, "Judul dokumen wajib diisi")
      .max(200, "Judul dokumen maksimal 200 karakter"),
    documentNumber: z
      .string()
      .trim()
      .min(1, "Nomor dokumen wajib diisi")
      .max(100, "Nomor dokumen maksimal 100 karakter"),
    documentType: z.enum([
      "contract",
      "mou",
      "adendum",
      "agreement",
      "supporting",
    ]),
    counterpartName: z
      .string()
      .trim()
      .min(1, "Nama rekanan wajib diisi")
      .max(150, "Nama rekanan maksimal 150 karakter"),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    description: z.string().optional(),
    file: pdfFileSchema,
  })
  .superRefine((data, ctx) => {
    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message:
          "Tanggal berakhir tidak boleh mendahului tanggal mulai.",
      });
    }
  });

export type UploadDocumentFormValues = z.infer<
  typeof uploadDocumentSchema
>;

export const uploadVersionSchema = z.object({
  versionNumber: z
    .string()
    .trim()
    .min(1, "Nomor versi wajib diisi")
    .max(20, "Nomor versi maksimal 20 karakter"),
  notes: z
    .string()
    .trim()
    .min(1, "Catatan revisi wajib diisi")
    .max(500, "Catatan revisi maksimal 500 karakter"),
  file: pdfFileSchema,
});

export type UploadVersionFormValues = z.infer<
  typeof uploadVersionSchema
>;

export const editDocumentSchema = z
  .object({
    projectId: z.number().int().positive("Project wajib dipilih"),
    title: z
      .string()
      .trim()
      .min(1, "Judul dokumen wajib diisi")
      .max(200, "Judul dokumen maksimal 200 karakter"),
    documentType: z.enum([
      "contract",
      "mou",
      "adendum",
      "agreement",
      "supporting",
    ]),
    partner: z
      .string()
      .trim()
      .min(1, "Nama rekanan wajib diisi")
      .max(150, "Nama rekanan maksimal 150 karakter"),
    documentDate: isoDateSchema,
    expiryDate: isoDateSchema,
    status: z.enum(["draft", "active", "expired", "terminated"]),
    description: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.expiryDate < data.documentDate) {
      ctx.addIssue({
        code: "custom",
        path: ["expiryDate"],
        message:
          "Tanggal berakhir tidak boleh mendahului tanggal dokumen.",
      });
    }
  });

export type EditDocumentFormValues = z.infer<
  typeof editDocumentSchema
>;
