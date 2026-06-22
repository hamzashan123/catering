import { Alert, Box, Button, Card, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import html from '../utils/html';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      await api.put('/auth/profile', { name, email, username, password });
      setPassword('');
      await refreshUser();
      setMessage('Profile updated successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return html`
    <div>
      <${Typography} variant="h4" className="page-title">Profile</${Typography}>
      <${Card} className="content-card narrow-card">
        ${error && html`<${Alert} severity="error" sx=${{ mb: 2 }}>${error}</${Alert}>`}
        ${message && html`<${Alert} severity="success" sx=${{ mb: 2 }}>${message}</${Alert}>`}
        <${Box} component="form" onSubmit=${saveProfile}>
          <${TextField} fullWidth margin="normal" label="Name" value=${name} onChange=${(e) => setName(e.target.value)} />
          <${TextField} fullWidth margin="normal" label="Email" value=${email} onChange=${(e) => setEmail(e.target.value)} />
          <${TextField} fullWidth margin="normal" label="Username" value=${username} onChange=${(e) => setUsername(e.target.value)} />
          <${TextField} fullWidth margin="normal" label="New Password" type="password" value=${password} onChange=${(e) => setPassword(e.target.value)} />
          <${Button} type="submit" variant="contained" sx=${{ mt: 2 }} disabled=${saving}>${saving ? 'Saving...' : 'Save Profile'}</${Button}>
        </${Box}>
      </${Card}>
    </div>
  `;
}
