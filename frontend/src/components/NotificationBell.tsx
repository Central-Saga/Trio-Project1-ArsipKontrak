"use client";

import { useState, useEffect, useRef } from "react";
import axios from "@/lib/api"; // Sesuaikan path axios instance kamu

interface Notification {
  id: number;
  document_id: number;
  type: string;
  sent_at: string;
  read_at: string | null;
  document?: {
    document_name: string;
    document_number: string;
  };
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ambil data notifikasi dari API Laravel (Diubah tanpa /v1 karena sudah di base URL)
  const fetchNotifications = async () => {
    try {
      const response = await axios.get("/notifications");
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error("Gagal memuat notifikasi:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Polling opsional setiap 1 menit untuk cek notifikasi baru
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Tutup dropdown jika klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tandai satu notifikasi sudah dibaca
  const markAsRead = async (id: number) => {
    try {
      await axios.post(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error("Gagal menandai dibaca:", error);
    }
  };

  // Tandai semua dibaca
  const markAllAsRead = async () => {
    try {
      await axios.post("/notifications/read-all");
      fetchNotifications();
    } catch (error) {
      console.error("Gagal menandai semua dibaca:", error);
    }
  };

  // Format label tipe notifikasi
  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "expired":
        return "bg-red-100 text-red-700 border-red-200";
      case "expiry_7":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "expiry_30":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "expired":
        return "Kedaluwarsa";
      case "expiry_7":
        return "H-7 Kedaluwarsa";
      case "expiry_30":
        return "H-30 Kedaluwarsa";
      default:
        return type;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
        aria-label="Notifikasi"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-xl ring-1 ring-black/5 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800 text-sm">
              Notifikasi Dokumen
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Tidak ada notifikasi saat ini.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read_at && markAsRead(notif.id)}
                  className={`p-4 transition-colors cursor-pointer hover:bg-gray-50 ${
                    !notif.read_at ? "bg-emerald-50/40" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getBadgeStyle(notif.type)}`}
                    >
                      {getTypeText(notif.type)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(notif.sent_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-gray-800 line-clamp-1">
                    {notif.document?.document_name || "Dokumen Terkait"}
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {notif.document?.document_number}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}