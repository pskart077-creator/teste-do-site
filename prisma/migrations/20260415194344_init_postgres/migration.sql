-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPER_ADMIN', 'EDITOR', 'AUTHOR');

-- CreateEnum
CREATE TYPE "public"."NewsStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."NewsAuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'STATUS_CHANGE', 'UPLOAD', 'DUPLICATE', 'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE', 'TAG_CREATE', 'TAG_UPDATE', 'TAG_DELETE');

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" TEXT NOT NULL,
    "key" "public"."UserRole" NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_sessions" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "csrf_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."news_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "allow_indexing" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "news_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."news_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "news_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."news_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "cover_image_url" TEXT,
    "cover_image_alt" TEXT,
    "category_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "status" "public"."NewsStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "scheduled_at" TIMESTAMP(3),
    "reading_time" INTEGER NOT NULL DEFAULT 1,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "highlight_on_home" BOOLEAN NOT NULL DEFAULT false,
    "canonical_url" TEXT,
    "allow_indexing" BOOLEAN NOT NULL DEFAULT true,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT,
    "og_title" TEXT,
    "og_description" TEXT,
    "og_image" TEXT,
    "twitter_title" TEXT,
    "twitter_description" TEXT,
    "cta_title" TEXT,
    "cta_description" TEXT,
    "cta_button_label" TEXT,
    "cta_button_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "news_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."news_post_tags" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_post_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."news_assets" (
    "id" TEXT NOT NULL,
    "post_id" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'image',
    "file_name" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "checksum" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."news_audit_logs" (
    "id" TEXT NOT NULL,
    "action" "public"."NewsAuditAction" NOT NULL,
    "actor_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "public"."roles"("key");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "public"."users"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_hash_key" ON "public"."admin_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "admin_sessions_user_id_idx" ON "public"."admin_sessions"("user_id");

-- CreateIndex
CREATE INDEX "admin_sessions_expires_at_idx" ON "public"."admin_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "news_categories_name_key" ON "public"."news_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "news_categories_slug_key" ON "public"."news_categories"("slug");

-- CreateIndex
CREATE INDEX "news_categories_deleted_at_idx" ON "public"."news_categories"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "news_tags_name_key" ON "public"."news_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "news_tags_slug_key" ON "public"."news_tags"("slug");

-- CreateIndex
CREATE INDEX "news_tags_deleted_at_idx" ON "public"."news_tags"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "news_posts_slug_key" ON "public"."news_posts"("slug");

-- CreateIndex
CREATE INDEX "news_posts_status_published_at_idx" ON "public"."news_posts"("status", "published_at");

-- CreateIndex
CREATE INDEX "news_posts_featured_idx" ON "public"."news_posts"("featured");

-- CreateIndex
CREATE INDEX "news_posts_category_id_idx" ON "public"."news_posts"("category_id");

-- CreateIndex
CREATE INDEX "news_posts_author_id_idx" ON "public"."news_posts"("author_id");

-- CreateIndex
CREATE INDEX "news_posts_deleted_at_idx" ON "public"."news_posts"("deleted_at");

-- CreateIndex
CREATE INDEX "news_posts_scheduled_at_idx" ON "public"."news_posts"("scheduled_at");

-- CreateIndex
CREATE INDEX "news_post_tags_tag_id_idx" ON "public"."news_post_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "news_post_tags_post_id_tag_id_key" ON "public"."news_post_tags"("post_id", "tag_id");

-- CreateIndex
CREATE INDEX "news_assets_post_id_idx" ON "public"."news_assets"("post_id");

-- CreateIndex
CREATE INDEX "news_assets_uploaded_by_id_idx" ON "public"."news_assets"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "news_audit_logs_action_idx" ON "public"."news_audit_logs"("action");

-- CreateIndex
CREATE INDEX "news_audit_logs_entity_type_entity_id_idx" ON "public"."news_audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "news_audit_logs_created_at_idx" ON "public"."news_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news_posts" ADD CONSTRAINT "news_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."news_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news_posts" ADD CONSTRAINT "news_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news_post_tags" ADD CONSTRAINT "news_post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."news_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news_post_tags" ADD CONSTRAINT "news_post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."news_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news_assets" ADD CONSTRAINT "news_assets_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."news_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news_assets" ADD CONSTRAINT "news_assets_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news_audit_logs" ADD CONSTRAINT "news_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
