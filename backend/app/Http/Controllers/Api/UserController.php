<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Menampilkan daftar semua pengguna.
     */
    public function index()
    {
        $users = User::all();
        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }

    /**
     * Menyimpan pengguna baru ke dalam database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,viewer',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        // Catat log aktivitas saat admin menambah pengguna baru
        ActivityLog::record(
            auth()->id(),
            'TAMBAH_PENGGUNA',
            'Admin ' . (auth()->user()->name ?? 'Administrator') . ' berhasil menambahkan pengguna baru: ' . $user->name . ' (' . $user->role . ')'
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Pengguna berhasil ditambahkan',
            'data' => $user
        ], 201);
    }

    /**
     * Menghapus pengguna berdasarkan ID.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Mencegah admin menghapus akunnya sendiri yang sedang aktif
        if ($user->id === auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat menghapus akun yang sedang digunakan sendiri.'
            ], 403);
        }

        $userName = $user->name;
        $user->delete();

        // Catat log aktivitas saat admin menghapus pengguna
        ActivityLog::record(
            auth()->id(),
            'HAPUS_PENGGUNA',
            'Admin ' . (auth()->user()->name ?? 'Administrator') . ' menghapus pengguna: ' . $userName
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Pengguna berhasil dihapus'
        ]);
    }
}