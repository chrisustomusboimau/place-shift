import { useMemo } from "react";
import type { EditingCell } from "./AssignmentModal";

export type MatrixCell = {
  assignment_id: number;
  location: string;
  location_id: number;
  job_description: string;
};

export type MatrixStaff = { id: number; name: string; division: string };

export type MatrixData = {
  time_slots: string[];
  staff: MatrixStaff[];
  cells: Record<string, Record<string, MatrixCell>>;
};

type Props = {
  data: MatrixData;
  search: string;
  highlightSlot: string;
  locationFilter: string;
  isAdmin: boolean;
  onCellClick: (cell: EditingCell) => void;
};

export default function ScheduleMatrix({
  data, search, highlightSlot, locationFilter, isAdmin, onCellClick,
}: Props) {
  const staff = useMemo(
    () =>
      data.staff.filter((s) =>
        s.name.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [data.staff, search]
  );

  return (
    <div className="border rounded-xl overflow-auto bg-white shadow-sm max-h-[75vh]">
      <table className="min-w-max border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-30 bg-slate-100 border-b border-r px-3 py-2 text-left min-w-[200px]">
              Staff
            </th>
            {data.time_slots.map((slot) => (
              <th
                key={slot}
                className={`sticky top-0 z-20 border-b border-r px-2 py-2 text-xs font-medium whitespace-nowrap ${
                  slot === highlightSlot ? "bg-indigo-100" : "bg-slate-100"
                }`}
              >
                {slot}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => {
            const row = data.cells[String(s.id)] ?? {};
            return (
              <tr key={s.id}>
                <td className="sticky left-0 z-10 bg-white border-b border-r px-3 py-2 min-w-[200px]">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.division}</div>
                </td>
                {data.time_slots.map((slot) => {
                  const cell = row[slot];
                  const dim =
                    locationFilter &&
                    cell &&
                    String(cell.location_id) !== locationFilter;
                  const highlighted = slot === highlightSlot;
                  const base =
                    "border-b border-r px-2 py-1 text-xs align-top min-w-[140px] h-16";
                  if (cell) {
                    return (
                      <td
                        key={slot}
                        className={`${base} ${highlighted ? "bg-indigo-50" : ""} ${
                          dim ? "opacity-30" : ""
                        } ${isAdmin ? "cursor-pointer hover:bg-indigo-100" : ""}`}
                        onClick={() =>
                          isAdmin &&
                          onCellClick({
                            assignmentId: cell.assignment_id,
                            staffId: s.id,
                            staffName: s.name,
                            timeSlot: slot,
                            locationId: cell.location_id,
                            jobDescription: cell.job_description,
                          })
                        }
                      >
                        <div className="font-medium truncate">{cell.location}</div>
                        <div className="text-slate-500 line-clamp-2">
                          {cell.job_description}
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td
                      key={slot}
                      className={`${base} ${highlighted ? "bg-indigo-50" : ""} ${
                        isAdmin
                          ? "cursor-pointer hover:bg-slate-50 border-dashed text-slate-300"
                          : "text-slate-200"
                      }`}
                      onClick={() =>
                        isAdmin &&
                        onCellClick({
                          staffId: s.id,
                          staffName: s.name,
                          timeSlot: slot,
                        })
                      }
                    >
                      {isAdmin ? "+" : ""}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {staff.length === 0 && (
            <tr>
              <td
                colSpan={data.time_slots.length + 1}
                className="text-center text-slate-500 py-8"
              >
                No staff match the current filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
