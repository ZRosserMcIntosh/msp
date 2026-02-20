// ═══════════════════════════════════════════════════════════
//  MSP Platform — Shared Type Definitions
//  Used by: web, mobile, edge functions
// ═══════════════════════════════════════════════════════════

// ── Roles ──
export type PlatformRole =
  | "platform_admin"
  | "platform_tech"
  | "client_admin"
  | "client_manager"
  | "client_agent"
  | "client_viewer";

// ── Organization ──
export interface Organization {
  id: string;
  name: string;
  slug: string;
  is_platform: boolean;
  logo_url: string | null;
  settings: Record<string, unknown>;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Profile ──
export interface Profile {
  id: string;
  org_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: PlatformRole;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Team ──
export interface Team {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Device ──
export type DeviceType =
  | "laptop"
  | "desktop"
  | "phone"
  | "tablet"
  | "monitor"
  | "printer"
  | "accessory"
  | "other";

export type DeviceStatus =
  | "received"
  | "provisioned"
  | "qa_passed"
  | "shipped"
  | "active"
  | "retired";

export interface Device {
  id: string;
  org_id: string;
  assigned_to: string | null;
  serial_number: string;
  asset_tag: string | null;
  device_type: DeviceType;
  manufacturer: string | null;
  model: string | null;
  status: DeviceStatus;
  shipstation_order_id: string | null;
  tracking_number: string | null;
  carrier: string | null;
  intune_device_id: string | null;
  entra_device_id: string | null;
  compliance_state: string | null;
  last_compliance_check: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_expiry: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Device Event ──
export interface DeviceEvent {
  id: string;
  device_id: string;
  org_id: string;
  actor_id: string | null;
  from_status: DeviceStatus | null;
  to_status: DeviceStatus;
  notes: string | null;
  checklist: Record<string, boolean> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Ticket ──
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";

export interface Ticket {
  id: string;
  org_id: string;
  created_by: string;
  assigned_to: string | null;
  device_id: string | null;
  subject: string;
  description: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  category: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  sla_due_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Vault ──
export type EsignStatus = "pending" | "sent" | "signed" | "declined" | "voided";

export interface VaultFile {
  id: string;
  org_id: string;
  folder_id: string | null;
  uploaded_by: string | null;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number;
  esign_envelope_id: string | null;
  esign_status: EsignStatus | null;
  retention_until: string | null;
  is_archived: boolean;
  thumbnail_path: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Audit Event ──
export interface AuditEvent {
  id: string;
  org_id: string | null;
  actor_id: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Subscription ──
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete";

export interface Subscription {
  id: string;
  org_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: SubscriptionStatus;
  plan_name: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Storage Quota ──
export interface StorageQuota {
  id: string;
  org_id: string;
  plan_name: string;
  storage_limit_bytes: number;
  storage_used_bytes: number;
  transfer_limit_bytes: number;
  transfer_used_bytes: number;
  billing_period_start: string;
  created_at: string;
  updated_at: string;
}
