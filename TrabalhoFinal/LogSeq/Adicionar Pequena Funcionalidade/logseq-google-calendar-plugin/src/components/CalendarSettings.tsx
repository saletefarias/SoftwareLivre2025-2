import React from "react";

type EventItem = { id?: string; title: string; start: string };

const CalendarSettings: React.FC<{ events?: EventItem[] }> = ({ events = [] }) => {
  // If events are provided, show them here instead of the separate Events section.
    return (
      <div className="grid grid-cols-1 gap-2">
        <h3 className="text-sm font-medium">Eventos sincronizados</h3>
        {events.length === 0 ? (
          <div className="text-xs text-slate-500">Nenhum calendário ou evento sincronizado.</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-auto pr-2">
            {events.map((e) => (
              <div key={e.id || e.title} className="p-2 rounded border border-slate-100 dark:border-slate-800">
                <div className="text-sm font-medium">{e.title}</div>
                <div className="text-xs text-slate-500">{e.start}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
};

export default CalendarSettings;
