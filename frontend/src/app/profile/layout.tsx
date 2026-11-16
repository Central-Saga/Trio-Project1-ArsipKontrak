import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Pengguna",
  description: "Informasi profil pengguna Arsip Kontrak.",
  alternates: {
    canonical: "/profile",
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
