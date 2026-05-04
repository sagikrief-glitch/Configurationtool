-- CreateTable
CREATE TABLE "Configuration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "type" TEXT NOT NULL DEFAULT 'json',
    "market" TEXT,
    "provider" TEXT,
    "environment" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "values" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "templateId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Configuration_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "provider" TEXT,
    "fields" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Configuration_name_idx" ON "Configuration"("name");

-- CreateIndex
CREATE INDEX "Configuration_category_idx" ON "Configuration"("category");

-- CreateIndex
CREATE INDEX "Configuration_provider_idx" ON "Configuration"("provider");

-- CreateIndex
CREATE INDEX "Configuration_market_idx" ON "Configuration"("market");

-- CreateIndex
CREATE INDEX "Configuration_environment_idx" ON "Configuration"("environment");

-- CreateIndex
CREATE INDEX "Configuration_templateId_idx" ON "Configuration"("templateId");

-- CreateIndex
CREATE INDEX "Template_name_idx" ON "Template"("name");

-- CreateIndex
CREATE INDEX "Template_category_idx" ON "Template"("category");
