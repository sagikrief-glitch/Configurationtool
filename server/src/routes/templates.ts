import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { TemplateField } from '../types';

const router = Router();

function pid(req: Request): string { return req.params.id as string; }
type Body = Record<string, string | undefined>;

function toJson(val: unknown): Prisma.InputJsonValue {
  return val as unknown as Prisma.InputJsonValue;
}

// GET /api/templates
router.get('/', async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/templates/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const template = await prisma.template.findUnique({ where: { id: pid(req) } });
    if (!template) { res.status(404).json({ error: 'Template not found' }); return; }
    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST /api/templates
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, category, provider } = req.body as Body;
    const fields: TemplateField[] = req.body.fields ?? [];

    if (!name?.trim()) { res.status(400).json({ error: 'name is required' }); return; }

    const template = await prisma.template.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        category: category ?? null,
        provider: provider ?? null,
        fields: toJson(fields),
      },
    });

    res.status(201).json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PUT /api/templates/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.template.findUnique({ where: { id: pid(req) } });
    if (!existing) { res.status(404).json({ error: 'Template not found' }); return; }

    const { name, description, category, provider } = req.body as Body;
    const fields: TemplateField[] | undefined = req.body.fields;

    if (name !== undefined && !name?.trim()) {
      res.status(400).json({ error: 'name cannot be empty' }); return;
    }

    const updateData: Prisma.TemplateUpdateInput = {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(provider !== undefined && { provider }),
      ...(fields !== undefined && { fields: toJson(fields) }),
    };

    const updated = await prisma.template.update({
      where: { id: pid(req) },
      data: updateData,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.template.findUnique({ where: { id: pid(req) } });
    if (!existing) { res.status(404).json({ error: 'Template not found' }); return; }
    await prisma.template.delete({ where: { id: pid(req) } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
