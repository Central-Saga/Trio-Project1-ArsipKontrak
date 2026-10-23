import type { Metadata } from "next";
import { getDocumentNameForMetadata } from "@/lib/server-document-metadata";

type EditLayoutProps = {
  params: Promise<{ id: string }>;
};

const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export async function generateMetadata({
  params,
}: EditLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const documentName = await getDocumentNameForMetadata(id);
  const canonicalPath = `/documents/${encodeURIComponent(id)}/edit`;

  return {
    title: documentName
      ? `Edit Dokumen: ${documentName}`
      : `Edit Dokumen ${id}`,
    description:
      "Edit informasi dokumen kontrak dan nota kesepahaman pada Arsip Kontrak.",
    alternates: {
      canonical: new URL(canonicalPath, `${appUrl}/`).toString(),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function EditDocumentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
