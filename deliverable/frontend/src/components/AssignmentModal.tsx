import { FormEvent, useEffect, useState } from "react";
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
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!cell) return;
    setLocationId(cell.locationId ?? "");
    setJobDescription(cell.jobDescription ?? "");
    setErr(null);
  }, [cell]);

  if (!open || !cell) return null;

  const isEdit = !!cell.assignmentId;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!cell || locationId === "") {
      setErr("Pick a location");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        staff_id: cell.staffId,
        location_id: Number(locationId),
        time_slot: cell.timeSlot,
        job_description: jobDescription,
      };
      if (isEdit) {
        await api.put(`/assignments/${cell.assignmentId}`, payload);
      } else {
        await api.post("/assignments", payload);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Save failed");
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
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit assignment" : "New assignment"}
          </h2>
          <p className="text-sm text-slate-500">
            {cell.staffName} · {cell.timeSlot}
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Location</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Select…</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.floor_level} – {l.room_name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Job description</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            rows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>
        {err && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {err}
          </div>
        )}
        <div className="flex justify-between pt-2">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={onDelete}
                disabled={saving}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm rounded-lg border"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
