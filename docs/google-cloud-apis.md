# Google Cloud Console APIs — MSP Platform Integration Proposal

> A comprehensive analysis of every Google Cloud API that could benefit the MSP + Real Estate Operations Platform, with specific implementation details and use cases.

---

## Tier 1 — High-Value, Immediate Use Cases

### 1. Google Maps Platform — Places API / Geocoding API

**Purpose:** Address validation, property location mapping, and lead geo-targeting.

**APIs:**
- **Places API (New)** — address autocomplete, place details
- **Geocoding API** — convert addresses to lat/lng coordinates
- **Maps JavaScript API** — embedded property maps on hosted sites

**Use Cases:**
1. **Listing address autocomplete**: When agents create listings on their hosted site, Places API autocomplete ensures valid, standardized addresses.
2. **Property map embeds**: Each listing page gets an embedded Google Map showing the property location, nearby schools, transit, and amenities via the Maps JavaScript API.
3. **Lead geo-fencing**: When leads submit contact forms, geocode their address to match them with the nearest agent/team based on territory assignments.
4. **Brokerage office locator**: A "Find an Office" page on brokerage websites using the Maps JavaScript API.
5. **Shipping address validation**: Before creating ShipStation labels, validate the shipping address via Geocoding API to prevent failed deliveries.

**Implementation:**
```
POST /api/maps/autocomplete     → Places API autocomplete
POST /api/maps/geocode          → Geocoding API
GET  /api/maps/embed/:listingId → Generate Maps embed URL with marker
```

**Cost:** Places API: $2.83/1K requests (autocomplete), $5/1K (geocode). Maps JavaScript: $7/1K loads. Free tier: $200/month credit.

---

### 2. Google Workspace APIs (Gmail API, Calendar API, Drive API)

**Purpose:** Deep integration with agents' existing Google Workspace for email, calendar, and document sync.

**APIs:**
- **Gmail API** — read/send email, label management
- **Calendar API** — showing/open house scheduling, appointment booking
- **Drive API** — document import/export from Google Drive to Vault

**Use Cases:**
1. **Email integration for ticketing**: When a client emails support, Gmail API can parse inbound emails and auto-create tickets in the helpdesk. Ticket replies sync back as email threads.
2. **Showing/appointment scheduling**: Agents can sync their Google Calendar with the platform. When a lead requests a showing via the hosted website, it checks agent availability and creates a calendar event.
3. **Document import**: Agents can import documents from Google Drive directly into the Vault without downloading and re-uploading. Also enables "Save to Drive" for signed documents.
4. **Email campaign tracking**: Track email opens/replies for lead nurturing by monitoring sent emails via Gmail API.
5. **Automated meeting reminders**: Before showings, send calendar reminders with property details and directions.

**Implementation:**
```
OAuth 2.0 flow → Google Workspace consent
POST /api/integrations/google/calendar/sync    → bi-directional calendar sync
POST /api/integrations/google/drive/import     → import files to Vault
POST /api/integrations/google/gmail/parse      → inbound email → ticket
```

**Cost:** Gmail API: free (quota limits). Calendar API: free. Drive API: free. OAuth setup required per tenant.

---

### 3. Google Cloud Vision API

**Purpose:** Intelligent document processing and image analysis.

**APIs:**
- **Cloud Vision API** — OCR, image labeling, document text detection

**Use Cases:**
1. **Document OCR**: When agents upload scanned documents (inspection reports, disclosures, contracts) to the Vault, Vision API extracts text for full-text search indexing.
2. **ID verification**: For compliance workflows, extract text from driver's licenses or business cards uploaded during onboarding.
3. **Property photo analysis**: Auto-tag listing photos (exterior, kitchen, bathroom, pool) for better organization and SEO alt-text generation.
4. **Receipt scanning**: Technicians can photograph receipts for expense tracking. OCR extracts vendor, amount, and date.
5. **Business card scanning**: At open houses, agents scan visitor business cards. Vision API extracts name/email/phone and creates a lead record automatically.

**Implementation:**
```
POST /api/vision/ocr            → Extract text from uploaded document
POST /api/vision/analyze-photo  → Label/tag a listing photo
POST /api/vision/business-card  → Parse business card → lead record
```

**Cost:** $1.50/1K images (first 1K/month free). Document OCR: $1.50/1K pages.

---

### 4. Google Cloud Translation API

**Purpose:** Multi-language support for US + Brazil operations.

**APIs:**
- **Cloud Translation API (v3)** — text translation, language detection

**Use Cases:**
1. **Brazil operations**: Translate platform UI, notifications, and email templates between English and Portuguese.
2. **Listing translations**: Auto-translate listing descriptions for multilingual markets.
3. **Support ticket translation**: When Brazilian team members create tickets in Portuguese, auto-translate for US-based support staff and vice versa.
4. **Document translation**: Translate uploaded documents for cross-border real estate transactions.

**Implementation:**
```
POST /api/translate              → Translate text (any direction)
POST /api/translate/detect       → Detect language of input text
Middleware: auto-translate based on user.locale preference
```

