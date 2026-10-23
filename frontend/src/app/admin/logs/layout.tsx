import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log Aktivitas",
  description: "Riwayat aktivitas pengguna pada aplikasi Arsip Kontrak.",
  alternates: {
    canonical: "/admin/logs",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function PageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
