import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Dashboard Arsip Kontrak untuk memantau dan mengelola dokumen kontrak serta nota kesepahaman.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function HomePage() {
  return <HomeClient />;
}