**Cost:** $20/1M characters. First 500K characters/month free.

---

### 5. Firebase Cloud Messaging (FCM)

**Purpose:** Push notifications for mobile apps.

**APIs:**
- **FCM API (v1)** — push notifications to iOS and Android

**Use Cases:**
1. **New lead alerts**: When a lead submits a form on a hosted site, push a notification to the assigned agent's mobile app.
2. **Ticket updates**: Notify technicians when tickets are assigned, updated, or approaching SLA breach.
3. **Shipping notifications**: Alert clients when their device ships, and technicians when a shipment is delivered.
4. **Time clock reminders**: Remind employees to clock in/out at expected times.
5. **Document signing requests**: Push notification when a document needs the user's signature.
6. **Device staging alerts**: Notify technicians when devices move to their pipeline stage.

**Implementation:**
```
Store FCM tokens in user_devices table
POST /api/notifications/push     → Send via FCM
Edge Function trigger on:
  - ticket.created → notify assignee
  - shipment.shipped → notify client
  - esign.requested → notify signer
  - lead.created → notify agent
```

**Cost:** Free for unlimited messages.

---

## Tier 2 — Medium-Value, Phase 2+ Use Cases

### 6. Google Analytics Data API + Google Tag Manager

**Purpose:** Analytics for hosted real estate websites.

**Use Cases:**
1. **Per-site analytics**: Each hosted brokerage/agent site gets its own GA4 property. Dashboard shows page views, unique visitors, top listings, lead conversion rate.
2. **Lead attribution**: Track which listing pages generate the most leads, which traffic sources convert best.
3. **SEO performance**: Surface search console data (impressions, clicks, position) per hosted site.
4. **Custom events**: Track "Schedule Showing" clicks, "Contact Agent" form submissions, listing saves.

**Implementation:**
```
Auto-inject GA4 tag into hosted sites via Google Tag Manager
GET /api/analytics/:siteId/overview   → GA4 Data API reporting
GET /api/analytics/:siteId/leads      → Lead attribution report
```

**Cost:** GA4: free. Data API: free (quota limits).

---

### 7. Google Cloud Natural Language API

**Purpose:** Sentiment analysis and entity extraction from tickets and reviews.

**Use Cases:**
1. **Ticket sentiment analysis**: Auto-detect frustrated/urgent tickets based on language sentiment. Flag for priority escalation.
2. **Lead intent scoring**: Analyze lead inquiry text to score purchase/sell intent (e.g., "need to sell by March" = high urgency).
3. **Review analysis**: If we aggregate client reviews, NLP extracts key themes (response time, professionalism, communication).
4. **Document classification**: Auto-classify uploaded vault documents by type (contract, disclosure, inspection, financial).

**Implementation:**
```
POST /api/nlp/sentiment     → Analyze ticket/lead text
POST /api/nlp/classify      → Classify document type
POST /api/nlp/entities       → Extract entities (names, dates, amounts)
```

**Cost:** $1/1K records (sentiment), $2/1K (classification). First 5K/month free.

---

### 8. Google Cloud Pub/Sub

**Purpose:** Event-driven architecture for background job processing.

**Use Cases:**
1. **Webhook processing**: ShipStation, Stripe, and Dropbox Sign webhooks publish to Pub/Sub topics. Subscriber functions process them asynchronously with retry logic.
2. **Audit event streaming**: All audit events publish to a Pub/Sub topic. Subscribers handle: write to audit table, send notification, update dashboards.
3. **Device state machine**: Pipeline transitions publish events. Subscribers trigger: notification emails, dashboard updates, compliance checks.
4. **Batch job orchestration**: Daily/weekly jobs (storage quota checks, compliance reports) triggered via Pub/Sub scheduled messages.

**Implementation:**
```
Topics:
  - webhook.shipstation
  - webhook.stripe
  - webhook.dropbox-sign
  - audit.events
  - device.transitions
  - jobs.scheduled

Subscribers: Edge Functions or Cloud Functions
```

**Cost:** $40/TB ingested (first 10 GB/month free). Extremely cheap for event volumes.

---

### 9. Google Cloud Storage (as CDN origin)

**Purpose:** Alternative/supplementary storage for static assets and website hosting assets.

**Use Cases:**
1. **Hosted site assets**: Store website templates, theme files, and static assets in GCS buckets with CDN.
2. **Listing photo CDN**: High-resolution listing photos served via GCS + Cloud CDN for global edge caching.
3. **Backup storage**: Nightly backups of Supabase data to GCS for disaster recovery.
4. **Large file staging**: For device firmware images or bulk import files that exceed Supabase Storage practical limits.

**Implementation:**
```
Bucket per tenant: msp-{org_id}-assets
CDN: Cloud CDN in front of GCS buckets
Lifecycle policies: move to Nearline after 90 days, Archive after 1 year
```

**Cost:** $0.020/GB-month (Standard), $0.010/GB (Nearline). Egress: $0.12/GB.

---

### 10. Google Cloud Scheduler + Cloud Tasks

**Purpose:** Scheduled jobs and task queues.

