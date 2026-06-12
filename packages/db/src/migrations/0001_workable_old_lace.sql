CREATE TYPE "public"."appwriteDeploymentRegionStatus" AS ENUM('pending', 'building', 'ready', 'failed', 'canceled', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."appwriteDeploymentStatus" AS ENUM('pending', 'building_primary', 'primary_ready', 'syncing_regions', 'ready', 'partial_failed', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."appwriteResourceSyncStatus" AS ENUM('pending', 'syncing', 'ready', 'failed', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."appwriteResourceType" AS ENUM('function', 'site');--> statement-breakpoint
CREATE TYPE "public"."appwriteRuleStatus" AS ENUM('pending', 'applying', 'ready', 'failed', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."appwriteRuleTriggerType" AS ENUM('deployment', 'manual');--> statement-breakpoint
CREATE TYPE "public"."appwriteSiteDeploymentMode" AS ENUM('single_region', 'global');--> statement-breakpoint
CREATE TABLE "appwrite_deployment" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"resourceType" "appwriteResourceType" NOT NULL,
	"resourceId" text NOT NULL,
	"primaryRegionId" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"status" "appwriteDeploymentStatus" DEFAULT 'pending' NOT NULL,
	"error" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appwrite_deployment_region" (
	"deploymentId" text NOT NULL,
	"regionId" text NOT NULL,
	"workflowId" text,
	"status" "appwriteDeploymentRegionStatus" DEFAULT 'pending' NOT NULL,
	"error" text,
	"startedAt" timestamp with time zone,
	"finishedAt" timestamp with time zone,
	"lastSyncedAt" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appwrite_deployment_region_deploymentId_regionId_unique" UNIQUE("deploymentId","regionId")
);
--> statement-breakpoint
CREATE TABLE "appwrite_function" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"name" text NOT NULL,
	"primaryRegionId" text NOT NULL,
	"activeDeploymentId" text,
	"runtime" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appwrite_function_region" (
	"functionId" text NOT NULL,
	"regionId" text NOT NULL,
	"syncStatus" "appwriteResourceSyncStatus" DEFAULT 'pending' NOT NULL,
	"lastSyncedAt" timestamp with time zone,
	"syncError" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appwrite_function_region_functionId_regionId_unique" UNIQUE("functionId","regionId")
);
--> statement-breakpoint
CREATE TABLE "appwrite_region" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appwrite_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"resourceType" "appwriteResourceType" NOT NULL,
	"resourceId" text NOT NULL,
	"triggerType" "appwriteRuleTriggerType" NOT NULL,
	"domain" text NOT NULL,
	"status" "appwriteRuleStatus" DEFAULT 'pending' NOT NULL,
	"error" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appwrite_rule_region" (
	"ruleId" text NOT NULL,
	"regionId" text NOT NULL,
	"workflowId" text,
	"status" "appwriteRuleStatus" DEFAULT 'pending' NOT NULL,
	"verificationStatus" text,
	"certificateStatus" text,
	"error" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appwrite_rule_region_ruleId_regionId_unique" UNIQUE("ruleId","regionId")
);
--> statement-breakpoint
CREATE TABLE "appwrite_site" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"name" text NOT NULL,
	"primaryRegionId" text NOT NULL,
	"activeDeploymentId" text,
	"framework" text NOT NULL,
	"deploymentMode" "appwriteSiteDeploymentMode" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appwrite_site_region" (
	"siteId" text NOT NULL,
	"regionId" text NOT NULL,
	"syncStatus" "appwriteResourceSyncStatus" DEFAULT 'pending' NOT NULL,
	"lastSyncedAt" timestamp with time zone,
	"syncError" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appwrite_site_region_siteId_regionId_unique" UNIQUE("siteId","regionId")
);
--> statement-breakpoint
ALTER TABLE "appwrite_deployment" ADD CONSTRAINT "appwrite_deployment_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_deployment" ADD CONSTRAINT "appwrite_deployment_primaryRegionId_appwrite_region_id_fk" FOREIGN KEY ("primaryRegionId") REFERENCES "public"."appwrite_region"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_deployment_region" ADD CONSTRAINT "appwrite_deployment_region_deploymentId_appwrite_deployment_id_fk" FOREIGN KEY ("deploymentId") REFERENCES "public"."appwrite_deployment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_deployment_region" ADD CONSTRAINT "appwrite_deployment_region_regionId_appwrite_region_id_fk" FOREIGN KEY ("regionId") REFERENCES "public"."appwrite_region"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_function" ADD CONSTRAINT "appwrite_function_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_function" ADD CONSTRAINT "appwrite_function_primaryRegionId_appwrite_region_id_fk" FOREIGN KEY ("primaryRegionId") REFERENCES "public"."appwrite_region"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_function_region" ADD CONSTRAINT "appwrite_function_region_functionId_appwrite_function_id_fk" FOREIGN KEY ("functionId") REFERENCES "public"."appwrite_function"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_function_region" ADD CONSTRAINT "appwrite_function_region_regionId_appwrite_region_id_fk" FOREIGN KEY ("regionId") REFERENCES "public"."appwrite_region"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_rule" ADD CONSTRAINT "appwrite_rule_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_rule_region" ADD CONSTRAINT "appwrite_rule_region_ruleId_appwrite_rule_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."appwrite_rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_rule_region" ADD CONSTRAINT "appwrite_rule_region_regionId_appwrite_region_id_fk" FOREIGN KEY ("regionId") REFERENCES "public"."appwrite_region"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_site" ADD CONSTRAINT "appwrite_site_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_site" ADD CONSTRAINT "appwrite_site_primaryRegionId_appwrite_region_id_fk" FOREIGN KEY ("primaryRegionId") REFERENCES "public"."appwrite_region"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_site_region" ADD CONSTRAINT "appwrite_site_region_siteId_appwrite_site_id_fk" FOREIGN KEY ("siteId") REFERENCES "public"."appwrite_site"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appwrite_site_region" ADD CONSTRAINT "appwrite_site_region_regionId_appwrite_region_id_fk" FOREIGN KEY ("regionId") REFERENCES "public"."appwrite_region"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appwrite_deployment_accountId_index" ON "appwrite_deployment" USING btree ("accountId");--> statement-breakpoint
CREATE INDEX "appwrite_deployment_resourceType_resourceId_index" ON "appwrite_deployment" USING btree ("resourceType","resourceId");--> statement-breakpoint
CREATE INDEX "appwrite_deployment_primaryRegionId_index" ON "appwrite_deployment" USING btree ("primaryRegionId");--> statement-breakpoint
CREATE INDEX "appwrite_deployment_status_index" ON "appwrite_deployment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appwrite_deployment_createdAt_index" ON "appwrite_deployment" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "appwrite_deployment_updatedAt_index" ON "appwrite_deployment" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "appwrite_deployment_region_deploymentId_index" ON "appwrite_deployment_region" USING btree ("deploymentId");--> statement-breakpoint
CREATE INDEX "appwrite_deployment_region_regionId_index" ON "appwrite_deployment_region" USING btree ("regionId");--> statement-breakpoint
CREATE INDEX "appwrite_deployment_region_workflowId_index" ON "appwrite_deployment_region" USING btree ("workflowId");--> statement-breakpoint
CREATE INDEX "appwrite_deployment_region_status_index" ON "appwrite_deployment_region" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appwrite_deployment_region_createdAt_index" ON "appwrite_deployment_region" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "appwrite_deployment_region_updatedAt_index" ON "appwrite_deployment_region" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "appwrite_function_accountId_index" ON "appwrite_function" USING btree ("accountId");--> statement-breakpoint
CREATE INDEX "appwrite_function_primaryRegionId_index" ON "appwrite_function" USING btree ("primaryRegionId");--> statement-breakpoint
CREATE INDEX "appwrite_function_createdAt_index" ON "appwrite_function" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "appwrite_function_updatedAt_index" ON "appwrite_function" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "appwrite_function_region_functionId_index" ON "appwrite_function_region" USING btree ("functionId");--> statement-breakpoint
CREATE INDEX "appwrite_function_region_regionId_index" ON "appwrite_function_region" USING btree ("regionId");--> statement-breakpoint
CREATE INDEX "appwrite_function_region_syncStatus_index" ON "appwrite_function_region" USING btree ("syncStatus");--> statement-breakpoint
CREATE INDEX "appwrite_function_region_createdAt_index" ON "appwrite_function_region" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "appwrite_function_region_updatedAt_index" ON "appwrite_function_region" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "appwrite_region_enabled_index" ON "appwrite_region" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "appwrite_region_createdAt_index" ON "appwrite_region" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "appwrite_region_updatedAt_index" ON "appwrite_region" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "appwrite_rule_accountId_index" ON "appwrite_rule" USING btree ("accountId");--> statement-breakpoint
CREATE INDEX "appwrite_rule_resourceType_resourceId_index" ON "appwrite_rule" USING btree ("resourceType","resourceId");--> statement-breakpoint
CREATE INDEX "appwrite_rule_triggerType_index" ON "appwrite_rule" USING btree ("triggerType");--> statement-breakpoint
CREATE INDEX "appwrite_rule_status_index" ON "appwrite_rule" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appwrite_rule_domain_index" ON "appwrite_rule" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "appwrite_rule_createdAt_index" ON "appwrite_rule" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "appwrite_rule_updatedAt_index" ON "appwrite_rule" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "appwrite_rule_region_ruleId_index" ON "appwrite_rule_region" USING btree ("ruleId");--> statement-breakpoint
CREATE INDEX "appwrite_rule_region_regionId_index" ON "appwrite_rule_region" USING btree ("regionId");--> statement-breakpoint
CREATE INDEX "appwrite_rule_region_workflowId_index" ON "appwrite_rule_region" USING btree ("workflowId");--> statement-breakpoint
CREATE INDEX "appwrite_rule_region_status_index" ON "appwrite_rule_region" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appwrite_rule_region_createdAt_index" ON "appwrite_rule_region" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "appwrite_rule_region_updatedAt_index" ON "appwrite_rule_region" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "appwrite_site_accountId_index" ON "appwrite_site" USING btree ("accountId");--> statement-breakpoint
CREATE INDEX "appwrite_site_primaryRegionId_index" ON "appwrite_site" USING btree ("primaryRegionId");--> statement-breakpoint
CREATE INDEX "appwrite_site_deploymentMode_index" ON "appwrite_site" USING btree ("deploymentMode");--> statement-breakpoint
CREATE INDEX "appwrite_site_createdAt_index" ON "appwrite_site" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "appwrite_site_updatedAt_index" ON "appwrite_site" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "appwrite_site_region_siteId_index" ON "appwrite_site_region" USING btree ("siteId");--> statement-breakpoint
CREATE INDEX "appwrite_site_region_regionId_index" ON "appwrite_site_region" USING btree ("regionId");--> statement-breakpoint
CREATE INDEX "appwrite_site_region_syncStatus_index" ON "appwrite_site_region" USING btree ("syncStatus");--> statement-breakpoint
CREATE INDEX "appwrite_site_region_createdAt_index" ON "appwrite_site_region" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "appwrite_site_region_updatedAt_index" ON "appwrite_site_region" USING btree ("updatedAt");