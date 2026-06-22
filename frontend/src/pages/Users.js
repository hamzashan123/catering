import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api/client';
import html from '../utils/html';

const emptyUser = {
  name: '',
  email: '',
  username: '',
  password: '',
  role: 'user',
  status: 'active'
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyUser);
  const [editForm, setEditForm] = useState(emptyUser);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteUserData, setDeleteUserData] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadUsers() {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load users.');
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function changeField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function changeEditField(name, value) {
    setEditForm((current) => ({ ...current, [name]: value }));
  }

  async function createUser(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await api.post('/users', form);
      setForm(emptyUser);
      setMessage('User added successfully.');
      loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create user.');
    }
  }

  function openEditDialog(user) {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      username: user.username || '',
      password: '',
      role: user.role || 'user',
      status: user.status || 'active'
    });
  }

  async function updateUser(event) {
    event.preventDefault();
    if (!editingUser) return;
    setError('');
    setMessage('');

    try {
      await api.put(`/users/${editingUser.id}`, editForm);
      setEditingUser(null);
      setMessage('User updated successfully.');
      loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update user.');
    }
  }

  async function confirmDeleteUser() {
    if (!deleteUserData) return;
    setError('');
    setMessage('');

    try {
      await api.delete(`/users/${deleteUserData.id}`);
      setDeleteUserData(null);
      setMessage('User deleted successfully.');
      loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete user.');
    }
  }

  function userFields(currentForm, changeHandler, includePasswordLabel = 'Password') {
    return html`
      <${TextField} label="Name" value=${currentForm.name} onChange=${(e) => changeHandler('name', e.target.value)} />
      <${TextField} label="Email" value=${currentForm.email} onChange=${(e) => changeHandler('email', e.target.value)} />
      <${TextField} label="Username" value=${currentForm.username} onChange=${(e) => changeHandler('username', e.target.value)} />
      <${TextField} label=${includePasswordLabel} type="password" value=${currentForm.password} onChange=${(e) => changeHandler('password', e.target.value)} />
      <${TextField} select label="Role" value=${currentForm.role} onChange=${(e) => changeHandler('role', e.target.value)}>
        <${MenuItem} value="admin">Admin</${MenuItem}>
        <${MenuItem} value="user">User</${MenuItem}>
      </${TextField}>
      <${TextField} select label="Status" value=${currentForm.status} onChange=${(e) => changeHandler('status', e.target.value)}>
        <${MenuItem} value="active">Active</${MenuItem}>
        <${MenuItem} value="inactive">Inactive</${MenuItem}>
      </${TextField}>
    `;
  }

  return html`
    <div>
      <${Typography} variant="h4" className="page-title">Manage Users</${Typography}>
      ${error && html`<${Alert} severity="error" sx=${{ mb: 2 }}>${error}</${Alert}>`}
      ${message && html`<${Alert} severity="success" sx=${{ mb: 2 }}>${message}</${Alert}>`}
      <${Card} className="content-card">
        <${Box} component="form" className="user-form" onSubmit=${createUser}>
          ${userFields(form, changeField)}
          <${Button} type="submit" variant="contained">Add User</${Button}>
        </${Box}>

        <${Table}>
          <${TableHead}>
            <${TableRow}>
              <${TableCell}>Name</${TableCell}>
              <${TableCell}>Email</${TableCell}>
              <${TableCell}>Username</${TableCell}>
              <${TableCell}>Role</${TableCell}>
              <${TableCell}>Status</${TableCell}>
              <${TableCell}>Action</${TableCell}>
            </${TableRow}>
          </${TableHead}>
          <${TableBody}>
            ${users.map((user) => html`
              <${TableRow} key=${user.id}>
                <${TableCell}>${user.name}</${TableCell}>
                <${TableCell}>${user.email}</${TableCell}>
                <${TableCell}>${user.username}</${TableCell}>
                <${TableCell}>${user.role}</${TableCell}>
                <${TableCell}>${user.status}</${TableCell}>
                <${TableCell}>
                  <${Button} onClick=${() => openEditDialog(user)}>Edit</${Button}>
                  <${Button} color="error" onClick=${() => setDeleteUserData(user)}>Delete</${Button}>
                </${TableCell}>
              </${TableRow}>
            `)}
          </${TableBody}>
        </${Table}>
      </${Card}>

      <${Dialog} open=${Boolean(editingUser)} onClose=${() => setEditingUser(null)} maxWidth="sm" fullWidth>
        <${DialogTitle}>Edit User</${DialogTitle}>
        <${Box} component="form" onSubmit=${updateUser}>
          <${DialogContent} className="dialog-form-grid">
            ${userFields(editForm, changeEditField, 'New Password - leave blank to keep current')}
          </${DialogContent}>
          <${DialogActions}>
            <${Button} onClick=${() => setEditingUser(null)}>Cancel</${Button}>
            <${Button} type="submit" variant="contained">Save Changes</${Button}>
          </${DialogActions}>
        </${Box}>
      </${Dialog}>

      <${Dialog} open=${Boolean(deleteUserData)} onClose=${() => setDeleteUserData(null)}>
        <${DialogTitle}>Delete User?</${DialogTitle}>
        <${DialogContent}>
          <${Typography}>Are you sure you want to delete ${deleteUserData?.name || 'this user'}?</${Typography}>
        </${DialogContent}>
        <${DialogActions}>
          <${Button} onClick=${() => setDeleteUserData(null)}>Cancel</${Button}>
          <${Button} color="error" variant="contained" onClick=${confirmDeleteUser}>Delete</${Button}>
        </${DialogActions}>
      </${Dialog}>
    </div>
  `;
}