**Use Cases:**
1. **Daily compliance checks**: Schedule Microsoft Graph sync every 15 minutes.
2. **Storage quota warnings**: Daily check of tenant storage usage, send warnings at 80%/95%.
3. **Invoice generation**: Monthly Stripe invoice sync and PDF generation.
4. **Report generation**: Weekly/monthly executive dashboard report snapshots.
5. **Domain renewal reminders**: 30/7/1 day reminders before domain expiration.
6. **Data retention**: Scheduled cleanup of expired files per retention policies.

**Implementation:**
```
Cloud Scheduler → HTTP target (Edge Function or API route)
Jobs:
  - every 15min: /api/jobs/graph-sync
  - daily: /api/jobs/storage-quota-check
  - daily: /api/jobs/retention-cleanup
  - monthly: /api/jobs/billing-sync
  - weekly: /api/jobs/compliance-report
```

**Cost:** 3 free jobs/month, then $0.10/job/month. Cloud Tasks: $0.40/1M operations.

---

## Tier 3 — Future/Nice-to-Have

### 11. Google Cloud Speech-to-Text API

**Use Cases:** Voicemail transcription for missed calls on agent phone lines. Meeting transcription for recorded showing debriefs. Voice commands in mobile app.

**Cost:** $0.006/15 seconds. First 60 min/month free.

### 12. Vertex AI (Gemini API)

**Use Cases:** AI listing description generator from property photos + details. AI-powered ticket response suggestions. Automated compliance report summaries. Chatbot for client portal self-service.

**Cost:** Varies by model. Gemini 1.5 Flash: $0.075/1M input tokens.

### 13. Google Cloud Secret Manager

**Use Cases:** Secure storage for API keys, database credentials, and integration tokens. Rotation policies for secrets. Audit log of secret access.

**Cost:** 6 active secret versions free, then $0.06/version/month.

### 14. Google Identity Platform

**Use Cases:** If we need to extend beyond Supabase Auth — SAML/OIDC SSO for enterprise clients, multi-factor authentication, phone number verification.

**Cost:** Free up to 50K MAU (phone auth: $0.01-0.06/verification).

### 15. Google Workspace Marketplace API

**Use Cases:** Publish the MSP platform as a Google Workspace add-on. Agents can access CRM, vault, and listings from within Gmail/Calendar. One-click install for brokerage IT admins.

**Cost:** Free to publish (Google review process required).

---

## Implementation Priority Matrix

| API | Phase | Value | Effort | Priority |
|-----|-------|-------|--------|----------|
| Firebase Cloud Messaging | Phase 2 | High | Low | **P1** |
| Maps/Places/Geocoding | Phase 2 | High | Medium | **P1** |
| Gmail + Calendar API | Phase 2 | High | High | **P2** |
| Cloud Vision (OCR) | Phase 2 | Medium | Low | **P2** |
| Translation API | Phase 1 | High (Brazil ops) | Low | **P1** |
| GA4 Data API | Phase 2 | Medium | Low | **P2** |
| Cloud Pub/Sub | Phase 2 | High | Medium | **P2** |
| Natural Language API | Phase 3 | Medium | Low | **P3** |
| Cloud Scheduler | Phase 2 | High | Low | **P2** |
| Cloud Storage (CDN) | Phase 2 | Medium | Medium | **P3** |
| Speech-to-Text | Phase 3 | Low | Low | **P4** |
| Vertex AI (Gemini) | Phase 3 | High | High | **P3** |
| Secret Manager | Phase 2 | Medium | Low | **P2** |
| Identity Platform | Phase 3 | Medium | Medium | **P3** |
| Workspace Marketplace | Phase 3 | Low | High | **P4** |

---

## Cost Estimate (Monthly, at Scale)

| API | Estimated Usage | Monthly Cost |
|-----|----------------|-------------|
| Maps/Places | 10K requests | ~$28 (minus $200 credit) |
| Cloud Vision | 5K images | ~$7.50 |
| Translation | 2M characters | ~$40 |
| FCM | Unlimited push | Free |
| GA4 Data API | Reporting queries | Free |
| Cloud Pub/Sub | 1 GB events | Free tier |
| Cloud Scheduler | 10 jobs | ~$0.70 |
| Natural Language | 2K requests | Free tier |
| **Total** | | **~$76/month** |

> Note: Google Cloud offers a $300 free trial credit for new accounts, plus always-free tier for many APIs. At our expected usage, most APIs fall within free tiers during MVP.

---

## Setup Requirements

1. **Google Cloud Project**: Create one GCP project for the platform
2. **Billing Account**: Required even for free-tier APIs
3. **Service Account**: For server-side API calls (Vision, Translation, NLP)
4. **OAuth 2.0 Client**: For user-facing integrations (Gmail, Calendar, Drive)
5. **API Keys**: For client-side APIs (Maps, Places) with HTTP referrer restrictions
6. **IAM Roles**: Principle of least privilege — each service account gets only needed API scopes

All credentials stored in environment variables (Vercel) or Google Cloud Secret Manager.
