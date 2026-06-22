import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RestoreIcon from '@mui/icons-material/Restore';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useEffect, useState } from 'react';
import api from '../api/client';
import html from '../utils/html';

export default function ArchivedBookIns() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sliderImages, setSliderImages] = useState([]);
  const [sliderIndex, setSliderIndex] = useState(0);

  useEffect(() => { loadRows(); }, []);

  async function loadRows() {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/bookins?archived=1&sort=archived_at&dir=DESC');
      setRows(response.data.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load archived BookIn records.');
    } finally {
      setLoading(false);
    }
  }

  async function restoreRecord(id) {
    if (!window.confirm('Restore this archived BookIn record?')) return;
    setMessage('');
    setError('');

    try {
      await api.post(`/bookins/${id}/restore`);
      setMessage('BookIn record restored successfully.');
      await loadRows();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to restore this BookIn record.');
    }
  }

  async function permanentlyDeleteRecord(id) {
    if (!window.confirm('Permanently delete this archived BookIn record? This cannot be undone.')) return;
    setMessage('');
    setError('');

    try {
      await api.delete(`/bookins/${id}/delete`);
      setMessage('Archived BookIn record permanently deleted.');
      await loadRows();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to permanently delete this BookIn record.');
    }
  }

  function imageUrl(path) {
    if (!path) return '';
    return `${api.defaults.baseURL}${path}`;
  }

  function rowImages(row) {
    const paths = row.image_paths ? row.image_paths.split('||').filter(Boolean) : [];
    if (!paths.length && row.first_image) paths.push(row.first_image);
    return paths.map(imageUrl);
  }

  function openImageSlider(row) {
    const images = rowImages(row);
    if (!images.length) return;
    setSliderImages(images);
    setSliderIndex(0);
  }

  function previousImage() {
    setSliderIndex((current) => current === 0 ? sliderImages.length - 1 : current - 1);
  }

  function nextImage() {
    setSliderIndex((current) => current === sliderImages.length - 1 ? 0 : current + 1);
  }

  return html`
    <div>
      <${Typography} variant="h4" className="page-title">Archived BookIns</${Typography}>
      ${error && html`<${Alert} severity="error" sx=${{ mb: 2 }}>${error}</${Alert}>`}
      ${message && html`<${Alert} severity="success" sx=${{ mb: 2 }}>${message}</${Alert}>`}

      <${Card} className="content-card">
        <${Box} className="table-title-row">
          <${Box}>
            <${Typography} variant="h6" fontWeight=${900}>Archived BookIn Records</${Typography}>
            <${Typography} color="text.secondary" fontSize=${14}>Restore records back to active Book In, or permanently delete records you no longer need.</${Typography}>
          </${Box}>
          <${Button} variant="outlined" onClick=${loadRows}>Refresh</${Button}>
        </${Box}>

        <${Paper} className="table-wrap" variant="outlined">
          <${Table} size="small">
            <${TableHead}>
              <${TableRow}>
                <${TableCell}>Image</${TableCell}>
                <${TableCell}>SC</${TableCell}>
                <${TableCell}>Client</${TableCell}>
                <${TableCell}>Appliance Type</${TableCell}>
                <${TableCell}>Condition</${TableCell}>
                <${TableCell}>Action</${TableCell}>
                <${TableCell}>Stock Cat</${TableCell}>
                <${TableCell}>PM</${TableCell}>
                <${TableCell} align="right">Manage</${TableCell}>
              </${TableRow}>
            </${TableHead}>
            <${TableBody}>
              ${loading && html`<${TableRow}><${TableCell} colSpan=${9}>Loading archived records...</${TableCell}></${TableRow}>`}
              ${!loading && rows.length === 0 && html`<${TableRow}><${TableCell} colSpan=${9}>No archived BookIn records found.</${TableCell}></${TableRow}>`}
              ${!loading && rows.map((row) => html`
                <${TableRow} key=${row.id} hover>
                  <${TableCell}>
                    ${row.first_image && html`<button className="image-button" type="button" onClick=${() => openImageSlider(row)}><img className="table-image" src=${imageUrl(row.first_image)} alt="Appliance" /></button>`}
                  </${TableCell}>
                  <${TableCell}>${row.stock_code}</${TableCell}>
                  <${TableCell}>${row.client || '-'}</${TableCell}>
                  <${TableCell}>${row.appliance_type || '-'}</${TableCell}>
                  <${TableCell}>${row.condition_grade || '-'}</${TableCell}>
                  <${TableCell}>${row.action_status || '-'}</${TableCell}>
                  <${TableCell}>${row.stock_category || '-'}</${TableCell}>
                  <${TableCell}>${row.pm || '-'}</${TableCell}>
                  <${TableCell} align="right">
                    <${IconButton} color="primary" onClick=${() => restoreRecord(row.id)} title="Restore"><${RestoreIcon} /></${IconButton}>
                    <${IconButton} color="error" onClick=${() => permanentlyDeleteRecord(row.id)} title="Delete permanently"><${DeleteForeverIcon} /></${IconButton}>
                  </${TableCell}>
                </${TableRow}>
              `)}
            </${TableBody}>
          </${Table}>
        </${Paper}>
      </${Card}>

      <${Dialog} open=${sliderImages.length > 0} onClose=${() => setSliderImages([])} maxWidth="lg" fullWidth>
        <${Box} className="image-dialog-header">
          <${Typography} fontWeight=${900}>Archived Record Images ${sliderImages.length ? `${sliderIndex + 1} / ${sliderImages.length}` : ''}</${Typography}>
          <${IconButton} onClick=${() => setSliderImages([])}><${CloseIcon} /></${IconButton}>
        </${Box}>
        <${Box} className="slider-dialog-body">
          ${sliderImages.length > 1 && html`<${IconButton} className="slider-arrow left" onClick=${previousImage}><${NavigateBeforeIcon} /></${IconButton}>`}
          ${sliderImages.length > 0 && html`<img src=${sliderImages[sliderIndex]} alt="Large appliance" />`}
          ${sliderImages.length > 1 && html`<${IconButton} className="slider-arrow right" onClick=${nextImage}><${NavigateNextIcon} /></${IconButton}>`}
        </${Box}>
        <${Box} className="image-thumb-strip dialog-thumbs">
          ${sliderImages.map((image, index) => html`
            <button key=${image} type="button" className=${sliderIndex === index ? 'image-thumb active' : 'image-thumb'} onClick=${() => setSliderIndex(index)}><img src=${image} alt="thumbnail" /></button>
          `)}
        </${Box}>
      </${Dialog}>
    </div>
  `;
}
