import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { DevModeProvider } from './context/DevModeContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <DevModeProvider>
        <App />
      </DevModeProvider>
    </ThemeProvider>
  </StrictMode>,
);
