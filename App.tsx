
import React from 'react';
import { SessionProvider } from './contexts/SessionContext';
import Workbench from './components/workbench/Workbench';

import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[DevMind] App mounted');

    // Quick connectivity check to the dev server; helps reveal connection errors
    (async () => {
      try {
        const res = await fetch('/__devmind_ping', { cache: 'no-store' });
        const json = await res.json();
        // eslint-disable-next-line no-console
        console.log('[DevMind] Ping OK', json);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[DevMind] Ping failed', e);
      }
    })();

  }, []);

  return (
    <SessionProvider>
        <Workbench />
    </SessionProvider>
  );
}
