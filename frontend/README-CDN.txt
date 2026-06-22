CDN Frontend Version
====================

This frontend does not need npm install or npm run build.

How to use:
1. Upload the frontend folder contents to your web server.
2. Open index.html through a web server/domain, not file://.
3. Edit API_BASE_URL inside index.html if your backend path is different.

Example:
window.APP_CONFIG = {
  API_BASE_URL: 'https://yourdomain.com/backend'
};

React, React DOM, React Router, Material UI, Axios, html2canvas and jsPDF load from CDN using import maps.
