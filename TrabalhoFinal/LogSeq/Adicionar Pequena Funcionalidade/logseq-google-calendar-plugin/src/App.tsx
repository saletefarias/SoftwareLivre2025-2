import React, { useRef, Suspense, useMemo } from "react";
import { useAppVisible } from "./utils";

const LazyExecutionPanel = React.lazy(() => import("./components/ExecutionPanel"));

function App() {
  const innerRef = useRef<HTMLDivElement>(null);
  const visible = useAppVisible();
  const suspenseFallback = useMemo(() => (
    <div className="w-full max-w-lg p-6 bg-white/90 rounded">Carregando...</div>
  ), []);

  if (visible) {
    return (
      <main
        className="backdrop-filter backdrop-blur-md fixed inset-0 flex items-center justify-center p-6"
        onClick={(e) => {
          if (!innerRef.current?.contains(e.target as Node)) {
            window.logseq.hideMainUI();
          }
        }}
      >
        <div ref={innerRef} className="w-full max-w-lg">
          <Suspense fallback={suspenseFallback}>
            <LazyExecutionPanel />
          </Suspense>
        </div>
      </main>
    );
  }
  return null;
}

export default App;
