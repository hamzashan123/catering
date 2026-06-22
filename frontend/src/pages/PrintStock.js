import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import api from '../api/client';
import html from '../utils/html';

export default function PrintStock() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const location = useLocation();

  useEffect(() => {
    async function loadRecords() {
      setLoading(true);
      const params = new URLSearchParams(location.search);
      const ids = params.get('ids') || '';

      if (id === 'all' || ids) {
        const response = await api.get(`/reports/list?ids=${ids}`);
        setRecords(response.data.data || []);
      } else {
        const response = await api.get(`/bookins/${id}`);
        setRecords(response.data.data ? [response.data.data] : []);
      }

      setLoading(false);
      setTimeout(() => window.print(), 700);
    }

    loadRecords();
  }, [id, location.search]);

  function formatDate(value) {
    if (!value) return '';

    const parts = String(value).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return value;
  }

  function firstImage(record) {
    return record.first_image || record.images?.[0]?.file_path || '';
  }

  function renderStockRecord(record, index) {
    const image = firstImage(record);
    const activities = record.activities || [];

    return html`
      <div key=${record.id || index} className="stock-label-item">
        <div className="stock-header stock-print-header">
          <div className="stock-print-image-wrap">
            ${image && html`<img className="stock-image" src=${`${api.defaults.baseURL}${image}`} alt="stock" />`}
          </div>
          <div className="stock-info stock-print-info">
            <p><strong>Client:</strong><span>${record.client}</span></p>
            <p><strong>Owner:</strong><span>${record.owner}</span></p>
            <p><strong>Appliance Type:</strong><span>${record.appliance_type}</span></p>
            ${record.stock_category && html`<p className="stock-category-line"><strong></strong><span>${record.stock_category}</span></p>`}
            <p><strong>Date In:</strong><span>${formatDate(record.date_received)}</span></p>
            <p><strong>PM:</strong><span>${record.pm}</span></p>
            <${Typography} variant="h5">Stock No: ${record.stock_code}</${Typography}>
          </div>
        </div>

        <${Table} className="activity-table">
          <${TableHead}>
            <${TableRow}>
              <${TableCell}>Activity</${TableCell}>
              <${TableCell}>Date</${TableCell}>
              <${TableCell}>Hours</${TableCell}>
            </${TableRow}>
          </${TableHead}>
          <${TableBody}>
            ${Array.from({ length: 16 }).map((_, activityIndex) => {
              const activity = activities?.[activityIndex] || {};

              return html`
                <${TableRow} key=${activityIndex}>
                  <${TableCell}>${activity.activity || ''}</${TableCell}>
                  <${TableCell}>${formatDate(activity.activity_date) || ''}</${TableCell}>
                  <${TableCell}>${activity.hours || ''}</${TableCell}>
                </${TableRow}>
              `;
            })}
          </${TableBody}>
        </${Table}>
      </div>
    `;
  }

  if (loading) {
    return html`<p>Loading...</p>`;
  }

  return html`
    <div className="print-page stock-print">
      ${records.length === 0 && html`<p>No records found.</p>`}
      ${records.map(renderStockRecord)}
    </div>
  `;
}
