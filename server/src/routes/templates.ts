import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { TemplateField } from '../types';

const router = Router();

function pid(req: Request): string { return req.params.id as string; }
type Body = Record<string, string | undefined>;

function parseFields(raw: string | null | undefined): TemplateField[] {
  try { return JSON.parse(raw ?? '[]'); } catch { return []; }
}

// GET /api/templates
router.get('/', async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.template.findMany({ orderBy: { updatedAt: 'desc' } });
    res.json(templates.map((t) => ({ ...t, fields: parseFields(t.fields as unknown as string) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/templates/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: pid(req) },
      include: { _count: { select: { configurations: true } } },
    });
    if (!template) { res.status(404).json({ error: 'Template not found' }); return; }
    res.json({ ...template, fields: parseFields(template.fields as unknown as string) });
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

    const v = validateFields(fields);
    if (v.error) { res.status(400).json({ error: v.error }); return; }

    const template = await prisma.template.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        category: category ?? null,
        provider: provider ?? null,
        fields: JSON.stringify(fields),
      },
    });

    res.status(201).json({ ...template, fields: parseFields(template.fields as unknown as string) });
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

    if (name !== undefined && !name?.trim()) { res.status(400).json({ error: 'name cannot be empty' }); return; }

    if (fields !== undefined) {
      const v = validateFields(fields);
      if (v.error) { res.status(400).json({ error: v.error }); return; }
    }

    const updated = await prisma.template.update({
      where: { id: pid(req) },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(provider !== undefined && { provider }),
        ...(fields !== undefined && { fields: JSON.stringify(fields) }),
      },
    });

    res.json({ ...updated, fields: parseFields(updated.fields as unknown as string) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE /api/templates/:id — related configurations keep their data (SetNull on templateId)
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

function validateFields(fields: TemplateField[]): { error?: string } {
  if (!Array.isArray(fields)) return { error: 'fields must be an array' };
  const validTypes = ['string', 'number', 'boolean', 'json', 'url'];
  for (const f of fields) {
    if (!f.name?.trim()) return { error: 'Each field must have a name' };
    if (!f.label?.trim()) return { error: 'Each field must have a label' };
    if (!validTypes.includes(f.type)) return { error: `Invalid field type: ${f.type}` };
  }
  return {};
}

export default router;
