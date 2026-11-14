import { describe, expect, it } from "vitest";
import {
  editDocumentSchema,
  uploadDocumentSchema,
  uploadVersionSchema,
} from "./formSchemas";

function pdfFile() {
  return new File(["%PDF-1.7"], "dokumen.pdf", {
    type: "application/pdf",
  });
}

describe("uploadDocumentSchema", () => {
  it("menerima data upload dokumen yang valid", () => {
    const result = uploadDocumentSchema.safeParse({
      projectId: 1,
      title: "Kontrak Kerja Sama",
      documentNumber: "CTR/2026/I/0001",
      documentType: "contract",
      counterpartName: "PT Mitra Usaha",
      startDate: "2026-01-01",
      endDate: "2027-01-01",
      description: "Deskripsi",
      file: pdfFile(),
    });

    expect(result.success).toBe(true);
  });

  it("menolak tanggal berakhir yang mendahului tanggal mulai", () => {
    const result = uploadDocumentSchema.safeParse({
      projectId: 1,
      title: "Kontrak Kerja Sama",
      documentNumber: "CTR/2026/I/0001",
      documentType: "contract",
      counterpartName: "PT Mitra Usaha",
      startDate: "2026-06-01",
      endDate: "2026-01-01",
      file: pdfFile(),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["endDate"]);
    }
  });
});

describe("uploadVersionSchema", () => {
  it("mewajibkan catatan revisi", () => {
    const result = uploadVersionSchema.safeParse({
      versionNumber: "v1.1",
      notes: "",
      file: pdfFile(),
    });

    expect(result.success).toBe(false);
  });
});

describe("editDocumentSchema", () => {
  it("menolak expiry yang mendahului tanggal dokumen", () => {
    const result = editDocumentSchema.safeParse({
      projectId: 1,
      title: "Kontrak Kerja Sama",
      documentType: "contract",
      partner: "PT Mitra Usaha",
      documentDate: "2026-06-01",
      expiryDate: "2026-01-01",
      status: "active",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["expiryDate"]);
    }
  });
});
