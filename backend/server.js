import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health\n`);
});