import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { TemplateField, ResolvedField } from '../types';

const router = Router();

function pid(req: Request): string { return req.params.id as string; }
type Body = Record<string, string | undefined>;

// SQLite stores tags and values as JSON strings — these helpers handle conversion
function parseTags(raw: string | null | undefined): string[] {
  try { return JSON.parse(raw ?? '[]'); } catch { return []; }
}
function parseValues(raw: string | null | undefined): Record<string, unknown> {
  try { return JSON.parse(raw ?? '{}'); } catch { return {}; }
}
function parseFields(raw: string | null | undefined): TemplateField[] {
  try { return JSON.parse(raw ?? '[]'); } catch { return []; }
}

// GET /api/configurations — list (values excluded for performance)
router.get('/', async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || undefined;
    const category = (req.query.category as string) || undefined;
    const provider = (req.query.provider as string) || undefined;
    const market = (req.query.market as string) || undefined;
    const environment = (req.query.environment as string) || undefined;
    const type = (req.query.type as string) || undefined;
    const templateId = (req.query.templateId as string) || undefined;

    const all = await prisma.configuration.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const filtered = all.filter((c) => {
      if (category && c.category?.toLowerCase() !== category.toLowerCase()) return false;
      if (provider && c.provider?.toLowerCase() !== provider.toLowerCase()) return false;
      if (market && c.market?.toLowerCase() !== market.toLowerCase()) return false;
      if (environment && c.environment !== environment) return false;
      if (type && c.type !== type) return false;
      if (templateId && c.templateId !== templateId) return false;
      if (search) {
        const s = search.toLowerCase();
        const tags = parseTags(c.tags);
        if (
          !c.name.toLowerCase().includes(s) &&
          !c.description?.toLowerCase().includes(s) &&
          !c.category?.toLowerCase().includes(s) &&
          !c.provider?.toLowerCase().includes(s) &&
          !tags.some((t) => t.toLowerCase().includes(s))
        ) return false;
      }
      return true;
    });

    res.json(filtered.map((c) => ({ ...c, tags: parseTags(c.tags) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
});

// GET /api/configurations/:id — detail with resolvedFields (Decision 4)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const config = await prisma.configuration.findUnique({
      where: { id: pid(req) },
      include: { template: true },
    });

    if (!config) { res.status(404).json({ error: 'Configuration not found' }); return; }

    const values = parseValues(config.values as unknown as string);
    const tmpl = (config as typeof config & { template: { fields: string } | null }).template;
    let resolvedFields: ResolvedField[] = [];

    if (tmpl) {
      const fields = parseFields(tmpl.fields);
      resolvedFields = fields.map((field) => ({
        ...field,
        value: values[field.name] ?? field.defaultValue ?? null,
      }));
    }

    res.json({ ...config, tags: parseTags(config.tags as unknown as string), values, resolvedFields });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// POST /api/configurations
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, category, type, market, provider, environment, notes, templateId } =
      req.body as Body;
    const tags: string[] = req.body.tags ?? [];
    const values: Record<string, unknown> = req.body.values ?? {};

    if (!name?.trim()) { res.status(400).json({ error: 'name is required' }); return; }

    if (templateId) {
      const template = await prisma.template.findUnique({ where: { id: templateId } });
      if (template) {
        const fields = parseFields(template.fields as unknown as string);
        const missing = fields.filter((f) => f.required && !values[f.name]).map((f) => f.name);
        if (missing.length > 0) {
          res.status(400).json({ error: 'Missing required fields', fields: missing });
          return;
        }
      }
    }

    const config = await prisma.configuration.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        category: category ?? null,
        type: type ?? 'json',
        market: market ?? null,
        provider: provider ?? null,
        environment: environment ?? null,
        tags: JSON.stringify(tags),
        values: JSON.stringify(values),
        notes: notes ?? null,
        templateId: templateId ?? null,
      },
    });

    res.status(201).json({ ...config, tags: parseTags(config.tags as unknown as string), values: parseValues(config.values as unknown as string) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create configuration' });
  }
});

// PUT /api/configurations/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.configuration.findUnique({ where: { id: pid(req) } });
    if (!existing) { res.status(404).json({ error: 'Configuration not found' }); return; }

    const { name, description, category, type, market, provider, environment, notes, templateId } =
      req.body as Body;
    const tags: string[] | undefined = req.body.tags;
    const values: Record<string, unknown> | undefined = req.body.values;

    if (name !== undefined && !name?.trim()) {
      res.status(400).json({ error: 'name cannot be empty' }); return;
    }

    const effectiveTemplateId = templateId ?? existing.templateId;
    if (effectiveTemplateId && values !== undefined) {
      const template = await prisma.template.findUnique({ where: { id: effectiveTemplateId } });
      if (template) {
        const fields = parseFields(template.fields as unknown as string);
        const missing = fields.filter((f) => f.required && !values[f.name]).map((f) => f.name);
        if (missing.length > 0) {
          res.status(400).json({ error: 'Missing required fields', fields: missing }); return;
        }
      }
    }

    const updated = await prisma.configuration.update({
      where: { id: pid(req) },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(type !== undefined && { type }),
        ...(market !== undefined && { market }),
        ...(provider !== undefined && { provider }),
        ...(environment !== undefined && { environment }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
        ...(values !== undefined && { values: JSON.stringify(values) }),
        ...(notes !== undefined && { notes }),
        ...(templateId !== undefined && { templateId: templateId || null }),
      },
    });

    res.json({ ...updated, tags: parseTags(updated.tags as unknown as string), values: parseValues(updated.values as unknown as string) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// DELETE /api/configurations/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.configuration.findUnique({ where: { id: pid(req) } });
    if (!existing) { res.status(404).json({ error: 'Configuration not found' }); return; }
    await prisma.configuration.delete({ where: { id: pid(req) } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete configuration' });
  }
});

// POST /api/configurations/:id/duplicate — snapshot clone (Decision 5)
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const original = await prisma.configuration.findUnique({ where: { id: pid(req) } });
    if (!original) { res.status(404).json({ error: 'Configuration not found' }); return; }

    const duplicate = await prisma.configuration.create({
      data: {
        name: `${original.name} (copy)`,
        description: original.description,
        category: original.category,
        type: original.type,
        market: original.market,
        provider: original.provider,
        environment: original.environment,
        tags: original.tags,
        values: original.values,
        notes: original.notes,
        templateId: original.templateId,
      },
    });

    res.status(201).json({ ...duplicate, tags: parseTags(duplicate.tags as unknown as string), values: parseValues(duplicate.values as unknown as string) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to duplicate configuration' });
  }
});

export default router;
