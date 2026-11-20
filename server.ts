import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from './src/server/firebase-admin.ts';
import { runBalanceAiChat, type AssistantRole } from './src/server/ai-service.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const aiRequestSchema = z.object({
  role: z.enum(['ceo', 'sales', 'project', 'finance', 'hr', 'marketing', 'support']),
  message: z.string().min(1).max(4000),
  language: z.enum(['ar', 'en']).default('ar'),
  userRole: z.string().min(1).max(64),
  authorizedContext: z.record(z.string(), z.unknown()).default({}),
});

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'balance-os',
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/v1/ai/chat', requireAuth, async (req: AuthRequest, res) => {
    const parsed = aiRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid AI request payload.', issues: parsed.error.issues });
      return;
    }

    try {
      const result = await runBalanceAiChat({
        role: parsed.data.role as AssistantRole,
        message: parsed.data.message,
        language: parsed.data.language,
        userEmail: req.user?.email ?? 'unknown',
        userRole: parsed.data.userRole,
        authorizedContext: parsed.data.authorizedContext,
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI service error';
      console.error('AI Chat Error:', error);
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/v1/ai/summarize', requireAuth, async (req: AuthRequest, res) => {
    const parsed = aiRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid summary payload.' });
      return;
    }

    try {
      const result = await runBalanceAiChat({
        role: parsed.data.role as AssistantRole,
        message: `Provide a structured executive brief for: ${parsed.data.message}`,
        language: parsed.data.language,
        userEmail: req.user?.email ?? 'unknown',
        userRole: parsed.data.userRole,
        authorizedContext: parsed.data.authorizedContext,
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI summary error';
      console.error('AI Summary Error:', error);
      res.status(502).json({ error: message });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`BALANCE OS server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BALANCE OS server:', err);
  process.exit(1);
});
