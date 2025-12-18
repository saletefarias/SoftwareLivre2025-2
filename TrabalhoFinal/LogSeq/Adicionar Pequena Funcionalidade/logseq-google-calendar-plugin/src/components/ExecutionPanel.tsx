import React, { useEffect, useState } from "react";
import TaskItem from "./TaskItem";
import CalendarSettings from "./CalendarSettings";
// googleAuth and googleApi are dynamically imported where needed to allow
// the main bundle to stay small (these modules are only required when the
// user interacts with the panel).
import type { EventInput } from "../sync/eventMapper";

const ExecutionPanel: React.FC = () => {
  // start with no manual tasks; tasks will be populated from Google events
  const [tasks, setTasks] = useState<Array<{ time: string; title: string; done?: boolean }>>([]);

  const [connected, setConnected] = useState(false);
  // small status indicator for the auth flow: 'disconnected' | 'awaiting_code' | 'exchanging' | 'connected' | 'error'
  const [status, setStatus] = useState<'disconnected'|'awaiting_code'|'exchanging'|'connected'|'error'>('disconnected');
  const [events, setEvents] = useState<Array<{ id?: string; title: string; start: string }>>([]);
  // loadingEvents was used for a removed quick-list button; keep functions but remove state
  // removed quick-create event inputs (keeping UI simpler)
  const [awaitingManualCode, setAwaitingManualCode] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [isRefreshingEvents, setIsRefreshingEvents] = useState(false);
  

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('../services/googleAuth');
        const token = await mod.getAccessToken();
        if (mounted) setConnected(!!token);
      } catch (err) {
        // ignore: if auth module can't be loaded in some env, user is not connected
        if (mounted) setConnected(false);
      }
    })();
    // listen for status events from googleAuth
    function onGcalStatus(ev: Event) {
      try {
        const e = ev as CustomEvent<Record<string, unknown>>;
        const s = (e.detail && (e.detail.status as string)) || '';
        if (s === 'awaiting_manual_code') {
          setAwaitingManualCode(true);
        }
        if (s === 'awaiting_code') setStatus('awaiting_code');
        if (s === 'exchanging') setStatus('exchanging');
        if (s === 'connected') setStatus('connected');
        if (s === 'error') {
          setStatus('error');
          if (e.detail && e.detail['message']) {
            try { window.alert('Erro na autenticação: ' + String(e.detail['message'])); } catch (_e) { /* ignore */ }
          }
        }
      } catch (_e) { /* ignore */ }
    }
    window.addEventListener('gcal:status', onGcalStatus as EventListener);
    return () => { mounted = false; };
  }, []);

  async function handleConnect() {
    try {
      // update status and start auth
      setStatus('awaiting_code');
      const authMod = await import('../services/googleAuth');
      await authMod.startGoogleAuth();
      // exchange completed
      setStatus('connected');
      const token = await authMod.getAccessToken();
      setConnected(!!token);
      if (token) {
        window.alert('Autenticação concluída com sucesso');
        // Load events into the task area automatically
        handleListEvents();
      }
    } catch (err) {
      setStatus('error');
      console.error('Auth error', err);
      let msg = String(err);
      if (err && typeof err === 'object' && 'message' in err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        msg = (err as any).message;
      }
      window.alert('Falha na autenticação: ' + msg);
    }
  }

  async function handleListEvents() {
    setIsRefreshingEvents(true);
    function isDateOnly(s: string) {
      return /^\d{4}-\d{2}-\d{2}$/.test(s);
    }

    function isOnLocalDay(startStr?: string) {
      if (!startStr) return false;
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = today.getMonth() + 1;
      const dd = today.getDate();
      if (isDateOnly(startStr)) {
        const [y, m, d] = startStr.split('-').map((x) => parseInt(x, 10));
        return y === yyyy && m === mm && d === dd;
      }
      const t = new Date(startStr);
      if (Number.isNaN(t.getTime())) return false;
      return t.getFullYear() === yyyy && (t.getMonth() + 1) === mm && t.getDate() === dd;
    }

    try {
  const { listEvents } = await import('../services/googleApi');
  const items: EventInput[] = await listEvents('primary');
      // Debug: log raw items and environment to help diagnose missing matches
      try {
        // eslint-disable-next-line no-console
        console.debug('[gcal] fetched items count:', items.length);
        // eslint-disable-next-line no-console
        console.debug('[gcal] sample items:', items.slice(0, 8));
        // eslint-disable-next-line no-console
        console.debug('[gcal] local now:', new Date().toString());
      } catch (_e) { /* ignore */ }

      // Filter raw items for those occurring today (before deduplication)
      const itemsToday = items.filter((it) => isOnLocalDay(it.start));
      // Debug: log filtered results
      try {
        // eslint-disable-next-line no-console
        console.debug('[gcal] itemsToday count:', itemsToday.length);
        // eslint-disable-next-line no-console
        console.debug('[gcal] itemsToday sample:', itemsToday.slice(0, 8));
      } catch (_e) { /* ignore */ }

      // Deduplicate today's items by recurringEventId/id/title and keep earliest start today
      const groupsToday = new Map<string, EventInput[]>();
      for (const it of itemsToday) {
        const key = it.recurringEventId || it.id || it.title || `${it.title}:${it.start}`;
        const arr = groupsToday.get(key) || [];
        arr.push(it);
        groupsToday.set(key, arr);
      }

      const uniqueToday: EventInput[] = [];
      for (const group of groupsToday.values()) {
        const sorted = group.slice().sort((a, b) => {
          const ta = a.start ? (isDateOnly(a.start) ? new Date(a.start + 'T00:00:00').getTime() : new Date(a.start).getTime()) : Infinity;
          const tb = b.start ? (isDateOnly(b.start) ? new Date(b.start + 'T00:00:00').getTime() : new Date(b.start).getTime()) : Infinity;
          return ta - tb;
        });
        uniqueToday.push(sorted[0]);
      }

      setEvents(uniqueToday.map((it) => ({ id: it.id, title: it.title, start: it.start })));
      const mapped = uniqueToday.map((it) => ({ time: it.start || '', title: it.title, done: false }));
      setTasks(mapped);
    } catch (err) {
      console.error('Failed to list events', err);
      window.alert('Falha ao listar eventos: ' + String(err));
    } finally {
      setIsRefreshingEvents(false);
    }
  }

  

  async function handleDisconnect() {
    try {
  const mod = await import('../services/googleAuth');
  await mod.clearToken();
  setConnected(false);
  setStatus('disconnected');
  setEvents([]);
  setTasks([]);
      window.alert('Desconectado');
    } catch (err) {
      console.error('Failed to clear token', err);
      window.alert('Erro ao desconectar: ' + String(err));
    }
  }

  // Called when user pastes code in the UI modal
  async function submitManualCode() {
    try {
      // dynamic import of provideAuthCode to avoid circular imports
      const mod = await import('../services/googleAuth');
      const ok = mod.provideAuthCode(manualCodeInput.trim());
      setAwaitingManualCode(false);
      setManualCodeInput('');
      if (!ok) {
        window.alert('Nenhuma operação aguardando código. Tente novamente ou feche e reabra o fluxo de autenticação.');
      } else {
        window.alert('Código enviado. Aguardando conclusão...');
      }
    } catch (err) {
      console.error('Failed to provide manual code', err);
      window.alert('Erro ao enviar código: ' + String(err));
    }
  }

  // Render a simple inline modal for manual code paste when needed
  const ManualCodeModal = () => awaitingManualCode ? (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 p-4 rounded shadow max-w-lg w-full">
        <h4 className="font-semibold mb-2">Colar código de autorização</h4>
  <textarea value={manualCodeInput} onChange={(e) => setManualCodeInput(e.target.value)} className="w-full p-2 h-24 rounded border text-black" />
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={() => { setAwaitingManualCode(false); setManualCodeInput(''); }} className="px-3 py-1">Cancelar</button>
          <button onClick={submitManualCode} className="px-3 py-1 bg-sky-600 text-white rounded">Enviar código</button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="max-w-md w-full bg-white/95 dark:bg-slate-900/95 shadow-lg rounded-xl p-4 font-sans text-slate-900 dark:text-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">📆 Execução do Dia</h2>
      </div>

      <div className="space-y-3">
        {tasks.map((t, i) => (
          <TaskItem key={i} time={t.time} title={t.title} done={t.done} />
        ))}
      </div>

      <div className="mt-4 border-t pt-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">Calendários sincronizados</div>
          <div className="flex gap-2">
            {connected ? (
              <button onClick={handleListEvents} disabled={isRefreshingEvents} className="px-3 py-1 rounded-md bg-sky-600 text-white text-sm">
                {isRefreshingEvents ? 'Atualizando...' : 'Atualizar'}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-3">
          <CalendarSettings events={events} />
        </div>
      </div>

      <div className="mt-4 flex gap-2 items-center">
        {!connected ? (
          <button onClick={handleConnect} className={`flex-1 py-2 rounded-md text-white bg-sky-600 hover:bg-sky-700`}>
            Conectar Google
          </button>
        ) : null}
        <button onClick={handleDisconnect} className="py-2 px-3 rounded-md border border-slate-200 dark:border-slate-700">Desconectar</button>
        {/* Status indicator */}

        <style>{`.ml-2.text-sm { display: ${status === 'connected' || status === 'disconnected' ? 'none' : 'inline-flex'} }`}</style>
        <div className="ml-2 text-sm">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Events are now displayed in the Calendários sincronizados area to avoid duplication. */}
      {ManualCodeModal()}
    </div>
  );
};

export default ExecutionPanel;

// Small status badge component
function StatusBadge({ status }: { status: 'disconnected'|'awaiting_code'|'exchanging'|'connected'|'error' }) {
  const map = {
    disconnected: { text: 'Desconectado', className: 'bg-gray-200 text-slate-700' },
    awaiting_code: { text: 'Aguardando código', className: 'bg-yellow-100 text-yellow-800' },
    exchanging: { text: 'Trocando código...', className: 'bg-sky-100 text-sky-800' },
    connected: { text: 'Conectado', className: 'bg-emerald-100 text-emerald-800' },
    error: { text: 'Erro', className: 'bg-red-100 text-red-800' },
  } as const;
  const cfg = map[status];
  return (
    <div className={`px-2 py-1 rounded text-xs font-medium ${cfg.className}`}>{cfg.text}</div>
  );
}
