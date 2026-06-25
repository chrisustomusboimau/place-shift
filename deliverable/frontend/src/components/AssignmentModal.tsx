import { FormEvent, useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import type { Location } from "./Filters";

export type EditingCell = {
  assignmentId?: number;
  staffId: number;
  staffName: string;
  timeSlot: string;
  locationId?: number;
  jobDescription?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  cell: EditingCell | null;
  locations: Location[];
};

export default function AssignmentModal({ open, onClose, onSaved, cell, locations }: Props) {
  const [locationId, setLocationId] = useState<number | "">("");
  const [jobDescription, setJobDescription] = useState("");
  
  // State baru untuk menampung rentang waktu durasi custom
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Generate opsi slot waktu master setiap 30 menit dari 00:00 hingga 23:30
  const timeSlotsOptions = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => {
      const hh = String(h).padStart(2, "0");
      return [`${hh}:00`, `${hh}:30`];
    }).flat();
  }, []);

  // Opsi khusus waktu selesai (End Time) ditambahkan batas akhir 24:00
  const endTimeOptions = useMemo(() => {
    return [...timeSlotsOptions.slice(1), "24:00"];
  }, [timeSlotsOptions]);

  useEffect(() => {
    if (!cell) return;
    setLocationId(cell.locationId ?? "");
    setJobDescription(cell.jobDescription ?? "");
    setErr(null);

    // Jika komponen sel grid sudah memiliki data time_slot (Format e.g., "09:00-09:30")
    if (cell.timeSlot && cell.timeSlot.includes("-")) {
      const [start, end] = cell.timeSlot.split("-");
      setStartTime(start.trim());
      setEndTime(end.trim());
    } else {
      setStartTime("");
      setEndTime("");
    }
  }, [cell]);

  if (!open || !cell) return null;

  const isEdit = !!cell.assignmentId;

  // FIX TYPE: Mengubah format string "HH:MM" menjadi total menit absolut dengan tipe eksplisit
  function timeToMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  // Helper matematika: Mengubah total menit absolut kembali menjadi string "HH:MM"
  function minutesToTime(m: number): string {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    return `${String(h).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }

  // Generator: Memecah rentang jam besar menjadi kepingan array slot 30 menitan
  function generateSlotsInRange(startStr: string, endStr: string): string[] {
    const slots: string[] = [];
    let current = timeToMinutes(startStr);
    const end = timeToMinutes(endStr);

    while (current < end) {
      const next = current + 30;
      slots.push(`${minutesToTime(current)}-${minutesToTime(next)}`);
      current = next;
    }
    return slots;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!cell || locationId === "") {
      setErr("Pick a location");
      return;
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      setErr("End time must be after start time");
      return;
    }

    setSaving(true);
    setErr(null);

    try {
      if (isEdit) {
        // Mode Edit: Hanya mengubah isi satu sel tunggal yang diklik
        const payload = {
          staff_id: cell.staffId,
          location_id: Number(locationId),
          time_slot: cell.timeSlot,
          job_description: jobDescription,
        };
        await api.put(`/assignments/${cell.assignmentId}`, payload);
      } else {
        // Mode Baru (New Assignment): Pecah durasi menjadi kepingan array kueri POST
        const targetSlots = generateSlotsInRange(startTime, endTime);
        
        // Eksekusi seluruh request POST secara paralel
        await Promise.all(
          targetSlots.map((slot) =>
            api.post("/assignments", {
              staff_id: cell.staffId,
              location_id: Number(locationId),
              time_slot: slot,
              job_description: jobDescription,
            })
          )
        );
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Save failed. Periksa apakah ada slot yang bentrok!");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!cell?.assignmentId) return;
    if (!confirm("Delete this assignment?")) return;
    setSaving(true);
    try {
      await api.delete(`/assignments/${cell.assignmentId}`);
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form 
        onSubmit={onSubmit} 
        className="rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 border"
        style={{ backgroundColor: "#f7f5e1", borderColor: "#d9d6be" }}
      >
        <div>
          <h2 className="text-lg font-bold" style={{ color: "#03323f" }}>
            {isEdit ? "Edit Assignment" : "New Custom Duration Assignment"}
          </h2>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "#617578" }}>
            Staff Target: <span style={{ color: "#03323f" }}>{cell.staffName}</span>
          </p>
        </div>

        {/* Pemilihan Rentang Durasi Waktu Aktif */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>
              Start Time
            </label>
            <select
              disabled={isEdit}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none transition-shadow disabled:opacity-50"
              style={{ borderColor: "#cfccbc", color: "#03323f" }}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              onFocus={(e) => {
                e.target.style.boxShadow = "0 0 0 2px rgba(3, 50, 63, 0.2)";
                e.target.style.borderColor = "#03323f";
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = "none";
                e.target.style.borderColor = "#cfccbc";
              }}
            >
              {timeSlotsOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>
              End Time
            </label>
            <select
              disabled={isEdit}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none transition-shadow disabled:opacity-50"
              style={{ borderColor: "#cfccbc", color: "#03323f" }}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              onFocus={(e) => {
                e.target.style.boxShadow = "0 0 0 2px rgba(3, 50, 63, 0.2)";
                e.target.style.borderColor = "#03323f";
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = "none";
                e.target.style.borderColor = "#cfccbc";
              }}
            >
              {endTimeOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Pilihan Lokasi */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>
            Location
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none transition-shadow"
            style={{ borderColor: "#cfccbc", color: "#03323f" }}
            value={locationId}
            onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : "")}
            onFocus={(e) => {
              e.target.style.boxShadow = "0 0 0 2px rgba(3, 50, 63, 0.2)";
              e.target.style.borderColor = "#03323f";
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = "none";
              e.target.style.borderColor = "#cfccbc";
            }}
          >
            <option value="">Select…</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                Lantai {l.floor_level} – {l.room_name}
              </option>
            ))}
          </select>
        </div>

        {/* Deskripsi Kerja */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#03323f" }}>
            Job description
          </label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none transition-shadow"
            style={{ borderColor: "#cfccbc", color: "#03323f" }}
            rows={3}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            onFocus={(e) => {
              e.target.style.boxShadow = "0 0 0 2px rgba(3, 50, 63, 0.2)";
              e.target.style.borderColor = "#03323f";
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = "none";
              e.target.style.borderColor = "#cfccbc";
            }}
          />
        </div>

        {err && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-medium">
            {err}
          </div>
        )}

        {/* Bagian Tombol Aksi */}
        <div className="flex justify-between pt-2 border-t" style={{ borderColor: "#d9d6be" }}>
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={onDelete}
                disabled={saving}
                className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border font-semibold transition-colors bg-white"
              style={{ borderColor: "#cfccbc", color: "#03323f" }}
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg font-bold disabled:opacity-60 transition-colors"
              style={{ backgroundColor: "#03323f", color: "#f7f5e1" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}