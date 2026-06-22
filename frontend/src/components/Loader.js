import { Box, CircularProgress } from '@mui/material';
import html from '../utils/html';

export default function Loader() {
  return html`
    <${Box} className="center-box">
      <${CircularProgress} />
    </${Box}>
  `;
}
