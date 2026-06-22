import { Alert, Card, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import html from '../utils/html';

export default function DashboardPage() {
  const [stats, setStats] = useState({ active: 0, archived: 0, clients: 0, users: 0 });
  const { isAdmin } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load dashboard data.');
      }
    }

    loadStats();
  }, []);

  const cards = [
    { label: 'Active BookIn Records', value: stats.active },
    ...(isAdmin ? [
      { label: 'Archived Records', value: stats.archived },
      { label: 'Users', value: stats.users }
    ] : [])
  ];

  return html`
    <div>
      <div className="page-title-with-logo"><img src="/lf-logo.png" alt="LF" /><${Typography} variant="h4" className="page-title">Dashboard</${Typography}></div>
      ${error && html`<${Alert} severity="error" sx=${{ mb: 2 }}>${error}</${Alert}>`}
      <${Grid} container spacing=${3}>
        ${cards.map((card) => html`
          <${Grid} item xs=${12} sm=${6} md=${3} key=${card.label}>
            <${Card} className="stat-card">
              <${Typography} color="text.secondary">${card.label}</${Typography}>
              <${Typography} variant="h3" fontWeight=${900}>${card.value}</${Typography}>
            </${Card}>
          </${Grid}>
        `)}
      </${Grid}>
    </div>
  `;
}
