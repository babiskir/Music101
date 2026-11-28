import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { PianoInputProvider } from './input/PianoInput';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource-variable/fraunces/wght.css';
import './app/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PianoInputProvider>
      <App />
    </PianoInputProvider>
  </StrictMode>,
);
