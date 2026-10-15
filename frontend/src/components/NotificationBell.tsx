"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const response = await api.get("/notifications");
      const payload = response.data;
      const items = payload?.notifications;

      if (!Array.isArray(items)) {
        throw new Error("Format respons notifikasi dari server tidak valid.");
      }

      setNotifications(items);
      setUnreadCount(Number(payload?.unread_count) || 0);
      setError(null);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Gagal memuat notifikasi.",
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchNotifications(true);

    const interval = window.setInterval(() => {
      void fetchNotifications(false);
    }, 60000);

    return () => window.clearInterval(interval);
  }, [fetchNotifications]);

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

  const markAsRead = async (id: number) => {
    setError(null);

    try {
      await api.post(`/notifications/${id}/read`);
      await fetchNotifications(false);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          "Gagal menandai notifikasi sebagai dibaca.",
      );
    }
  };

  const markAllAsRead = async () => {
    setError(null);

    try {
      await api.post("/notifications/read-all");
      await fetchNotifications(false);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          "Gagal menandai semua notifikasi sebagai dibaca.",
      );
    }
  };

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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 transition-colors hover:text-gray-900 focus:outline-none"
        aria-label="Notifikasi"
        aria-expanded={isOpen}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5 sm:w-96">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Notifikasi Dokumen
            </h3>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {error && notifications.length > 0 && (
            <div
              role="alert"
              className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void fetchNotifications(true)}
                className="mt-1 font-semibold underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
            {loading ? (
              <div
                role="status"
                className="py-8 text-center text-sm text-gray-500"
              >
                Memuat notifikasi...
              </div>
            ) : error && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-rose-600">
                <p role="alert">{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchNotifications(true)}
                  className="mt-3 rounded-lg border border-rose-200 px-3 py-2 font-semibold hover:bg-rose-50"
                >
                  Coba lagi
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Tidak ada notifikasi saat ini.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read_at) {
                      void markAsRead(notif.id);
                    }
                  }}
                  className={`cursor-pointer p-4 transition-colors hover:bg-gray-50 ${
                    !notif.read_at ? "bg-emerald-50/40" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getBadgeStyle(notif.type)}`}
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

                  <p className="mt-1.5 line-clamp-1 text-xs font-medium text-gray-800">
                    {notif.document?.document_name || "Dokumen Terkait"}
                  </p>
                  <p className="font-mono text-[11px] text-gray-500">
                    {notif.document?.document_number || "-"}
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
