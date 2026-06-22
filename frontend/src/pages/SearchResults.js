import {
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import html from '../utils/html';

export default function SearchResults() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [sort, setSort] = useState('stock_code');
  const [dir, setDir] = useState('ASC');
  const [sliderImages, setSliderImages] = useState([]);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [resetChargeDate, setResetChargeDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { isAdmin } = useAuth();
  const location = useLocation();

  async function loadRows() {
    const params = new URLSearchParams(location.search);
    params.set('sort', sort);
    params.set('dir', dir);
    const response = await api.get(`/bookins?${params.toString()}`);
    setRows(response.data.data);
  }

  useEffect(() => { loadRows(); }, [location.search, sort, dir]);

  function toggleSelection(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAll(event) {
    setSelected(event.target.checked ? rows.map((row) => row.id) : []);
  }

  function changeSort(column) {
    if (sort === column) {
      setDir(dir === 'ASC' ? 'DESC' : 'ASC');
      return;
    }
    setSort(column);
    setDir('ASC');
  }

  async function archiveSelected() {
    if (!selected.length) return;
    if (!window.confirm('Archive selected records?')) return;
    try {
      await api.post('/bookins/archive', { ids: selected });
      setSelected([]);
      setMessage('Selected records archived.');
      setError('');
      loadRows();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to archive selected records.');
    }
  }

  async function resetSelectedChargeDate() {
    if (!isAdmin || !selected.length || !resetChargeDate) return;
    try {
      await api.post('/bookins/reset-charge-date', { ids: selected, charge_date: resetChargeDate });
      setMessage('Charge date reset for selected records.');
      setError('');
      await loadRows();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset charge date.');
    }
  }

  function selectedOrAllIds() {
    return selected.length ? selected : rows.map((row) => row.id);
  }

  function printSelected() {
    const ids = selectedOrAllIds();
    const currentParams = new URLSearchParams(location.search);
    currentParams.set('ids', ids.join(','));
    window.open(`/print-list?${currentParams.toString()}`, '_blank');
  }

  function printStockLabels() {
    const ids = selectedOrAllIds();
    const currentParams = new URLSearchParams(location.search);
    currentParams.set('ids', ids.join(','));
    window.open(`/print-stock/all?${currentParams.toString()}`, '_blank');
  }

  function downloadReport() {
    const ids = selectedOrAllIds();
    const currentParams = new URLSearchParams(location.search);
    currentParams.set('ids', ids.join(','));
    window.open(`/download-report?${currentParams.toString()}`, '_blank');
  }

  function downloadLabels() {
    const ids = selectedOrAllIds();
    const currentParams = new URLSearchParams(location.search);
    currentParams.set('ids', ids.join(','));
    window.open(`/download-labels?${currentParams.toString()}`, '_blank');
  }

  function formatDate(value) {
    if (!value) return '';

    const parts = String(value).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return value;
  }

  function pmInitials(value) {
    if (!value) return '';
    const text = String(value).trim();
    if (!text.includes(' ')) return text;
    return text.split(/\s+/).map((part) => part[0] || '').join('').toUpperCase();
  }

  function heldChargeLabel(row) {
    const held = Number(row.held_days || 0);
    const charge = Number(row.chargeable_days || 0);
    return `${held}-${charge}`;
  }


  function fullImage(path) {
    return `${api.defaults.baseURL}${path}`;
  }

  function rowImages(row) {
    const paths = row.image_paths ? row.image_paths.split('||').filter(Boolean) : [];
    if (!paths.length && row.first_image) paths.push(row.first_image);
    return paths.map(fullImage);
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

  const columns = [
    ['stock_code', 'SC'], ['client', 'Client'], ['removed_from', 'Removed From'], ['appliance_type', 'Appliance Type'],
    ['condition_grade', 'Condition'], ['action_status', 'Action'], ['stock_category', 'Stock Cat'],
    ['chargeable_days', 'Days Held/Charge'], ['pm', 'PM']
  ];

  return html`
    <div>
      <${Typography} variant="h4" className="page-title">Search Results</${Typography}>
      ${error && html`<div className="alert-error">${error}</div>`}
      ${message && html`<div className="alert-success">${message}</div>`}
      <${Card} className="content-card">
        <${Box} className="table-actions report-action-buttons">
          ${isAdmin && html`<${Button} variant="outlined" color="error" onClick=${archiveSelected} disabled=${!selected.length}>Remove / Archive</${Button}>`}
          ${isAdmin && html`<${TextField} size="small" type="date" label="Reset Charge Date" InputLabelProps=${{ shrink: true }} value=${resetChargeDate} onChange=${(e) => setResetChargeDate(e.target.value)} className="reset-charge-date-field" />`}
          ${isAdmin && html`<${Button} variant="outlined" onClick=${resetSelectedChargeDate} disabled=${!selected.length || !resetChargeDate}>Reset Charge Date</${Button}>`}
          <${Button} variant="contained" className="label-print-button" onClick=${printStockLabels}>Print Labels</${Button}>
          <${Button} variant="contained" className="label-download-button" onClick=${downloadLabels}>Download Labels</${Button}>
          <${Button} variant="contained" className="report-print-button" onClick=${printSelected}>Print Reports</${Button}>
          <${Button} variant="contained" className="report-download-button" onClick=${downloadReport}>Download Reports</${Button}>
        </${Box}>
        <${Box} className="table-wrap">
          <${Table}>
            <${TableHead}>
              <${TableRow}>
                <${TableCell} padding="checkbox"><${Checkbox} onChange=${toggleAll} checked=${rows.length > 0 && selected.length === rows.length} /></${TableCell}>
                <${TableCell}>Image</${TableCell}>
                ${columns.map(([key, label]) => html`<${TableCell} key=${key} onClick=${() => changeSort(key)} className="sortable-cell">${label} ${sort === key ? (dir === 'ASC' ? '▲' : '▼') : ''}</${TableCell}>`)}
              </${TableRow}>
            </${TableHead}>
            <${TableBody}>
              ${rows.map((row) => html`
                <${TableRow} key=${row.id} hover>
                  <${TableCell} padding="checkbox"><${Checkbox} checked=${selected.includes(row.id)} onChange=${() => toggleSelection(row.id)} /></${TableCell}>
                  <${TableCell}>
                    ${row.first_image && html`<button className="image-button" type="button" onClick=${() => openImageSlider(row)}><img className="table-image" src=${fullImage(row.first_image)} alt="appliance" /></button>`}
                  </${TableCell}>
                  <${TableCell}>${row.stock_code}</${TableCell}><${TableCell}>${row.client}</${TableCell}><${TableCell}>${row.removed_from}</${TableCell}><${TableCell}>${row.appliance_type}</${TableCell}><${TableCell}>${row.condition_grade}</${TableCell}><${TableCell}>${row.action_status}</${TableCell}><${TableCell}>${row.stock_category}</${TableCell}><${TableCell}>${heldChargeLabel(row)}</${TableCell}><${TableCell}>${pmInitials(row.pm)}</${TableCell}>
                </${TableRow}>
              `)}
            </${TableBody}>
          </${Table}>
        </${Box}>
      </${Card}>

      <${Dialog} open=${sliderImages.length > 0} onClose=${() => setSliderImages([])} maxWidth="lg" fullWidth>
        <${Box} className="image-dialog-header">
          <${Typography} fontWeight=${900}>Appliance Images ${sliderImages.length ? `${sliderIndex + 1} / ${sliderImages.length}` : ''}</${Typography}>
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
