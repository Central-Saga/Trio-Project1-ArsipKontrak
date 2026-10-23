
import type { Metadata } from "next";
import DocumentDetailClient from "./DocumentDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const canonicalPath = `/documents/${encodeURIComponent(id)}`;

  return {
    title: `Detail Dokumen ${id}`,
    description:
      "Detail dokumen kontrak, informasi dokumen, riwayat versi, dan pratinjau berkas pada Arsip Kontrak.",
    alternates: {
      canonical: new URL(canonicalPath, `${appUrl}/`).toString(),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function DocumentDetailPage() {
  return <DocumentDetailClient />;
}
