import { Alert, Box, Button, Card, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import html from '../utils/html';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login, loading } = useAuth();
  const navigate = useNavigate();

  async function submitForm(event) {
    event.preventDefault();
    setError('');

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Login failed');
    }
  }

  return html`
    <${Box} className="login-page">
      <${Card} className="login-card">
        <${Typography} variant="h4" fontWeight=${900} mb=${1}>
          BookIn Login
        </${Typography}>
        <${Typography} color="text.secondary" mb=${3}>
          Sign in to manage catering appliances.
        </${Typography}>

        ${error && html`<${Alert} severity="error" sx=${{ mb: 2 }}>${error}</${Alert}>`}

        <${Box} component="form" onSubmit=${submitForm}>
          <${TextField}
            fullWidth
            label="Username"
            margin="normal"
            value=${username}
            onChange=${(event) => setUsername(event.target.value)}
          />

          <${TextField}
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            value=${password}
            onChange=${(event) => setPassword(event.target.value)}
          />

          <${Button}
            fullWidth
            size="large"
            variant="contained"
            type="submit"
            disabled=${loading}
            sx=${{ mt: 2 }}
          >
            ${loading ? 'Signing in...' : 'Login'}
          </${Button}>
        </${Box}>
      </${Card}>
    </${Box}>
  `;
}
