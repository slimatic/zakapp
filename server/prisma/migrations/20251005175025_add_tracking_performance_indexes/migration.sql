-- CreateIndex
CREATE INDEX "analytics_metrics_userId_metricType_startDate_endDate_idx" ON "analytics_metrics"("userId", "metricType", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "analytics_metrics_userId_calculatedAt_idx" ON "analytics_metrics"("userId", "calculatedAt" DESC);

-- CreateIndex
CREATE INDEX "annual_summaries_userId_generatedAt_idx" ON "annual_summaries"("userId", "generatedAt" DESC);

-- CreateIndex
CREATE INDEX "payment_records_userId_snapshotId_idx" ON "payment_records"("userId", "snapshotId");

-- CreateIndex
CREATE INDEX "payment_records_userId_status_idx" ON "payment_records"("userId", "status");

-- CreateIndex
CREATE INDEX "payment_records_userId_recipientCategory_idx" ON "payment_records"("userId", "recipientCategory");

-- CreateIndex
CREATE INDEX "payment_records_userId_createdAt_idx" ON "payment_records"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "reminder_events_userId_eventType_idx" ON "reminder_events"("userId", "eventType");

-- CreateIndex
CREATE INDEX "reminder_events_userId_status_triggerDate_idx" ON "reminder_events"("userId", "status", "triggerDate");

-- CreateIndex
CREATE INDEX "reminder_events_userId_priority_status_idx" ON "reminder_events"("userId", "priority", "status");

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_isPrimary_idx" ON "yearly_snapshots"("userId", "isPrimary");

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_createdAt_idx" ON "yearly_snapshots"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_gregorianYear_gregorianMonth_idx" ON "yearly_snapshots"("userId", "gregorianYear", "gregorianMonth");

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_status_gregorianYear_idx" ON "yearly_snapshots"("userId", "status", "gregorianYear");
