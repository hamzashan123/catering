import { Alert, Box, Button, Card, Grid, MenuItem, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import html from '../utils/html';

const emptyFilters = {
  client_id: 'All',
  owner_id: 'All',
  type_id: 'All',
  pm_id: 'All',
  condition_grade: 'All',
  stock_category: 'All',
  action_status: 'All',
  date_from: '',
  date_to: '',
  search: ''
};

export default function Reports() {
  const [filters, setFilters] = useState(emptyFilters);
  const [dropdowns, setDropdowns] = useState({ clients: [], owners: [], pms: [], types: [] });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDropdowns() {
      try {
        const response = await api.get('/dropdowns');
        setDropdowns(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load report filters.');
      }
    }

    loadDropdowns();
  }, []);

  function changeFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function searchRecords(event) {
    event.preventDefault();
    const params = new URLSearchParams(filters).toString();
    navigate(`/search-results?${params}`);
  }

  function filterDropdown(name, label, items) {
    return html`
      <${TextField}
        select
        fullWidth
        label=${label}
        value=${filters[name]}
        onChange=${(event) => changeFilter(name, event.target.value)}
      >
        <${MenuItem} value="All">All</${MenuItem}>
        ${items.map((item) => html`<${MenuItem} key=${item.id} value=${item.id}>${item.name}</${MenuItem}>`)}
      </${TextField}>
    `;
  }

  return html`
    <div>
      <${Typography} variant="h4" className="page-title">Reports</${Typography}>
      ${error && html`<${Alert} severity="error" sx=${{ mb: 2 }}>${error}</${Alert}>`}

      <${Card} className="content-card narrow-card">
        <${Typography} variant="h6" mb=${2}>Filter results by</${Typography}>

        <${Box} component="form" onSubmit=${searchRecords}>
          <${Grid} container spacing=${2}>
            <${Grid} item xs=${12}><${TextField} fullWidth label="Search" placeholder="Search Removed From" value=${filters.search} onChange=${(e) => changeFilter('search', e.target.value)} /></${Grid}>
            <${Grid} item xs=${12}>${filterDropdown('client_id', 'Client', dropdowns.clients)}</${Grid}>
            <${Grid} item xs=${12}>${filterDropdown('owner_id', 'Owner', dropdowns.owners)}</${Grid}>
            <${Grid} item xs=${12}>${filterDropdown('type_id', 'Appliance Type', dropdowns.types)}</${Grid}>
            <${Grid} item xs=${12}>${filterDropdown('pm_id', 'PM', dropdowns.pms)}</${Grid}>
            <${Grid} item xs=${12} md=${6}>
              <${TextField} fullWidth type="date" label="Date From" InputLabelProps=${{ shrink: true }} value=${filters.date_from} onChange=${(e) => changeFilter('date_from', e.target.value)} />
            </${Grid}>
            <${Grid} item xs=${12} md=${6}>
              <${TextField} fullWidth type="date" label="Date To" InputLabelProps=${{ shrink: true }} value=${filters.date_to} onChange=${(e) => changeFilter('date_to', e.target.value)} />
            </${Grid}>
            <${Grid} item xs=${12} md=${4}>
              <${TextField} select fullWidth label="Condition" value=${filters.condition_grade} onChange=${(e) => changeFilter('condition_grade', e.target.value)}>
                ${['All', 'A', 'B', 'C', 'D'].map((item) => html`<${MenuItem} key=${item} value=${item}>${item}</${MenuItem}>`)}
              </${TextField}>
            </${Grid}>
            <${Grid} item xs=${12} md=${4}>
              <${TextField} select fullWidth label="Stock Cat" value=${filters.stock_category} onChange=${(e) => changeFilter('stock_category', e.target.value)}>
                ${['All', 'NSE', 'S/Hand'].map((item) => html`<${MenuItem} key=${item} value=${item}>${item}</${MenuItem}>`)}
              </${TextField}>
            </${Grid}>
            <${Grid} item xs=${12} md=${4}>
              <${TextField} select fullWidth label="Action" value=${filters.action_status} onChange=${(e) => changeFilter('action_status', e.target.value)}>
                ${['All', 'Sell', 'Hold', 'Scrap', 'Refurb'].map((item) => html`<${MenuItem} key=${item} value=${item}>${item}</${MenuItem}>`)}
              </${TextField}>
            </${Grid}>
          </${Grid}>

          <${Button} type="submit" variant="contained" size="large" fullWidth sx=${{ mt: 3 }}>
            Search
          </${Button}>
        </${Box}>
      </${Card}>
    </div>
  `;
}
