import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import configurationsRouter from './routes/configurations';
import templatesRouter from './routes/templates';
import { errorHandler, notFound } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/configurations', configurationsRouter);
app.use('/api/templates', templatesRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
