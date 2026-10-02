import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Property Intelligence REST API Server running on port ${PORT}`);
  console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
  console.log(`🌐 Allowed CORS Origin: ${env.FRONTEND_URL}`);
});
