import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import html from '../utils/html';
import { downloadPagesAsPdf } from '../utils/pdf';

export default function DownloadLabels() {
  const [records, setRecords] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const pagesRef = useRef(null);
  const downloadedRef = useRef(false);
  const location = useLocation();

  useEffect(() => {
    async function loadRecords() {
      const params = new URLSearchParams(location.search);
      const ids = params.get('ids') || '';
      const response = await api.get(`/reports/list?ids=${ids}`);
      setRecords(response.data.data || []);
    }

    loadRecords();
  }, [location.search]);

  useEffect(() => {
    async function downloadPdf() {
      if (!records.length || !pagesRef.current || downloading || downloadedRef.current) return;
      downloadedRef.current = true;
      setDownloading(true);
      setTimeout(async () => {
        await downloadPagesAsPdf(pagesRef.current.querySelectorAll('.stock-label-item'), 'labels.pdf');
        setDownloading(false);
      }, 600);
    }

    downloadPdf();
  }, [records, downloading]);

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
      <div key=${record.id || index} className="stock-label-item pdf-a4-page">
        <div className="stock-header stock-print-header">
          <div className="stock-print-image-wrap">
            ${image && html`<img className="stock-image" src=${`${api.defaults.baseURL}/reports/image?path=${encodeURIComponent(image)}`} alt="stock" />`}
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

  return html`
    <div>
      <div className="pdf-download-status">${downloading ? 'Preparing PDF...' : records.length ? 'PDF downloaded. You may close this tab.' : 'Loading records...'}</div>
      <div className="pdf-render-workspace">
      <div ref=${pagesRef} className="print-page stock-print pdf-label-pages">
        ${records.length === 0 && html`<p>No records found.</p>`}
        ${records.map(renderStockRecord)}
      </div>
      </div>
    </div>
  `;
}
