import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ArchiveIcon from '@mui/icons-material/Archive';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TuneIcon from '@mui/icons-material/Tune';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import html from '../utils/html';

const drawerWidth = 260;

export default function DashboardLayout() {
  const [open, setOpen] = useState(true);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const links = [
    { label: 'Dashboard', icon: html`<${DashboardIcon} />`, path: '/dashboard' },
    { label: 'Book In', icon: html`<${InventoryIcon} />`, path: '/book-in', adminOnly: true },
    { label: 'Archived BookIns', icon: html`<${ArchiveIcon} />`, path: '/archived-bookins', adminOnly: true },
    { label: 'Reports', icon: html`<${AssessmentIcon} />`, path: '/reports' },
    { label: 'BookIn Fields', icon: html`<${TuneIcon} />`, path: '/fields', adminOnly: true },
    { label: 'Manage Users', icon: html`<${PeopleIcon} />`, path: '/users', adminOnly: true },
    { label: 'Profile', icon: html`<${PersonIcon} />`, path: '/profile' }
  ];

  const visibleLinks = links.filter((item) => !item.adminOnly || isAdmin);

  return html`
    <${Box} className="app-shell">
      <${AppBar} position="fixed" className="topbar">
        <${Toolbar}>
          <${IconButton} color="inherit" onClick=${() => setOpen(!open)}>
            <${MenuIcon} />
          </${IconButton}>
          <${Typography} variant="h6" sx=${{ flexGrow: 1, fontWeight: 800 }}>
            BookIn Appliance System
          </${Typography}>
          <${Typography} sx=${{ mr: 2 }}>${user?.name}</${Typography}>
          <${Button} color="inherit" startIcon=${html`<${LogoutIcon} />`} onClick=${handleLogout}>
            Logout
          </${Button}>
        </${Toolbar}>
      </${AppBar}>

      <${Drawer}
        variant="permanent"
        open=${open}
        sx=${{
          width: open ? drawerWidth : 72,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 72,
            overflowX: 'hidden',
            transition: 'width 0.2s ease'
          }
        }}
      >
        <${Toolbar} />
        <${Box} sx=${{ p: open ? 2 : 1 }}>
          <${Typography} variant="h6" className="brand-title">
            ${open ? 'BookIn' : 'BI'}
          </${Typography}>
        </${Box}>
        <${Divider} />
        <${List}>
          ${visibleLinks.map((item) => html`
            <${ListItemButton} key=${item.path} component=${Link} to=${item.path}>
              <${ListItemIcon}>${item.icon}</${ListItemIcon}>
              ${open && html`<${ListItemText} primary=${item.label} />`}
            </${ListItemButton}>
          `)}
        </${List}>
      </${Drawer}>

      <${Box} component="main" className="main-content">
        <${Toolbar} />
        <${Outlet} />
      </${Box}>
    </${Box}>
  `;
}
