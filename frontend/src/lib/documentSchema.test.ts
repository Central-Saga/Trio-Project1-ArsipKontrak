import { describe, expect, it } from "vitest";
import { documentSchema } from "./documentSchema";

function validPayload() {
  return {
    project_id: "1",
    document_number: "CTR/2026/I/0001",
    document_name: "Kontrak Kerja Sama",
    document_type: "contract" as const,
    partner: "PT Mitra Usaha",
    document_date: "2026-01-01",
    effective_date: "2026-01-01",
    expiry_date: "2027-01-01",
    status: "active" as const,
    description: "Dokumen untuk pengujian.",
    file: new File(["%PDF-1.7"], "kontrak.pdf", {
      type: "application/pdf",
    }),
  };
}

describe("documentSchema", () => {
  it("menerima dokumen PDF yang valid", () => {
    const result = documentSchema.safeParse(validPayload());

    expect(result.success).toBe(true);
  });

  it("menolak file yang bukan PDF", () => {
    const result = documentSchema.safeParse({
      ...validPayload(),
      file: new File(["bukan pdf"], "kontrak.txt", {
        type: "text/plain",
      }),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Format file harus PDF");
    }
  });

  it("menolak field wajib yang kosong", () => {
    const result = documentSchema.safeParse({
      ...validPayload(),
      document_name: "",
    });

    expect(result.success).toBe(false);
  });
});
