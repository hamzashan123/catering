import {
  Alert,
  Box,
  Button,
  Card,
  Grid,
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

const groups = [
  { key: 'clients', label: 'Manage Clients' },
  { key: 'owners', label: 'Manage Owners' },
  { key: 'pms', label: 'Manage PM' },
  { key: 'types', label: 'Manage Type' }
];

export default function Fields() {
  const [items, setItems] = useState({ clients: [], owners: [], pms: [], types: [] });
  const [names, setNames] = useState({ clients: '', owners: '', pms: '', types: '' });
  const [editing, setEditing] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    try {
      const results = await Promise.all(groups.map((group) => api.get(`/fields/${group.key}`)));
      const nextItems = {};
      groups.forEach((group, index) => { nextItems[group.key] = results[index].data.data; });
      setItems(nextItems);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load BookIn fields.');
    }
  }

  function changeName(key, value) {
    setNames((current) => ({ ...current, [key]: value }));
  }

  function editKey(groupKey, id) {
    return `${groupKey}-${id}`;
  }

  function startEdit(groupKey, item) {
    setEditing((current) => ({
      ...current,
      [editKey(groupKey, item.id)]: { name: item.name, status: item.status || 'active' }
    }));
  }

  function changeEdit(groupKey, id, field, value) {
    const key = editKey(groupKey, id);
    setEditing((current) => ({
      ...current,
      [key]: { ...current[key], [field]: value }
    }));
  }

  function cancelEdit(groupKey, id) {
    const key = editKey(groupKey, id);
    setEditing((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function addItem(key) {
    if (!names[key].trim()) return;
    try {
      await api.post(`/fields/${key}`, { name: names[key], status: 'active' });
      changeName(key, '');
      setMessage('Field added successfully.');
      loadItems();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to add field.');
    }
  }

  async function saveItem(groupKey, id) {
    const key = editKey(groupKey, id);
    const payload = editing[key];
    if (!payload?.name?.trim()) return;

    try {
      await api.put(`/fields/${groupKey}/${id}`, payload);
      cancelEdit(groupKey, id);
      setMessage('Field updated successfully.');
      loadItems();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update field.');
    }
  }

  async function deleteItem(key, id) {
    if (!window.confirm('Delete this field?')) return;
    try {
      await api.delete(`/fields/${key}/${id}`);
      setMessage('Field deleted successfully.');
      loadItems();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete field.');
    }
  }

  return html`
    <div>
      <${Typography} variant="h4" className="page-title">BookIn Fields</${Typography}>
      ${error && html`<${Alert} severity="error" sx=${{ mb: 2 }}>${error}</${Alert}>`}
      ${message && html`<${Alert} severity="success" sx=${{ mb: 2 }}>${message}</${Alert}>`}
      <${Grid} container spacing=${3}>
        ${groups.map((group) => html`
          <${Grid} item xs=${12} md=${6} key=${group.key}>
            <${Card} className="content-card fields-card">
              <${Typography} variant="h6" mb=${2} fontWeight=${900}>${group.label}</${Typography}>
              <${Box} className="inline-form">
                <${TextField} fullWidth size="small" label="Name" value=${names[group.key]} onChange=${(e) => changeName(group.key, e.target.value)} />
                <${Button} variant="contained" className="blue-button" onClick=${() => addItem(group.key)}>Add</${Button}>
              </${Box}>
              <${Box} className="table-wrap" mt=${2}>
                <${Table} size="small">
                  <${TableHead}>
                    <${TableRow}><${TableCell}>Name</${TableCell}><${TableCell}>Status</${TableCell}><${TableCell} align="right">Actions</${TableCell}></${TableRow}>
                  </${TableHead}>
                  <${TableBody}>
                    ${(items[group.key] || []).map((item) => {
                      const key = editKey(group.key, item.id);
                      const activeEdit = editing[key];
                      return html`
                        <${TableRow} key=${item.id}>
                          <${TableCell}>
                            ${activeEdit ? html`<${TextField} size="small" fullWidth value=${activeEdit.name} onChange=${(e) => changeEdit(group.key, item.id, 'name', e.target.value)} />` : item.name}
                          </${TableCell}>
                          <${TableCell}>
                            ${activeEdit ? html`
                              <${TextField} select size="small" value=${activeEdit.status} onChange=${(e) => changeEdit(group.key, item.id, 'status', e.target.value)}>
                                <${MenuItem} value="active">Active</${MenuItem}>
                                <${MenuItem} value="inactive">Inactive</${MenuItem}>
                              </${TextField}>
                            ` : (item.status || 'active')}
                          </${TableCell}>
                          <${TableCell} align="right">
                            ${activeEdit ? html`
                              <${Button} size="small" onClick=${() => saveItem(group.key, item.id)}>Save</${Button}>
                              <${Button} size="small" color="inherit" onClick=${() => cancelEdit(group.key, item.id)}>Cancel</${Button}>
                            ` : html`
                              <${Button} size="small" onClick=${() => startEdit(group.key, item)}>Edit</${Button}>
                              <${Button} size="small" color="error" onClick=${() => deleteItem(group.key, item.id)}>Delete</${Button}>
                            `}
                          </${TableCell}>
                        </${TableRow}>
                      `;
                    })}
                  </${TableBody}>
                </${Table}>
              </${Box}>
            </${Card}>
          </${Grid}>
        `)}
      </${Grid}>
    </div>
  `;
}
