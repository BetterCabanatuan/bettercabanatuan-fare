-- CreateEnum
CREATE TYPE "JeepType" AS ENUM ('TRADITIONAL', 'MODERN', 'UNKNOWN');

-- CreateTable
CREATE TABLE "route_submission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "fromLat" DOUBLE PRECISION NOT NULL,
    "fromLng" DOUBLE PRECISION NOT NULL,
    "toName" TEXT NOT NULL,
    "toLat" DOUBLE PRECISION NOT NULL,
    "toLng" DOUBLE PRECISION NOT NULL,
    "via" TEXT,
    "jeepType" "JeepType" NOT NULL DEFAULT 'UNKNOWN',
    "farePaid" INTEGER,
    "submitterName" TEXT,
    "submitterContact" TEXT,
    "notes" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "routeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_jeep_route" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "toName" TEXT NOT NULL,
    "via" TEXT,
    "jeepType" "JeepType" NOT NULL,
    "line" JSONB NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "farePaid" INTEGER,
    "verifiedOn" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_jeep_route_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "route_submission_status_createdAt_idx" ON "route_submission"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "route_submission" ADD CONSTRAINT "route_submission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_submission" ADD CONSTRAINT "route_submission_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "community_jeep_route"("id") ON DELETE SET NULL ON UPDATE CASCADE;
