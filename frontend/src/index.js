import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import html from './utils/html';
import './styles.css';

const theme = createTheme({
  palette: {
    primary: { main: '#0f5ca8' },
    background: { default: '#f4f7fb' }
  },
  shape: {
    borderRadius: 14
  }
});

const root = createRoot(document.getElementById('root'));

root.render(html`
  <${React.StrictMode}>
    <${ThemeProvider} theme=${theme}>
      <${CssBaseline} />
      <${AuthProvider}>
        <${App} />
      </${AuthProvider}>
    </${ThemeProvider}>
  </${React.StrictMode}>
`);
