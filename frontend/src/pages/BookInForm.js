import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
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
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import html from '../utils/html';

const emptyForm = {
  id: '', make: '', model: '', serial_no: '', type_id: '', qty: 1,
  length_mm: '', depth_mm: '', condition_grade: '', stock_category: '',
  client_id: '', owner_id: '', removed_from: '', pm_id: '', date_received: '', charge_date: '',
  action_status: '', notes: ''
};

const blankImage = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="#f5f5f5"/>
    <rect x="170" y="135" width="460" height="330" rx="16" fill="#fff" stroke="#d0d5dd" stroke-width="4"/>
    <path d="M235 400 L360 310 L460 380 L535 330 L590 400 Z" fill="#98a2b3"/>
    <circle cx="315" cy="260" r="42" fill="#d0d5dd"/>
    <text x="400" y="500" text-anchor="middle" font-family="Arial" font-size="28" fill="#667085">Upload Image</text>
  </svg>
`);

export default function BookInForm() {
  const [form, setForm] = useState(emptyForm);
  const [dropdowns, setDropdowns] = useState({ clients: [], owners: [], pms: [], types: [] });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedExistingImageIds, setRemovedExistingImageIds] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [bookIns, setBookIns] = useState([]);
  const [recordSearch, setRecordSearch] = useState('');
  const [sliderImages, setSliderImages] = useState([]);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [loadingTable, setLoadingTable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const newImagePreviews = useMemo(() => images.map((image) => ({
    name: image.name,
    url: URL.createObjectURL(image),
    isNew: true
  })), [images]);

  useEffect(() => { loadPageData(); }, []);
  useEffect(() => () => newImagePreviews.forEach((image) => URL.revokeObjectURL(image.url)), [newImagePreviews]);

  async function loadPageData() {
    await Promise.all([loadDropdowns(), loadBookIns()]);
  }

  async function loadDropdowns() {
    try {
      const response = await api.get('/dropdowns');
      setDropdowns(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load dropdown data.');
    }
  }

  async function loadBookIns() {
    setLoadingTable(true);
    try {
      const response = await api.get('/bookins?sort=created_at&dir=DESC');
      setBookIns(response.data.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load Book In records.');
    } finally {
      setLoadingTable(false);
    }
  }

  function addDays(value, days) {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function changeField(name, value) {
    setForm((current) => {
      if (name === 'date_received') {
        const previousDefaultChargeDate = addDays(current.date_received, 30);
        const shouldAutoUpdateChargeDate = !current.charge_date || current.charge_date === previousDefaultChargeDate;
        return {
          ...current,
          date_received: value,
          charge_date: shouldAutoUpdateChargeDate ? addDays(value, 30) : current.charge_date
        };
      }

      return { ...current, [name]: value };
    });
  }

  function selectImages(event) {
    const selectedFiles = Array.from(event.target.files);

    if (!selectedFiles.length) {
      return;
    }

    setImages((currentImages) => {
      const nextImages = [...currentImages, ...selectedFiles];

      if (existingImages.length + currentImages.length === 0 && nextImages.length > 0) {
        setSelectedImageIndex(0);
      }

      return nextImages;
    });

    event.target.value = '';
  }

  function adjustSelectedIndexAfterRemove(indexToRemove, nextTotal) {
    setSelectedImageIndex((currentIndex) => {
      if (nextTotal === 0) {
        return 0;
      }

      if (currentIndex > indexToRemove) {
        return currentIndex - 1;
      }

      if (currentIndex >= nextTotal) {
        return nextTotal - 1;
      }

      return currentIndex;
    });
  }

  function removeSelectedImage(indexToRemove) {
    const existingCount = existingImages.length;

    if (indexToRemove < existingCount) {
      const imageToRemove = existingImages[indexToRemove];

      if (imageToRemove?.id) {
        setRemovedExistingImageIds((currentIds) => [...currentIds, imageToRemove.id]);
      }

      setExistingImages((currentImages) => {
        const nextExistingImages = currentImages.filter((_, index) => index !== indexToRemove);
        adjustSelectedIndexAfterRemove(indexToRemove, nextExistingImages.length + images.length);
        return nextExistingImages;
      });

      return;
    }

    const newImageIndex = indexToRemove - existingCount;

    setImages((currentImages) => {
      const nextImages = currentImages.filter((_, index) => index !== newImageIndex);
      adjustSelectedIndexAfterRemove(indexToRemove, existingCount + nextImages.length);
      return nextImages;
    });
  }

  function clearForm() {
    setForm(emptyForm);
    setImages([]);
    setExistingImages([]);
    setRemovedExistingImageIds([]);
    setSelectedImageIndex(0);
  }

  async function editRecord(id) {
    setSaving(true);
    setError('');
    try {
      const response = await api.get(`/bookins/${id}`);
      const record = response.data.data;
      setForm({
        id: record.id,
        make: record.make || '',
        model: record.model || '',
        serial_no: record.serial_no || '',
        type_id: record.type_id || '',
        qty: record.qty || 1,
        length_mm: record.length_mm || '',
        depth_mm: record.depth_mm || '',
        condition_grade: record.condition_grade || '',
        stock_category: record.stock_category || '',
        client_id: record.client_id || '',
        owner_id: record.owner_id || '',
        removed_from: record.removed_from || '',
        pm_id: record.pm_id || '',
        date_received: record.date_received || '',
        charge_date: record.charge_date || record.effective_charge_date || '',
        action_status: record.action_status || '',
        notes: record.notes || ''
      });
      setImages([]);
      setRemovedExistingImageIds([]);
      setExistingImages((record.images || []).map((image) => ({
        id: image.id,
        name: image.original_name || 'Image',
        url: imageUrl(image.file_path),
        isNew: false
      })));
      setSelectedImageIndex(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load selected Book In record.');
    } finally {
      setSaving(false);
    }
  }

  async function saveBookIn(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    Object.keys(form).forEach((key) => formData.append(key, form[key]));
    images.forEach((image) => formData.append('images[]', image));
    removedExistingImageIds.forEach((imageId) => formData.append('remove_image_ids[]', imageId));

    try {
      if (form.id) {
        await api.post(`/bookins/${form.id}`, formData);
        setMessage('Book In record updated successfully.');
      } else {
        await api.post('/bookins', formData);
        setMessage('Book In record saved successfully.');
      }
      clearForm();
      await loadBookIns();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save Book In record.');
    } finally {
      setSaving(false);
    }
  }

  async function archiveRecord(id) {
    if (!window.confirm('Are you sure you want to archive this Book In record?')) return;
    try {
      await api.delete(`/bookins/${id}`);
      setMessage('Book In record archived successfully.');
      if (String(form.id) === String(id)) clearForm();
      await loadBookIns();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to archive Book In record.');
    }
  }

  function imageUrl(path) {
    if (!path) return blankImage;
    return `${api.defaults.baseURL}${path}`;
  }

  function rowImages(row) {
    const paths = row.image_paths ? row.image_paths.split('||').filter(Boolean) : [];
    if (!paths.length && row.first_image) paths.push(row.first_image);
    return paths.map((path) => imageUrl(path));
  }

  function openRecordSlider(row) {
    const imagesForRow = rowImages(row);
    if (!imagesForRow.length) return;
    setSliderImages(imagesForRow);
    setSliderIndex(0);
  }

  function previousSliderImage() {
    setSliderIndex((current) => current === 0 ? sliderImages.length - 1 : current - 1);
  }

  function nextSliderImage() {
    setSliderIndex((current) => current === sliderImages.length - 1 ? 0 : current + 1);
  }

  function printAllStockLabels() {
    const ids = filteredBookIns.map((row) => row.id);
    if (!ids.length) return;
    const params = new URLSearchParams();
    params.set('ids', ids.join(','));
    window.open(`/print-stock/all?${params.toString()}`, '_blank');
  }

  function downloadAllStockLabels() {
    const ids = filteredBookIns.map((row) => row.id);
    if (!ids.length) return;
    const params = new URLSearchParams();
    params.set('ids', ids.join(','));
    window.open(`/download-labels?${params.toString()}`, '_blank');
  }

  const filteredBookIns = bookIns.filter((row) => {
    const search = recordSearch.trim().toLowerCase();
    if (!search) return true;

    return [
      row.stock_code, row.client, row.owner, row.pm, row.appliance_type, row.make,
      row.model, row.serial_no, row.condition_grade, row.stock_category, row.action_status, row.removed_from
    ].some((value) => String(value || '').toLowerCase().includes(search));
  });

  const previewImages = [...existingImages, ...newImagePreviews];
  const mainPreview = previewImages[selectedImageIndex]?.url || blankImage;
  const selectedClient = dropdowns.clients.find((client) => String(client.id) === String(form.client_id));
  const stockTitle = selectedClient?.name || 'New Stock Item';

  function dropdown(name, label, items) {
    return html`
      <${TextField} select fullWidth size="small" label=${label} value=${form[name]} onChange=${(event) => changeField(name, event.target.value)}>
        ${items.map((item) => html`<${MenuItem} key=${item.id} value=${item.id}>${item.name}</${MenuItem}>`)}
      </${TextField}>
    `;
  }

  function radioButtons(name, label, options) {
    return html`
      <${FormControl} className="bookin-radio-group">
        <${FormLabel}>${label}</${FormLabel}>
        <${RadioGroup} row value=${form[name]} onChange=${(event) => changeField(name, event.target.value)}>
          ${options.map((option) => html`
            <${FormControlLabel} key=${option} value=${option} control=${html`<${Radio} />`} label=${option} />
          `)}
        </${RadioGroup}>
      </${FormControl}>
    `;
  }

  return html`
    <div>
      <${Typography} variant="h4" className="page-title">Book In</${Typography}>
      ${error && html`<${Alert} severity="error" sx=${{ mb: 2 }}>${error}</${Alert}>`}
      ${message && html`<${Alert} severity="success" sx=${{ mb: 2 }}>${message}</${Alert}>`}

      <${Box} component="form" onSubmit=${saveBookIn}>
        <${Grid} container spacing=${3} className="bookin-reference-layout">
          <${Grid} item xs=${12} md=${4}>
            <${Card} className="bookin-photo-card">
              <${CardContent}>
                <${Typography} variant="h5" className="client-heading">${stockTitle}</${Typography}>
                <${Typography} variant="h6" className="stock-code-heading">
                  Stock Code: ${form.id ? (bookIns.find((item) => String(item.id) === String(form.id))?.stock_code || 'Editing') : 'New'}
                </${Typography}>
                <${Box} className="main-image-box reference-main-image" onClick=${() => setPreviewOpen(true)}>
                  <img src=${mainPreview} alt="Selected appliance" />
                </${Box}>
                <${Box} className="image-thumb-strip reference-thumb-strip">
                  ${previewImages.length === 0 && [0, 1, 2, 3].map((item) => html`<${Box} key=${item} className="empty-thumb" />`)}
                  ${previewImages.map((image, index) => html`
                    <${Box} key=${image.name + index} className="image-thumb-wrap">
                      <button type="button" className=${selectedImageIndex === index ? 'image-thumb active' : 'image-thumb'} onClick=${() => setSelectedImageIndex(index)}>
                        <img src=${image.url} alt=${image.name} />
                      </button>
                      <button type="button" className="image-remove-btn" onClick=${(event) => { event.stopPropagation(); removeSelectedImage(index); }} aria-label="Remove image">×</button>
                    </${Box}>
                  `)}
                </${Box}>
                <${Box} className="upload-actions">
                  <${Button} variant="contained" component="label" className="blue-button">
                    Choose Images
                    <input hidden multiple accept="image/*" type="file" onChange=${selectImages} />
                  </${Button}>
                  <${Button} variant="outlined" color="error" onClick=${() => { setImages([]); setRemovedExistingImageIds((currentIds) => [...currentIds, ...existingImages.map((image) => image.id).filter(Boolean)]); setExistingImages([]); setSelectedImageIndex(0); }}>
                    Clear
                  </${Button}>
                </${Box}>
              </${CardContent}>
            </${Card}>
          </${Grid}>

          <${Grid} item xs=${12} md=${8}>
            <${Grid} container spacing=${2}>
              <${Grid} item xs=${12} lg=${6}>
                <${Card} className="reference-form-card">
                  <${CardContent}>
                    <${Grid} container spacing=${1.5} alignItems="center">
                      <${Grid} item xs=${12}><${TextField} fullWidth size="small" label="Make" value=${form.make} onChange=${(e) => changeField('make', e.target.value)} /></${Grid}>
                      <${Grid} item xs=${12}><${TextField} fullWidth size="small" label="Model" value=${form.model} onChange=${(e) => changeField('model', e.target.value)} /></${Grid}>
                      <${Grid} item xs=${12}><${TextField} fullWidth size="small" label="Serial No" value=${form.serial_no} onChange=${(e) => changeField('serial_no', e.target.value)} /></${Grid}>
                      <${Grid} item xs=${8}>${dropdown('type_id', 'Type', dropdowns.types)}</${Grid}>
                      <${Grid} item xs=${4}><${TextField} fullWidth size="small" type="number" label="Qty" value=${form.qty} onChange=${(e) => changeField('qty', e.target.value)} /></${Grid}>
                      <${Grid} item xs=${12}>
                        <${FormLabel} className="dimensions-label">Fabs/Custom Only</${FormLabel}>
                      </${Grid}>
                      <${Grid} item xs=${5}><${TextField} fullWidth size="small" label="Length mm" value=${form.length_mm} onChange=${(e) => changeField('length_mm', e.target.value)} /></${Grid}>
                      <${Grid} item xs=${2} className="dimension-x">X</${Grid}>
                      <${Grid} item xs=${5}><${TextField} fullWidth size="small" label="Depth mm" value=${form.depth_mm} onChange=${(e) => changeField('depth_mm', e.target.value)} /></${Grid}>
                      <${Grid} item xs=${12}>${radioButtons('condition_grade', 'Condition', ['A', 'B', 'C', 'D'])}</${Grid}>
                      <${Grid} item xs=${12}>${radioButtons('stock_category', 'Stock Category', ['NSE', 'S/Hand'])}</${Grid}>
                    </${Grid}>
                  </${CardContent}>
                </${Card}>
              </${Grid}>

              <${Grid} item xs=${12} lg=${6}>
                <${Card} className="reference-form-card">
                  <${CardContent}>
                    <${Grid} container spacing=${1.5}>
                      <${Grid} item xs=${12}>${dropdown('client_id', 'Client', dropdowns.clients)}</${Grid}>
                      <${Grid} item xs=${12}>${dropdown('owner_id', 'Owner', dropdowns.owners)}</${Grid}>
                      <${Grid} item xs=${12}><${TextField} fullWidth size="small" label="Removed From" value=${form.removed_from} onChange=${(e) => changeField('removed_from', e.target.value)} /></${Grid}>
                      <${Grid} item xs=${12}>${dropdown('pm_id', 'PM', dropdowns.pms)}</${Grid}>
                      <${Grid} item xs=${12}><${TextField} fullWidth size="small" type="date" label="Date RCVD" InputLabelProps=${{ shrink: true }} value=${form.date_received} onChange=${(e) => changeField('date_received', e.target.value)} /></${Grid}>
                      <${Grid} item xs=${12}><${TextField} fullWidth size="small" type="date" label="Charge Date" InputLabelProps=${{ shrink: true }} value=${form.charge_date} onChange=${(e) => changeField('charge_date', e.target.value)} /></${Grid}>
                      <${Grid} item xs=${12}>${radioButtons('action_status', 'Action', ['Sell', 'Hold', 'Scrap', 'Refurb'])}</${Grid}>
                    </${Grid}>
                  </${CardContent}>
                </${Card}>
              </${Grid}>

              <${Grid} item xs=${12}>
                <${TextField} className="notes-area" fullWidth multiline minRows=${5} label="Notes" value=${form.notes} onChange=${(e) => changeField('notes', e.target.value)} />
                <${Box} className="form-footer">
                  <${Button} variant="outlined" onClick=${clearForm}>New / Clear</${Button}>
                  <${Button} type="submit" variant="contained" size="large" disabled=${saving} className="blue-button">
                    ${saving ? 'Saving...' : (form.id ? 'Update Book In' : 'Save Book In')}
                  </${Button}>
                </${Box}>
              </${Grid}>
            </${Grid}>
          </${Grid}>
        </${Grid}>
      </${Box}>

      <${Card} className="content-card latest-bookin-card">
        <${Box} className="table-title-row">
          <${Box}><${Typography} variant="h6" fontWeight=${900}>All Book In Records</${Typography}><${Typography} color="text.secondary" fontSize=${14}>Latest created record appears first. Search, view images, edit, print, or archive records.</${Typography}></${Box}>
          <${Box} className="table-search-actions">
            <${TextField} size="small" label="Search records" value=${recordSearch} onChange=${(event) => setRecordSearch(event.target.value)} />
            <${Button} variant="outlined" onClick=${printAllStockLabels} disabled=${filteredBookIns.length === 0}>Print Labels</${Button}>
            <${Button} variant="outlined" color="success" onClick=${downloadAllStockLabels} disabled=${filteredBookIns.length === 0}>Download Labels</${Button}>
            <${Button} variant="outlined" onClick=${loadBookIns}>Refresh</${Button}>
          </${Box}>
        </${Box}>
        <${Paper} className="table-wrap" variant="outlined">
          <${Table} size="small">
            <${TableHead}>
              <${TableRow}>
                <${TableCell}>Image</${TableCell}><${TableCell}>SC</${TableCell}><${TableCell}>Client</${TableCell}><${TableCell}>Appliance Type</${TableCell}><${TableCell}>Condition</${TableCell}><${TableCell}>Action</${TableCell}><${TableCell}>Stock Cat</${TableCell}><${TableCell}>PM</${TableCell}><${TableCell} align="right">Options</${TableCell}>
              </${TableRow}>
            </${TableHead}>
            <${TableBody}>
              ${loadingTable && html`<${TableRow}><${TableCell} colSpan=${9}>Loading records...</${TableCell}></${TableRow}>`}
              ${!loadingTable && filteredBookIns.length === 0 && html`<${TableRow}><${TableCell} colSpan=${9}>No Book In records found.</${TableCell}></${TableRow}>`}
              ${!loadingTable && filteredBookIns.map((row) => html`
                <${TableRow} key=${row.id} hover>
                  <${TableCell}><button className="image-button" type="button" onClick=${() => openRecordSlider(row)}><img className="table-image" src=${imageUrl(row.first_image)} alt="Appliance" /></button></${TableCell}>
                  <${TableCell}>${row.stock_code}</${TableCell}><${TableCell}>${row.client || '-'}</${TableCell}><${TableCell}>${row.appliance_type || '-'}</${TableCell}><${TableCell}>${row.condition_grade || '-'}</${TableCell}><${TableCell}>${row.action_status || '-'}</${TableCell}><${TableCell}>${row.stock_category || '-'}</${TableCell}><${TableCell}>${row.pm || '-'}</${TableCell}>
                  <${TableCell} align="right">
                    <${IconButton} color="primary" onClick=${() => editRecord(row.id)}><${EditIcon} /></${IconButton}>
                    <${IconButton} color="primary" href=${`/print-stock/${row.id}`} target="_blank"><${PrintIcon} /></${IconButton}>
                    <${IconButton} color="error" onClick=${() => archiveRecord(row.id)}><${DeleteIcon} /></${IconButton}>
                  </${TableCell}>
                </${TableRow}>
              `)}
            </${TableBody}>
          </${Table}>
        </${Paper}>
      </${Card}>

      <${Dialog} open=${previewOpen} onClose=${() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <${Box} className="image-dialog-header"><${Typography} fontWeight=${900}>Image Preview</${Typography}><${IconButton} onClick=${() => setPreviewOpen(false)}><${CloseIcon} /></${IconButton}></${Box}>
        <${Box} className="image-dialog-body"><img src=${mainPreview} alt="Large appliance preview" /></${Box}>
      </${Dialog}>

      <${Dialog} open=${sliderImages.length > 0} onClose=${() => setSliderImages([])} maxWidth="lg" fullWidth>
        <${Box} className="image-dialog-header">
          <${Typography} fontWeight=${900}>Record Images ${sliderImages.length ? `${sliderIndex + 1} / ${sliderImages.length}` : ''}</${Typography}>
          <${IconButton} onClick=${() => setSliderImages([])}><${CloseIcon} /></${IconButton}>
        </${Box}>
        <${Box} className="slider-dialog-body">
          ${sliderImages.length > 1 && html`<${IconButton} className="slider-arrow left" onClick=${previousSliderImage}><${NavigateBeforeIcon} /></${IconButton}>`}
          ${sliderImages.length > 0 && html`<img src=${sliderImages[sliderIndex]} alt="Large appliance" />`}
          ${sliderImages.length > 1 && html`<${IconButton} className="slider-arrow right" onClick=${nextSliderImage}><${NavigateNextIcon} /></${IconButton}>`}
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
