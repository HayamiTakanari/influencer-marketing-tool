-- CreateEnum
CREATE TYPE "AchievementPurpose" AS ENUM ('SALES', 'LEAD_GEN', 'AWARENESS', 'BRAND_IMAGE', 'ENGAGEMENT');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('PHOTOGRAPHY', 'VIDEO_EDITING', 'CONTENT_CREATION', 'POSTING', 'STORY_CREATION', 'CONSULTATION', 'LIVE_STREAMING', 'EVENT_APPEARANCE');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('VIDEO_COMPLETION', 'FINAL_APPROVAL', 'PUBLISH_DATE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_RECEIVED', 'APPLICATION_ACCEPTED', 'APPLICATION_REJECTED', 'PROJECT_MATCHED', 'MESSAGE_RECEIVED', 'PAYMENT_COMPLETED', 'PROJECT_STATUS_CHANGED', 'TEAM_INVITATION', 'SYSTEM_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('XSS_ATTACK', 'SQL_INJECTION', 'COMMAND_INJECTION', 'CSRF_ATTACK', 'BRUTE_FORCE', 'SUSPICIOUS_ACTIVITY', 'CSP_VIOLATION', 'AUTHENTICATION_FAILURE', 'AUTHORIZATION_FAILURE', 'DATA_BREACH_ATTEMPT', 'MALWARE_UPLOAD', 'RATE_LIMIT_EXCEEDED');

-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SecurityStatus" AS ENUM ('DETECTED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE', 'IGNORED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "influencerId" TEXT,
    "clientId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "purpose" "AchievementPurpose" NOT NULL,
    "platform" "Platform" NOT NULL,
    "description" TEXT,
    "metrics" JSONB,
    "budget" INTEGER,
    "duration" TEXT,
    "imageUrl" TEXT,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePricing" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "price" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'per_post',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkInquiry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget" INTEGER,
    "deadline" TIMESTAMP(3),
    "requiredServices" "ServiceType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryResponse" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "proposedPrice" INTEGER,
    "message" TEXT,
    "availableFrom" TIMESTAMP(3),
    "availableTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquiryResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSchedule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "type" "MilestoneType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL,
    "eventType" "SecurityEventType" NOT NULL,
    "severity" "SecuritySeverity" NOT NULL,
    "status" "SecurityStatus" NOT NULL DEFAULT 'DETECTED',
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "headers" JSONB,
    "payload" TEXT,
    "detectionEngine" TEXT NOT NULL DEFAULT 'XSS_ENGINE',
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "detectedPatterns" JSONB,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "incidentId" TEXT,
    "parentLogId" TEXT,
    "actionTaken" TEXT,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "notes" TEXT,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityStats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalAttacks" INTEGER NOT NULL DEFAULT 0,
    "xssAttacks" INTEGER NOT NULL DEFAULT 0,
    "sqlInjections" INTEGER NOT NULL DEFAULT 0,
    "bruteForce" INTEGER NOT NULL DEFAULT 0,
    "otherAttacks" INTEGER NOT NULL DEFAULT 0,
    "criticalEvents" INTEGER NOT NULL DEFAULT 0,
    "highEvents" INTEGER NOT NULL DEFAULT 0,
    "mediumEvents" INTEGER NOT NULL DEFAULT 0,
    "lowEvents" INTEGER NOT NULL DEFAULT 0,
    "topCountries" JSONB,
    "topRegions" JSONB,
    "uniqueIPs" INTEGER NOT NULL DEFAULT 0,
    "blockedIPs" INTEGER NOT NULL DEFAULT 0,
    "topAttackerIPs" JSONB,
    "affectedUsers" INTEGER NOT NULL DEFAULT 0,
    "suspiciousUsers" JSONB,
    "avgResponseTime" DOUBLE PRECISION,
    "falsePositives" INTEGER NOT NULL DEFAULT 0,
    "resolvedIncidents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IPBlacklist" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "cidr" TEXT,
    "reason" TEXT NOT NULL,
    "severity" "SecuritySeverity" NOT NULL,
    "firstDetected" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL,
    "attackCount" INTEGER NOT NULL DEFAULT 1,
    "blockedRequests" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "permanent" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT,
    "region" TEXT,
    "asn" TEXT,
    "isp" TEXT,
    "addedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IPBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" "SecurityEventType" NOT NULL,
    "pattern" TEXT NOT NULL,
    "severity" "SecuritySeverity" NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoBlock" BOOLEAN NOT NULL DEFAULT false,
    "autoNotify" BOOLEAN NOT NULL DEFAULT true,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "falsePositives" INTEGER NOT NULL DEFAULT 0,
    "lastMatched" TIMESTAMP(3),
    "createdBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_revieweeId_rating_idx" ON "Review"("revieweeId", "rating");

-- CreateIndex
CREATE INDEX "Review_influencerId_rating_idx" ON "Review"("influencerId", "rating");

-- CreateIndex
CREATE INDEX "Review_clientId_rating_idx" ON "Review"("clientId", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "Review_projectId_reviewerId_key" ON "Review"("projectId", "reviewerId");

-- CreateIndex
CREATE INDEX "Achievement_influencerId_purpose_idx" ON "Achievement"("influencerId", "purpose");

-- CreateIndex
CREATE INDEX "Achievement_platform_purpose_idx" ON "Achievement"("platform", "purpose");

-- CreateIndex
CREATE INDEX "ServicePricing_influencerId_isActive_idx" ON "ServicePricing"("influencerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePricing_influencerId_serviceType_key" ON "ServicePricing"("influencerId", "serviceType");

-- CreateIndex
CREATE INDEX "BulkInquiry_clientId_createdAt_idx" ON "BulkInquiry"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "InquiryResponse_inquiryId_status_idx" ON "InquiryResponse"("inquiryId", "status");

-- CreateIndex
CREATE INDEX "InquiryResponse_influencerId_status_idx" ON "InquiryResponse"("influencerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InquiryResponse_inquiryId_influencerId_key" ON "InquiryResponse"("inquiryId", "influencerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSchedule_projectId_key" ON "ProjectSchedule"("projectId");

-- CreateIndex
CREATE INDEX "ProjectSchedule_publishDate_idx" ON "ProjectSchedule"("publishDate");

-- CreateIndex
CREATE INDEX "Milestone_scheduleId_dueDate_idx" ON "Milestone"("scheduleId", "dueDate");

-- CreateIndex
CREATE INDEX "Milestone_dueDate_isCompleted_idx" ON "Milestone"("dueDate", "isCompleted");

-- CreateIndex
CREATE INDEX "Milestone_dueDate_notificationSent_idx" ON "Milestone"("dueDate", "notificationSent");

-- CreateIndex
CREATE INDEX "SecurityLog_eventType_detectedAt_idx" ON "SecurityLog"("eventType", "detectedAt");

-- CreateIndex
CREATE INDEX "SecurityLog_severity_detectedAt_idx" ON "SecurityLog"("severity", "detectedAt");

-- CreateIndex
CREATE INDEX "SecurityLog_ipAddress_detectedAt_idx" ON "SecurityLog"("ipAddress", "detectedAt");

-- CreateIndex
CREATE INDEX "SecurityLog_userId_detectedAt_idx" ON "SecurityLog"("userId", "detectedAt");

-- CreateIndex
CREATE INDEX "SecurityLog_status_detectedAt_idx" ON "SecurityLog"("status", "detectedAt");

-- CreateIndex
CREATE INDEX "SecurityLog_incidentId_idx" ON "SecurityLog"("incidentId");

-- CreateIndex
CREATE INDEX "SecurityLog_detectedAt_idx" ON "SecurityLog"("detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityStats_date_key" ON "SecurityStats"("date");

-- CreateIndex
CREATE INDEX "SecurityStats_date_idx" ON "SecurityStats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "IPBlacklist_ipAddress_key" ON "IPBlacklist"("ipAddress");

-- CreateIndex
CREATE INDEX "IPBlacklist_ipAddress_idx" ON "IPBlacklist"("ipAddress");

-- CreateIndex
CREATE INDEX "IPBlacklist_isActive_expiresAt_idx" ON "IPBlacklist"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "IPBlacklist_country_idx" ON "IPBlacklist"("country");

-- CreateIndex
CREATE INDEX "IPBlacklist_lastActivity_idx" ON "IPBlacklist"("lastActivity");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityRule_name_key" ON "SecurityRule"("name");

-- CreateIndex
CREATE INDEX "SecurityRule_ruleType_isActive_idx" ON "SecurityRule"("ruleType", "isActive");

-- CreateIndex
CREATE INDEX "SecurityRule_isActive_severity_idx" ON "SecurityRule"("isActive", "severity");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePricing" ADD CONSTRAINT "ServicePricing_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkInquiry" ADD CONSTRAINT "BulkInquiry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryResponse" ADD CONSTRAINT "InquiryResponse_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "BulkInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryResponse" ADD CONSTRAINT "InquiryResponse_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSchedule" ADD CONSTRAINT "ProjectSchedule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ProjectSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_parentLogId_fkey" FOREIGN KEY ("parentLogId") REFERENCES "SecurityLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
