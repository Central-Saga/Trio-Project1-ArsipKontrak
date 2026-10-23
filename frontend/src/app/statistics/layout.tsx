import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistik Dokumen",
  description: "Statistik dan ringkasan dokumen pada Arsip Kontrak.",
  alternates: {
    canonical: "/statistics",
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
