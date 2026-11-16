import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administrasi",
  description: "Halaman administrasi Arsip Kontrak.",
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
