import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen Pengguna",
  description: "Kelola akun dan hak akses pengguna Arsip Kontrak.",
  alternates: {
    canonical: "/admin/users",
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
