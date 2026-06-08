CREATE TYPE "public"."apiTokenCredentialType" AS ENUM('account', 'user');--> statement-breakpoint
CREATE TYPE "public"."appType" AS ENUM('single-agent', 'multiple-agents');--> statement-breakpoint
CREATE TYPE "public"."artifactKind" AS ENUM('text', 'code', 'image', 'sheet');--> statement-breakpoint
CREATE TYPE "public"."messageRole" AS ENUM('system', 'user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."orderKind" AS ENUM('stripe-payment', 'stripe-payment-intent', 'stripe-subscription', 'stripe-invoice');--> statement-breakpoint
CREATE TYPE "public"."subscriptionKind" AS ENUM('stripe-subscription');--> statement-breakpoint
CREATE TYPE "public"."expenseKind" AS ENUM('generation');--> statement-breakpoint
CREATE TYPE "public"."graphMode" AS ENUM('public', 'uncontrolled', 'managed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."memoryAction" AS ENUM('add', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."memoryMode" AS ENUM('uncontrolled', 'managed');--> statement-breakpoint
CREATE TYPE "public"."memoryEntity" AS ENUM('user', 'agent', 'app', 'run');--> statement-breakpoint
CREATE TYPE "public"."integrationType" AS ENUM('github', 'cloudflare');--> statement-breakpoint
CREATE TABLE "agent" (
	"id" text PRIMARY KEY NOT NULL,
	"appId" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_version" (
	"agentId" text NOT NULL,
	"version" bigint DEFAULT 9007199254740991 NOT NULL,
	"name" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_version_agentId_version_pk" PRIMARY KEY("agentId","version")
);
--> statement-breakpoint
CREATE TABLE "api_token" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"policies" jsonb NOT NULL,
	"hash" text NOT NULL,
	"enabled" boolean NOT NULL,
	"expiresAt" timestamp with time zone,
	"notBefore" timestamp with time zone,
	"metadata" jsonb NOT NULL,
	"credentialType" "apiTokenCredentialType" NOT NULL,
	"accountId" text,
	"userId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_token_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
CREATE TABLE "app" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"type" "appType" DEFAULT 'single-agent' NOT NULL,
	"name" varchar(255) NOT NULL,
	"metadata" jsonb NOT NULL,
	"archived" boolean,
	"archivedAt" timestamp with time zone,
	"deleted" boolean,
	"deletedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_version" (
	"appId" text NOT NULL,
	"version" bigint DEFAULT 9007199254740991 NOT NULL,
	"type" "appType" DEFAULT 'single-agent' NOT NULL,
	"name" varchar(255) NOT NULL,
	"metadata" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_version_appId_version_pk" PRIMARY KEY("appId","version")
);
--> statement-breakpoint
CREATE TABLE "apps_to_categories" (
	"appId" text NOT NULL,
	"categoryId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apps_to_categories_appId_categoryId_pk" PRIMARY KEY("appId","categoryId")
);
--> statement-breakpoint
CREATE TABLE "apps_to_tags" (
	"appId" text NOT NULL,
	"tag" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apps_to_tags_appId_tag_pk" PRIMARY KEY("appId","tag")
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"name" varchar(255) PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artifact" (
	"id" text NOT NULL,
	"version" integer NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"chatId" text,
	"kind" "artifactKind" NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artifact_id_version_pk" PRIMARY KEY("id","version")
);
--> statement-breakpoint
CREATE TABLE "artifact_suggestion" (
	"id" text PRIMARY KEY NOT NULL,
	"artifactId" text NOT NULL,
	"artifactVersion" integer NOT NULL,
	"originalText" text NOT NULL,
	"suggestedText" text NOT NULL,
	"description" text,
	"isResolved" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "account_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "auth_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"profile" text
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"team_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jwks" (
	"id" text PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_access_token" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"client_id" text NOT NULL,
	"session_id" text,
	"user_id" text,
	"reference_id" text,
	"refresh_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"scopes" text[] NOT NULL,
	CONSTRAINT "oauth_access_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "oauth_client" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"client_secret" text,
	"client_secret_start" text,
	"disabled" boolean DEFAULT false,
	"skip_consent" boolean,
	"enable_end_session" boolean,
	"subject_type" text,
	"scopes" text[],
	"user_id" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	"name" text,
	"uri" text,
	"icon" text,
	"contacts" text[],
	"tos" text,
	"policy" text,
	"software_id" text,
	"software_version" text,
	"software_statement" text,
	"redirect_uris" text[] NOT NULL,
	"post_logout_redirect_uris" text[],
	"token_endpoint_auth_method" text,
	"grant_types" text[],
	"response_types" text[],
	"public" boolean,
	"type" text,
	"require_pkce" boolean,
	"reference_id" text,
	"metadata" jsonb,
	CONSTRAINT "oauth_client_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "oauth_consent" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text,
	"reference_id" text,
	"scopes" text[] NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_refresh_token" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"client_id" text NOT NULL,
	"session_id" text,
	"user_id" text NOT NULL,
	"reference_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"revoked" timestamp,
	"auth_time" timestamp,
	"scopes" text[] NOT NULL,
	CONSTRAINT "oauth_refresh_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	"active_account_id" text,
	"active_team_id" text,
	"geolocation" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"account_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"normalized_email" text,
	"default_account_id" text,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_normalized_email_unique" UNIQUE("normalized_email")
);
--> statement-breakpoint
CREATE TABLE "chat" (
	"id" text PRIMARY KEY NOT NULL,
	"oauthAppId" text NOT NULL,
	"accountId" text NOT NULL,
	"userId" text NOT NULL,
	"debug" boolean DEFAULT false NOT NULL,
	"metadata" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"parentId" text,
	"chatId" text NOT NULL,
	"role" "messageRole" NOT NULL,
	"content" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_summary" (
	"id" text PRIMARY KEY NOT NULL,
	"chatId" text NOT NULL,
	"checkpoint" text NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_vote" (
	"chatId" text NOT NULL,
	"messageId" text NOT NULL,
	"isUpvoted" boolean NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_vote_chatId_messageId_pk" PRIMARY KEY("chatId","messageId")
);
--> statement-breakpoint
CREATE TABLE "credits" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"credits" numeric(18, 10) NOT NULL,
	"metadata" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credits_accountId_unique" UNIQUE("accountId")
);
--> statement-breakpoint
CREATE TABLE "credits_order" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"kind" "orderKind" NOT NULL,
	"status" text NOT NULL,
	"objectId" text NOT NULL,
	"object" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credits_order_objectId_unique" UNIQUE("objectId")
);
--> statement-breakpoint
CREATE TABLE "credits_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"kind" "subscriptionKind" NOT NULL,
	"status" text NOT NULL,
	"objectId" text NOT NULL,
	"object" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credits_subscription_objectId_unique" UNIQUE("objectId")
);
--> statement-breakpoint
CREATE TABLE "dataset" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"metadata" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"datasetId" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_chunk" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"datasetId" text NOT NULL,
	"documentId" text NOT NULL,
	"segmentId" text NOT NULL,
	"index" integer NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_segment" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"datasetId" text NOT NULL,
	"documentId" text NOT NULL,
	"index" integer NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"userId" text,
	"oauthAppId" text,
	"kind" "expenseKind" NOT NULL,
	"cost" numeric(18, 10),
	"details" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file" (
	"id" text NOT NULL,
	"accountId" text NOT NULL,
	"userId" text NOT NULL,
	"chatId" text,
	"metadata" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "graph" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"mode" "graphMode" NOT NULL,
	"accountId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "graph_key_unique" UNIQUE("key"),
	CONSTRAINT "graph_mode_accountId_name_unique" UNIQUE("mode","accountId","name")
);
--> statement-breakpoint
CREATE TABLE "oauth_app" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"clientId" text NOT NULL,
	"publicClientId" text NOT NULL,
	"clientSecretStart" text NOT NULL,
	"clientSecretEnd" text NOT NULL,
	"redirectUris" text[] NOT NULL,
	"scopes" text[],
	"name" text NOT NULL,
	"description" text,
	"homeUrl" text,
	"logo" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_app_clientId_unique" UNIQUE("clientId"),
	CONSTRAINT "oauth_app_publicClientId_unique" UNIQUE("publicClientId")
);
--> statement-breakpoint
CREATE TABLE "memory" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"oauthAppId" text NOT NULL,
	"chatId" text,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_history" (
	"id" text PRIMARY KEY NOT NULL,
	"memoryId" text NOT NULL,
	"oldMemory" text,
	"newMemory" text,
	"action" "memoryAction" NOT NULL,
	"input" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_space" (
	"id" text PRIMARY KEY NOT NULL,
	"storeId" text NOT NULL,
	"primary" "memoryEntity" NOT NULL,
	"entityId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memory_space_storeId_primary_entityId_unique" UNIQUE("storeId","primary","entityId")
);
--> statement-breakpoint
CREATE TABLE "memory_store" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mode" "memoryMode" NOT NULL,
	"accountId" text NOT NULL,
	"userId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_key" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text,
	"providerId" text NOT NULL,
	"key" jsonb NOT NULL,
	"disabled" boolean NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_models" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text,
	"providerId" text NOT NULL,
	"models" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text,
	"settings" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"name" text NOT NULL,
	"configuration" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"type" "integrationType" NOT NULL,
	"identifier" text NOT NULL,
	"credentials" text,
	"metadata" jsonb NOT NULL,
	"isDefault" boolean,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_type_identifier_unique" UNIQUE("type","identifier")
);
--> statement-breakpoint
CREATE TABLE "neon" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"name" text NOT NULL,
	"isLowCost" boolean NOT NULL,
	"orgId" text NOT NULL,
	"projectId" text NOT NULL,
	"regionId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "neon_orgId_projectId_unique" UNIQUE("orgId","projectId")
);
--> statement-breakpoint
CREATE TABLE "sb_bucket" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_version" ADD CONSTRAINT "agent_version_agentId_agent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_token" ADD CONSTRAINT "api_token_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_token" ADD CONSTRAINT "api_token_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_version" ADD CONSTRAINT "app_version_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps_to_categories" ADD CONSTRAINT "apps_to_categories_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps_to_categories" ADD CONSTRAINT "apps_to_categories_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps_to_tags" ADD CONSTRAINT "apps_to_tags_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps_to_tags" ADD CONSTRAINT "apps_to_tags_tag_tag_name_fk" FOREIGN KEY ("tag") REFERENCES "public"."tag"("name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_suggestion" ADD CONSTRAINT "artifact_suggestion_artifact_id_version_fk" FOREIGN KEY ("artifactId","artifactVersion") REFERENCES "public"."artifact"("id","version") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_client_id_oauth_client_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_client"("client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_refresh_id_oauth_refresh_token_id_fk" FOREIGN KEY ("refresh_id") REFERENCES "public"."oauth_refresh_token"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_client" ADD CONSTRAINT "oauth_client_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_consent" ADD CONSTRAINT "oauth_consent_client_id_oauth_client_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_client"("client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_consent" ADD CONSTRAINT "oauth_consent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_client_id_oauth_client_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_client"("client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_default_account_id_account_id_fk" FOREIGN KEY ("default_account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_oauthAppId_oauth_app_id_fk" FOREIGN KEY ("oauthAppId") REFERENCES "public"."oauth_app"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_parentId_message_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_summary" ADD CONSTRAINT "message_summary_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_vote" ADD CONSTRAINT "message_vote_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_vote" ADD CONSTRAINT "message_vote_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits_order" ADD CONSTRAINT "credits_order_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits_subscription" ADD CONSTRAINT "credits_subscription_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset" ADD CONSTRAINT "dataset_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_datasetId_dataset_id_fk" FOREIGN KEY ("datasetId") REFERENCES "public"."dataset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_datasetId_dataset_id_fk" FOREIGN KEY ("datasetId") REFERENCES "public"."dataset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_documentId_document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_segmentId_document_segment_id_fk" FOREIGN KEY ("segmentId") REFERENCES "public"."document_segment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_segment" ADD CONSTRAINT "document_segment_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_segment" ADD CONSTRAINT "document_segment_datasetId_dataset_id_fk" FOREIGN KEY ("datasetId") REFERENCES "public"."dataset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_segment" ADD CONSTRAINT "document_segment_documentId_document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_oauthAppId_oauth_app_id_fk" FOREIGN KEY ("oauthAppId") REFERENCES "public"."oauth_app"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph" ADD CONSTRAINT "graph_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_app" ADD CONSTRAINT "oauth_app_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory" ADD CONSTRAINT "memory_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory" ADD CONSTRAINT "memory_oauthAppId_oauth_app_id_fk" FOREIGN KEY ("oauthAppId") REFERENCES "public"."oauth_app"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory" ADD CONSTRAINT "memory_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_space" ADD CONSTRAINT "memory_space_storeId_memory_store_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."memory_store"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_store" ADD CONSTRAINT "memory_store_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_store" ADD CONSTRAINT "memory_store_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_key" ADD CONSTRAINT "provider_key_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_models" ADD CONSTRAINT "provider_models_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_settings" ADD CONSTRAINT "provider_settings_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp" ADD CONSTRAINT "mcp_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration" ADD CONSTRAINT "integration_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon" ADD CONSTRAINT "neon_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sb_bucket" ADD CONSTRAINT "sb_bucket_accountId_account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_appId_index" ON "agent" USING btree ("appId");--> statement-breakpoint
CREATE INDEX "agent_name_index" ON "agent" USING btree ("name");--> statement-breakpoint
CREATE INDEX "agent_createdAt_index" ON "agent" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "agent_updatedAt_index" ON "agent" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "agent_version_createdAt_index" ON "agent_version" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "agent_version_updatedAt_index" ON "agent_version" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "api_token_hash_index" ON "api_token" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "api_token_credentialType_accountId_userId_index" ON "api_token" USING btree ("credentialType","accountId","userId");--> statement-breakpoint
CREATE INDEX "api_token_credentialType_userId_index" ON "api_token" USING btree ("credentialType","userId");--> statement-breakpoint
CREATE INDEX "api_token_createdAt_index" ON "api_token" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "api_token_updatedAt_index" ON "api_token" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "app_accountId_deleted_index" ON "app" USING btree ("accountId","deleted");--> statement-breakpoint
CREATE INDEX "app_type_index" ON "app" USING btree ("type");--> statement-breakpoint
CREATE INDEX "app_name_index" ON "app" USING btree ("name");--> statement-breakpoint
CREATE INDEX "app_archived_archivedAt_index" ON "app" USING btree ("archived","archivedAt");--> statement-breakpoint
CREATE INDEX "app_deleted_index" ON "app" USING btree ("deleted");--> statement-breakpoint
CREATE INDEX "app_createdAt_index" ON "app" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "app_updatedAt_index" ON "app" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "app_version_createdAt_index" ON "app_version" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "app_version_updatedAt_index" ON "app_version" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "apps_to_categories_categoryId_index" ON "apps_to_categories" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "apps_to_categories_createdAt_index" ON "apps_to_categories" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "apps_to_categories_updatedAt_index" ON "apps_to_categories" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "apps_to_tags_tag_index" ON "apps_to_tags" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "apps_to_tags_createdAt_index" ON "apps_to_tags" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "apps_to_tags_updatedAt_index" ON "apps_to_tags" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "category_name_index" ON "category" USING btree ("name");--> statement-breakpoint
CREATE INDEX "category_createdAt_index" ON "category" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "category_updatedAt_index" ON "category" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "tag_createdAt_index" ON "tag" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "tag_updatedAt_index" ON "tag" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "artifact_accountId_userId_index" ON "artifact" USING btree ("accountId","userId");--> statement-breakpoint
CREATE INDEX "artifact_chatId_index" ON "artifact" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX "artifact_createdAt_index" ON "artifact" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "artifact_updatedAt_index" ON "artifact" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "artifact_suggestion_artifactId_artifactVersion_index" ON "artifact_suggestion" USING btree ("artifactId","artifactVersion");--> statement-breakpoint
CREATE INDEX "artifact_suggestion_createdAt_index" ON "artifact_suggestion" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "artifact_suggestion_updatedAt_index" ON "artifact_suggestion" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "account_name_index" ON "account" USING btree ("name");--> statement-breakpoint
CREATE INDEX "account_slug_index" ON "account" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "account_created_at_index" ON "account" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "auth_account_account_id_provider_id_index" ON "auth_account" USING btree ("account_id","provider_id");--> statement-breakpoint
CREATE INDEX "auth_account_user_id_index" ON "auth_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_account_created_at_index" ON "auth_account" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "auth_account_updated_at_index" ON "auth_account" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "invitation_account_id_team_id_index" ON "invitation" USING btree ("account_id","team_id");--> statement-breakpoint
CREATE INDEX "invitation_email_index" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitation_expires_at_index" ON "invitation" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "invitation_inviter_id_index" ON "invitation" USING btree ("inviter_id");--> statement-breakpoint
CREATE INDEX "jwks_created_at_index" ON "jwks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "member_account_id_user_id_index" ON "member" USING btree ("account_id","user_id");--> statement-breakpoint
CREATE INDEX "member_user_id_index" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "member_created_at_index" ON "member" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "oauth_access_token_token_index" ON "oauth_access_token" USING btree ("token");--> statement-breakpoint
CREATE INDEX "oauth_access_token_client_id_index" ON "oauth_access_token" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oauth_access_token_session_id_index" ON "oauth_access_token" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "oauth_access_token_user_id_index" ON "oauth_access_token" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_access_token_reference_id_index" ON "oauth_access_token" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "oauth_access_token_refresh_id_index" ON "oauth_access_token" USING btree ("refresh_id");--> statement-breakpoint
CREATE INDEX "oauth_access_token_expires_at_index" ON "oauth_access_token" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "oauth_access_token_created_at_index" ON "oauth_access_token" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "oauth_client_client_id_index" ON "oauth_client" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oauth_client_user_id_index" ON "oauth_client" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_client_reference_id_index" ON "oauth_client" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "oauth_client_created_at_index" ON "oauth_client" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "oauth_client_updated_at_index" ON "oauth_client" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "oauth_consent_client_id_user_id_index" ON "oauth_consent" USING btree ("client_id","user_id");--> statement-breakpoint
CREATE INDEX "oauth_consent_user_id_index" ON "oauth_consent" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_consent_reference_id_index" ON "oauth_consent" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "oauth_consent_created_at_index" ON "oauth_consent" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "oauth_consent_updated_at_index" ON "oauth_consent" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "oauth_refresh_token_token_index" ON "oauth_refresh_token" USING btree ("token");--> statement-breakpoint
CREATE INDEX "oauth_refresh_token_client_id_index" ON "oauth_refresh_token" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oauth_refresh_token_session_id_index" ON "oauth_refresh_token" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "oauth_refresh_token_user_id_index" ON "oauth_refresh_token" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oauth_refresh_token_reference_id_index" ON "oauth_refresh_token" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "oauth_refresh_token_expires_at_index" ON "oauth_refresh_token" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "oauth_refresh_token_created_at_index" ON "oauth_refresh_token" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "passkey_user_id_index" ON "passkey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credential_id_index" ON "passkey" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "passkey_created_at_index" ON "passkey" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "session_user_id_index" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_account_id_index" ON "team" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "team_created_at_index" ON "team" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "team_updated_at_index" ON "team" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "team_member_team_id_user_id_index" ON "team_member" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "team_member_user_id_index" ON "team_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_member_created_at_index" ON "team_member" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "two_factor_secret_index" ON "two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "two_factor_user_id_index" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_name_index" ON "user" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_email_index" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_role_index" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_created_at_index" ON "user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_updated_at_index" ON "user" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "chat_oauthAppId_index" ON "chat" USING btree ("oauthAppId");--> statement-breakpoint
CREATE INDEX "chat_accountId_userId_oauthAppId_debug_index" ON "chat" USING btree ("accountId","userId","oauthAppId","debug");--> statement-breakpoint
CREATE INDEX "chat_createdAt_index" ON "chat" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "chat_updatedAt_index" ON "chat" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "message_parentId_index" ON "message" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "message_chatId_role_index" ON "message" USING btree ("chatId","role");--> statement-breakpoint
CREATE INDEX "message_createdAt_index" ON "message" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "message_updatedAt_index" ON "message" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "message_summary_chatId_checkpoint_index" ON "message_summary" USING btree ("chatId","checkpoint");--> statement-breakpoint
CREATE INDEX "message_summary_createdAt_index" ON "message_summary" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "message_summary_updatedAt_index" ON "message_summary" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "message_vote_createdAt_index" ON "message_vote" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "message_vote_updatedAt_index" ON "message_vote" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "credits_createdAt_index" ON "credits" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "credits_updatedAt_index" ON "credits" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "credits_order_accountId_kind_status_index" ON "credits_order" USING btree ("accountId","kind","status");--> statement-breakpoint
CREATE INDEX "credits_order_accountId_status_index" ON "credits_order" USING btree ("accountId","status");--> statement-breakpoint
CREATE INDEX "credits_order_createdAt_index" ON "credits_order" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "credits_order_updatedAt_index" ON "credits_order" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "credits_subscription_accountId_kind_status_index" ON "credits_subscription" USING btree ("accountId","kind","status");--> statement-breakpoint
CREATE INDEX "credits_subscription_accountId_status_index" ON "credits_subscription" USING btree ("accountId","status");--> statement-breakpoint
CREATE INDEX "credits_subscription_createdAt_index" ON "credits_subscription" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "credits_subscription_updatedAt_index" ON "credits_subscription" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "dataset_accountId_index" ON "dataset" USING btree ("accountId");--> statement-breakpoint
CREATE INDEX "dataset_name_index" ON "dataset" USING btree ("name");--> statement-breakpoint
CREATE INDEX "dataset_createdAt_index" ON "dataset" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "dataset_updatedAt_index" ON "dataset" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "document_accountId_datasetId_index" ON "document" USING btree ("accountId","datasetId");--> statement-breakpoint
CREATE INDEX "document_datasetId_index" ON "document" USING btree ("datasetId");--> statement-breakpoint
CREATE INDEX "document_createdAt_index" ON "document" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "document_updatedAt_index" ON "document" USING btree ("updatedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "document_chunk_oddsi_index" ON "document_chunk" USING btree ("accountId","datasetId","documentId","segmentId","index");--> statement-breakpoint
CREATE INDEX "document_chunk_ddsi_index" ON "document_chunk" USING btree ("datasetId","documentId","segmentId","index");--> statement-breakpoint
CREATE INDEX "document_chunk_dsi_index" ON "document_chunk" USING btree ("documentId","segmentId","index");--> statement-breakpoint
CREATE INDEX "document_chunk_si_index" ON "document_chunk" USING btree ("segmentId","index");--> statement-breakpoint
CREATE INDEX "document_chunk_createdAt_index" ON "document_chunk" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "document_chunk_updatedAt_index" ON "document_chunk" USING btree ("updatedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "document_segment_oddi_index" ON "document_segment" USING btree ("accountId","datasetId","documentId","index");--> statement-breakpoint
CREATE INDEX "document_segment_ddi_index" ON "document_segment" USING btree ("datasetId","documentId","index");--> statement-breakpoint
CREATE INDEX "document_segment_di_index" ON "document_segment" USING btree ("documentId","index");--> statement-breakpoint
CREATE INDEX "document_segment_createdAt_index" ON "document_segment" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "document_segment_updatedAt_index" ON "document_segment" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "expense_accountId_userId_oauthAppId_index" ON "expense" USING btree ("accountId","userId","oauthAppId");--> statement-breakpoint
CREATE INDEX "expense_accountId_oauthAppId_index" ON "expense" USING btree ("accountId","oauthAppId");--> statement-breakpoint
CREATE INDEX "expense_userId_oauthAppId_index" ON "expense" USING btree ("userId","oauthAppId");--> statement-breakpoint
CREATE INDEX "expense_createdAt_index" ON "expense" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "file_accountId_userId_index" ON "file" USING btree ("accountId","userId");--> statement-breakpoint
CREATE INDEX "file_chatId_index" ON "file" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX "file_createdAt_index" ON "file" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "file_updatedAt_index" ON "file" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "graph_key_index" ON "graph" USING btree ("key");--> statement-breakpoint
CREATE INDEX "graph_createdAt_index" ON "graph" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "graph_updatedAt_index" ON "graph" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "oauth_app_accountId_index" ON "oauth_app" USING btree ("accountId");--> statement-breakpoint
CREATE INDEX "oauth_app_clientId_index" ON "oauth_app" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "oauth_app_publicClientId_index" ON "oauth_app" USING btree ("publicClientId");--> statement-breakpoint
CREATE INDEX "oauth_app_name_index" ON "oauth_app" USING btree ("name");--> statement-breakpoint
CREATE INDEX "oauth_app_createdAt_index" ON "oauth_app" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "oauth_app_updatedAt_index" ON "oauth_app" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "memory_userId_oauthAppId_chatId_index" ON "memory" USING btree ("userId","oauthAppId","chatId");--> statement-breakpoint
CREATE INDEX "memory_oauthAppId_index" ON "memory" USING btree ("oauthAppId");--> statement-breakpoint
CREATE INDEX "memory_chatId_index" ON "memory" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX "memory_createdAt_index" ON "memory" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "memory_updatedAt_index" ON "memory" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "memory_history_memoryId_index" ON "memory_history" USING btree ("memoryId");--> statement-breakpoint
CREATE INDEX "memory_space_createdAt_index" ON "memory_space" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "memory_space_updatedAt_index" ON "memory_space" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "memory_store_mode_accountId_userId_index" ON "memory_store" USING btree ("mode","accountId","userId");--> statement-breakpoint
CREATE INDEX "memory_store_createdAt_index" ON "memory_store" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "memory_store_updatedAt_index" ON "memory_store" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "provider_key_accountId_providerId_index" ON "provider_key" USING btree ("accountId","providerId");--> statement-breakpoint
CREATE INDEX "provider_models_accountId_providerId_index" ON "provider_models" USING btree ("accountId","providerId");--> statement-breakpoint
CREATE INDEX "provider_settings_accountId_index" ON "provider_settings" USING btree ("accountId");--> statement-breakpoint
CREATE INDEX "mcp_accountId_index" ON "mcp" USING btree ("accountId");--> statement-breakpoint
CREATE INDEX "mcp_createdAt_index" ON "mcp" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "mcp_updatedAt_index" ON "mcp" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "integration_accountId_type_identifier_index" ON "integration" USING btree ("accountId","type","identifier");--> statement-breakpoint
CREATE INDEX "integration_createdAt_index" ON "integration" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "integration_updatedAt_index" ON "integration" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "neon_accountId_index" ON "neon" USING btree ("accountId");--> statement-breakpoint
CREATE INDEX "neon_createdAt_index" ON "neon" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "neon_updatedAt_index" ON "neon" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "sb_bucket_accountId_index" ON "sb_bucket" USING btree ("accountId");--> statement-breakpoint
CREATE INDEX "sb_bucket_createdAt_index" ON "sb_bucket" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "sb_bucket_updatedAt_index" ON "sb_bucket" USING btree ("updatedAt");