import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import html from '../utils/html';

export default function PrintList() {
  const [rows, setRows] = useState([]);
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  useEffect(() => {
    async function loadRows() {
      const response = await api.get(`/reports/list?ids=${params.get('ids') || ''}`);
      setRows(response.data.data);
      setTimeout(() => window.print(), 700);
    }

    loadRows();
  }, [location.search]);

  function imageUrl(path) {
    if (!path) return '';
    return `${api.defaults.baseURL}${path}`;
  }


  function selectedFilterLabel(paramName, rowValue) {
    const value = params.get(paramName);
    if (!value || value === 'All') return 'All';
    return rowValue || 'All';
  }


  function calculateDays(value) {
    if (!value) return 0;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return 0;
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.max(0, Math.floor((todayOnly - dateOnly) / (1000 * 60 * 60 * 24)));
  }

  function dayWord(days) {
    return days === 1 ? 'Day' : 'Days';
  }

  function pmInitials(value) {
    if (!value) return '';
    const text = String(value).trim();
    if (!text.includes(' ')) return text;
    return text.split(/\s+/).map((part) => part[0] || '').join('').toUpperCase();
  }

  function formatDate(value) {
    if (!value) return '';

    const parts = String(value).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return value;
  }

  const dateFrom = formatDate(params.get('date_from'));
  const dateTo = formatDate(params.get('date_to'));
  const dateRange = dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : dateFrom ? `From ${dateFrom}` : dateTo ? `To ${dateTo}` : 'All';
  const firstRow = rows[0] || {};
  const headerClient = selectedFilterLabel('client_id', firstRow.client);
  const headerPm = selectedFilterLabel('pm_id', firstRow.pm);
  const headerType = selectedFilterLabel('type_id', firstRow.appliance_type);
  const headerOwner = selectedFilterLabel('owner_id', firstRow.owner);

  return html`
    <div className="print-report-page">
      <div className="print-report-title-wrap"><img src="/lf-logo.png" alt="LF" /><${Typography} variant="h4" className="print-report-title">REPORT</${Typography}></div>
      <${Box} className="print-filter-summary">
        <div><b>Client:</b><span>${headerClient}</span></div>
        <div><b>PM:</b><span>${headerPm}</span></div>
        <div><b>Appliance Type:</b><span>${headerType}</span></div>
        <div><b>Date Range:</b><span>${dateRange}</span></div>
        <div><b>Owner:</b><span>${headerOwner}</span></div>
      </${Box}>
      <${Box} className="print-report-list">
        ${rows.map((row) => html`
          <${Box} key=${row.id} className="print-report-item">
            <${Box} className="print-report-image-box">
              ${row.first_image && html`<img src=${imageUrl(row.first_image)} alt="appliance" />`}
            </${Box}>
            <${Box} className="print-report-details">
              <div><b>Client:</b><span>${row.client || ''}</span></div>
              <div><b>Owner:</b><span>${row.owner || ''}</span></div>
              <div><b>Appliance Type:</b><span>${row.appliance_type || ''}</span></div>
              <div><b>Dimensions:</b><span>${row.length_mm || ''} x ${row.depth_mm || ''}</span></div>
            </${Box}>
            <${Box} className="print-report-status">
              <div><b>PM:</b><span>${pmInitials(row.pm)}</span></div>
              <div><b>Condition:</b><span>${row.condition_grade || ''} ${row.stock_category || ''}</span></div>
              <div><b>Action:</b><span>${row.action_status || ''}</span></div>
              <div><b>In Stock:</b><span>${calculateDays(row.date_received)} ${dayWord(calculateDays(row.date_received))}</span></div>
              <div><b>Charge:</b><span>${Number(row.chargeable_days || calculateDays(row.effective_charge_date || row.charge_date))} ${dayWord(Number(row.chargeable_days || calculateDays(row.effective_charge_date || row.charge_date)))}</span></div>
            </${Box}>
            <${Box} className="print-report-meta">
              <span><b>SC:</b> ${row.stock_code}</span>
              <span><b>Date In:</b> ${formatDate(row.date_received) || ''}</span>
            </${Box}>
          </${Box}>
        `)}
      </${Box}>
    </div>
  `;
}
