-- CreateTable for Configuration Tool — PostgreSQL / Supabase
CREATE TABLE "Configuration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "type" TEXT NOT NULL DEFAULT 'json',
    "market" TEXT,
    "provider" TEXT,
    "environment" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "values" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "provider" TEXT,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Configuration_name_idx" ON "Configuration"("name");
CREATE INDEX "Configuration_category_idx" ON "Configuration"("category");
CREATE INDEX "Configuration_provider_idx" ON "Configuration"("provider");
CREATE INDEX "Configuration_market_idx" ON "Configuration"("market");
CREATE INDEX "Configuration_environment_idx" ON "Configuration"("environment");
CREATE INDEX "Configuration_templateId_idx" ON "Configuration"("templateId");
CREATE INDEX "Template_name_idx" ON "Template"("name");
CREATE INDEX "Template_category_idx" ON "Template"("category");

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "Template"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
