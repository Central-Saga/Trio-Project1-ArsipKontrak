"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Activity,
  Users,
  LogOut,
  FolderArchive,
} from "lucide-react";

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user_data") || localStorage.getItem("user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("user_data");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shadow-sm">
      {/* Logo / Brand SAGA Arsip */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
          <FolderArchive className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-base leading-tight">
            SAGA Arsip
          </h1>
          <p className="text-xs text-slate-500">Document Management</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
            pathname === "/"
              ? "bg-emerald-50 text-emerald-600"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <LayoutDashboard
            className={`h-4 w-4 ${pathname === "/" ? "text-emerald-600" : "text-slate-400"}`}
          />
          Dashboard Utama
        </Link>

        <Link
          href="/documents"
          className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
            pathname.startsWith("/documents")
              ? "bg-emerald-50 text-emerald-600"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <FileText
            className={`h-4 w-4 ${pathname.startsWith("/documents") ? "text-emerald-600" : "text-slate-400"}`}
          />
          Kelola Dokumen
        </Link>

        {/* Menu Khusus Admin */}
        {currentUser?.role === "admin" && (
          <>
            <Link
              href="/admin/users"
              className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                pathname === "/admin/users"
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Users
                className={`h-4 w-4 ${pathname === "/admin/users" ? "text-emerald-600" : "text-slate-400"}`}
              />
              Manajemen Pengguna
            </Link>

            <Link
              href="/admin/logs"
              className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                pathname === "/admin/logs"
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Activity
                className={`h-4 w-4 ${pathname === "/admin/logs" ? "text-emerald-600" : "text-slate-400"}`}
              />
              Log Aktivitas
            </Link>
          </>
        )}
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
        {currentUser && (
          <div className="px-2">
            <p className="text-xs font-bold text-slate-800 truncate">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {currentUser.role}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
        >
          <LogOut className="h-3.5 w-3.5" /> Keluar Akun
        </button>
      </div>
    </aside>
  );
}
