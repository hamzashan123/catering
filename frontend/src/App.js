import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ArchivedBookIns from './pages/ArchivedBookIns';
import BookInForm from './pages/BookInForm';
import DashboardPage from './pages/DashboardPage';
import Fields from './pages/Fields';
import Login from './pages/Login';
import PrintList from './pages/PrintList';
import PrintStock from './pages/PrintStock';
import DownloadReport from './pages/DownloadReport';
import DownloadLabels from './pages/DownloadLabels';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import SearchResults from './pages/SearchResults';
import Users from './pages/Users';
import ProtectedRoute from './components/ProtectedRoute';
import html from './utils/html';

export default function App() {
  return html`
    <${BrowserRouter}>
      <${Routes}>
        <${Route} path="/login" element=${html`<${Login} />`} />
        <${Route} path="/print-list" element=${html`<${PrintList} />`} />
        <${Route} path="/print-stock/:id" element=${html`<${PrintStock} />`} />
        <${Route} path="/download-report" element=${html`<${DownloadReport} />`} />
        <${Route} path="/download-labels" element=${html`<${DownloadLabels} />`} />

        <${Route} element=${html`<${ProtectedRoute}><${DashboardLayout} /></${ProtectedRoute}>`}>
          <${Route} path="/dashboard" element=${html`<${DashboardPage} />`} />
          <${Route} path="/reports" element=${html`<${Reports} />`} />
          <${Route} path="/search-results" element=${html`<${SearchResults} />`} />
          <${Route} path="/profile" element=${html`<${Profile} />`} />
          <${Route} path="/book-in" element=${html`<${ProtectedRoute} adminOnly=${true}><${BookInForm} /></${ProtectedRoute}>`} />
          <${Route} path="/archived-bookins" element=${html`<${ProtectedRoute} adminOnly=${true}><${ArchivedBookIns} /></${ProtectedRoute}>`} />
          <${Route} path="/fields" element=${html`<${ProtectedRoute} adminOnly=${true}><${Fields} /></${ProtectedRoute}>`} />
          <${Route} path="/users" element=${html`<${ProtectedRoute} adminOnly=${true}><${Users} /></${ProtectedRoute}>`} />
        </${Route}>

        <${Route} path="*" element=${html`<${Navigate} to="/dashboard" replace />`} />
      </${Routes}>
    </${BrowserRouter}>
  `;
}
