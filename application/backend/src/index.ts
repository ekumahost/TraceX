import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';

const PORT = process.env.PORT || 4000;

createApp().listen(PORT, () => {
  console.log(`TraceX backend listening on http://localhost:${PORT}`);
});
