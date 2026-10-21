import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Nexus backend server running on http://localhost:${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`Inventory endpoint: http://localhost:${PORT}/api/inventory`);
  console.log(`Transfer opportunities: http://localhost:${PORT}/api/transfers/opportunities`);
});
