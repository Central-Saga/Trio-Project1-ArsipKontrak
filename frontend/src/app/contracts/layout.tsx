import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Dokumen",
  description: "Kelola dan telusuri arsip kontrak serta nota kesepahaman.",
  alternates: {
    canonical: "/contracts",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function PageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
