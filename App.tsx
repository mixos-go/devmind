
import React from 'react';
import { SessionProvider } from './contexts/SessionContext';
import Workbench from './components/workbench/Workbench';

export default function App() {
  return (
    <SessionProvider>
        <Workbench />
    </SessionProvider>
  );
}
