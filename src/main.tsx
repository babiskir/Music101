import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { PianoInputProvider } from './input/PianoInput';
import './app/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PianoInputProvider>
      <App />
    </PianoInputProvider>
  </StrictMode>,
);
