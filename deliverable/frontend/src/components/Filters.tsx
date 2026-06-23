import { TIME_SLOTS } from "../lib/timeSlots";

export type Location = { id: number; room_name: string; floor_level: string };

type Props = {
  search: string;
  onSearch: (v: string) => void;
  slot: string;
  onSlot: (v: string) => void;
  locationId: string;
  onLocation: (v: string) => void;
  locations: Location[];
};

export default function Filters({
  search, onSearch, slot, onSlot, locationId, onLocation, locations,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs font-medium text-slate-500">Search staff</label>
        <input
          className="border rounded-lg px-3 py-1.5 text-sm w-56"
          placeholder="Name…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Highlight slot</label>
        <select
          className="border rounded-lg px-3 py-1.5 text-sm"
          value={slot}
          onChange={(e) => onSlot(e.target.value)}
        >
          <option value="">All</option>
          {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Location</label>
        <select
          className="border rounded-lg px-3 py-1.5 text-sm"
          value={locationId}
          onChange={(e) => onLocation(e.target.value)}
        >
          <option value="">All</option>
          {locations.map((l) => (
            <option key={l.id} value={String(l.id)}>
              {l.floor_level} – {l.room_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
