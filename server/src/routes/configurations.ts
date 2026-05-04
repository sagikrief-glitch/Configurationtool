import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { TemplateField, ResolvedField } from '../types';

const router = Router();

function pid(req: Request): string { return req.params.id as string; }
type Body = Record<string, string | undefined>;

function toJson(val: unknown): Prisma.InputJsonValue {
  return val as unknown as Prisma.InputJsonValue;
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

    const where: Prisma.ConfigurationWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
        { category: { contains: search, mode: 'insensitive' } },
        { provider: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = { equals: category, mode: 'insensitive' };
    if (provider) where.provider = { equals: provider, mode: 'insensitive' };
    if (market) where.market = { equals: market, mode: 'insensitive' };
    if (environment) where.environment = environment;
    if (type) where.type = type;
    if (templateId) where.templateId = templateId;

    const configurations = await prisma.configuration.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        type: true,
        market: true,
        provider: true,
        environment: true,
        tags: true,
        templateId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(configurations);
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

    const values = (config.values as Record<string, unknown>) ?? {};
    const tmpl = (config as typeof config & { template: { fields: unknown } | null }).template;
    let resolvedFields: ResolvedField[] = [];

    if (tmpl) {
      const fields = (tmpl.fields as unknown as TemplateField[]) ?? [];
      resolvedFields = fields.map((field) => ({
        ...field,
        value: values[field.name] ?? field.defaultValue ?? null,
      }));
    }

    res.json({ ...config, resolvedFields });
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
        const fields = (template.fields as unknown as TemplateField[]) ?? [];
        const missing = fields.filter((f) => f.required && !values[f.name]).map((f) => f.name);
        if (missing.length > 0) {
          res.status(400).json({ error: 'Missing required fields', fields: missing }); return;
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
        tags,
        values: toJson(values),
        notes: notes ?? null,
        templateId: templateId ?? null,
      },
    });

    res.status(201).json(config);
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
        const fields = (template.fields as unknown as TemplateField[]) ?? [];
        const missing = fields.filter((f) => f.required && !values[f.name]).map((f) => f.name);
        if (missing.length > 0) {
          res.status(400).json({ error: 'Missing required fields', fields: missing }); return;
        }
      }
    }

    const updateData: Prisma.ConfigurationUpdateInput = {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(type !== undefined && { type }),
      ...(market !== undefined && { market }),
      ...(provider !== undefined && { provider }),
      ...(environment !== undefined && { environment }),
      ...(tags !== undefined && { tags }),
      ...(values !== undefined && { values: toJson(values) }),
      ...(notes !== undefined && { notes }),
      ...(templateId !== undefined && {
        template: templateId ? { connect: { id: templateId } } : { disconnect: true },
      }),
    };

    const updated = await prisma.configuration.update({
      where: { id: pid(req) },
      data: updateData,
    });

    res.json(updated);
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
        tags: [...original.tags],
        values: toJson(original.values),
        notes: original.notes,
        templateId: original.templateId,
      },
    });

    res.status(201).json(duplicate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to duplicate configuration' });
  }
});

export default router;
