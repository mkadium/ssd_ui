export type InvitationStatus = "CREATED" | "SENT" | "OPENED" | "SETUP_COMPLETED" | "EXPIRED" | "REVOKED" | "SUPERSEDED";
export type DeliveryChannel = "EMAIL" | "MANUAL_COPY" | "SMS" | "WHATSAPP";
export type DeliveryStatus = "PENDING_MANUAL_SEND" | "QUEUED" | "SENT" | "DELIVERED" | "FAILED";
export type InvitationEventType = "CREATED" | "TOKEN_GENERATED" | "OUTBOX_CREATED" | "SENT" | "OPENED" | "SETUP_COMPLETED" | "RESENT" | "REVOKED" | "EXPIRED";

export type InvitationRecordSample = {
  invitation_code: string;
  request_code: string;
  item_code: string;
  assignment_code: string;
  source_organization_name: string;
  officer_name: string;
  contact_email: string;
  contact_mobile?: string;
  delivery_channel: DeliveryChannel;
  delivery_status: DeliveryStatus;
  invitation_status: InvitationStatus;
  created_at: string;
  sent_at?: string;
  expires_at: string;
  first_opened_at?: string;
  setup_completed_at?: string;
  revoked_at?: string;
  one_time_link_available: boolean;
  access_scope_label: string;
};

export type InvitationEventSample = {
  event_code: string;
  invitation_code: string;
  event_type: InvitationEventType;
  event_status: "INFO" | "WARNING" | "ERROR";
  occurred_at: string;
  actor: string;
  message: string;
};

export type NotificationOutboxSample = {
  outbox_code: string;
  invitation_code: string;
  channel: DeliveryChannel;
  delivery_status: DeliveryStatus;
  recipient: string;
  created_at: string;
  last_attempt_at?: string;
  attempt_count: number;
};

export const invitationRecords: InvitationRecordSample[] = [
  {
    invitation_code: "INV_REQ_SDG_NIF_2025_0001_PROVIDER",
    request_code: "REQ_SDG_NIF_2025_0001",
    item_code: "REQITEM_NIF_1_2_1_2025",
    assignment_code: "ASN_REQ_SDG_NIF_2025_0001_PROVIDER",
    source_organization_name: "Social Statistics Division",
    officer_name: "SSD Demo Officer",
    contact_email: "ssd.demo.officer@example.gov.in",
    contact_mobile: "masked",
    delivery_channel: "MANUAL_COPY",
    delivery_status: "PENDING_MANUAL_SEND",
    invitation_status: "CREATED",
    created_at: "2026-05-29 08:22",
    expires_at: "2026-06-05 08:22",
    one_time_link_available: true,
    access_scope_label: "REQ_SDG_NIF_2025_0001 / REQITEM_NIF_1_2_1_2025",
  },
  {
    invitation_code: "INV_REQ_SDG_NIF_2025_0002_OWNER",
    request_code: "REQ_SDG_NIF_2025_0002",
    item_code: "REQITEM_NIF_1_2_1_2025_STATE",
    assignment_code: "ASN_REQ_SDG_NIF_2025_0002_OWNER",
    source_organization_name: "State Planning Unit",
    officer_name: "State Reviewer",
    contact_email: "state.reviewer@example.gov.in",
    contact_mobile: "masked",
    delivery_channel: "EMAIL",
    delivery_status: "SENT",
    invitation_status: "OPENED",
    created_at: "2026-05-30 09:15",
    sent_at: "2026-05-30 09:17",
    expires_at: "2026-06-06 09:15",
    first_opened_at: "2026-05-30 11:03",
    one_time_link_available: false,
    access_scope_label: "REQ_SDG_NIF_2025_0002 / REQITEM_NIF_1_2_1_2025_STATE",
  },
  {
    invitation_code: "INV_REQ_HEALTH_2025_0001_PROVIDER",
    request_code: "REQ_HEALTH_2025_0001",
    item_code: "REQITEM_NIF_3_8_1_2025",
    assignment_code: "ASN_REQ_HEALTH_2025_0001_PROVIDER",
    source_organization_name: "Health Statistics Unit",
    officer_name: "Health Data Officer",
    contact_email: "health.data.officer@example.gov.in",
    delivery_channel: "EMAIL",
    delivery_status: "DELIVERED",
    invitation_status: "SETUP_COMPLETED",
    created_at: "2026-05-31 09:30",
    sent_at: "2026-05-31 09:32",
    expires_at: "2026-06-07 09:30",
    first_opened_at: "2026-05-31 10:04",
    setup_completed_at: "2026-05-31 10:08",
    one_time_link_available: false,
    access_scope_label: "REQ_HEALTH_2025_0001 / REQITEM_NIF_3_8_1_2025",
  },
  {
    invitation_code: "INV_REQ_OLD_2025_REVOKED",
    request_code: "REQ_OLD_2025_0004",
    item_code: "REQITEM_OLD_2025_0004",
    assignment_code: "ASN_REQ_OLD_2025_0004_PROVIDER",
    source_organization_name: "Legacy Source Unit",
    officer_name: "Retired Officer",
    contact_email: "retired.officer@example.gov.in",
    delivery_channel: "EMAIL",
    delivery_status: "FAILED",
    invitation_status: "REVOKED",
    created_at: "2026-05-20 12:00",
    sent_at: "2026-05-20 12:05",
    expires_at: "2026-05-27 12:00",
    revoked_at: "2026-05-21 09:10",
    one_time_link_available: false,
    access_scope_label: "REQ_OLD_2025_0004 / REQITEM_OLD_2025_0004",
  },
];

export const invitationEvents: InvitationEventSample[] = [
  {
    event_code: "INVEVT_REQ_SDG_0001_CREATED",
    invitation_code: "INV_REQ_SDG_NIF_2025_0001_PROVIDER",
    event_type: "CREATED",
    event_status: "INFO",
    occurred_at: "2026-05-29 08:22",
    actor: "Request send workflow",
    message: "Request-linked invitation created from assignment.",
  },
  {
    event_code: "INVEVT_REQ_SDG_0001_TOKEN",
    invitation_code: "INV_REQ_SDG_NIF_2025_0001_PROVIDER",
    event_type: "TOKEN_GENERATED",
    event_status: "INFO",
    occurred_at: "2026-05-29 08:22",
    actor: "API",
    message: "One-time setup token generated. Only token hash is stored.",
  },
  {
    event_code: "INVEVT_REQ_SDG_0001_OUTBOX",
    invitation_code: "INV_REQ_SDG_NIF_2025_0001_PROVIDER",
    event_type: "OUTBOX_CREATED",
    event_status: "WARNING",
    occurred_at: "2026-05-29 08:23",
    actor: "Notification outbox",
    message: "Manual-copy delivery metadata created. Email provider integration is pending.",
  },
  {
    event_code: "INVEVT_REQ_SDG_0002_SENT",
    invitation_code: "INV_REQ_SDG_NIF_2025_0002_OWNER",
    event_type: "SENT",
    event_status: "INFO",
    occurred_at: "2026-05-30 09:17",
    actor: "Notification outbox",
    message: "Invitation email marked as sent.",
  },
  {
    event_code: "INVEVT_REQ_SDG_0002_OPENED",
    invitation_code: "INV_REQ_SDG_NIF_2025_0002_OWNER",
    event_type: "OPENED",
    event_status: "INFO",
    occurred_at: "2026-05-30 11:03",
    actor: "Temporary contributor",
    message: "Setup link opened for contributor onboarding.",
  },
  {
    event_code: "INVEVT_HEALTH_0001_SETUP",
    invitation_code: "INV_REQ_HEALTH_2025_0001_PROVIDER",
    event_type: "SETUP_COMPLETED",
    event_status: "INFO",
    occurred_at: "2026-05-31 10:08",
    actor: "Temporary contributor",
    message: "Temporary data provider account setup completed.",
  },
  {
    event_code: "INVEVT_OLD_REVOKED",
    invitation_code: "INV_REQ_OLD_2025_REVOKED",
    event_type: "REVOKED",
    event_status: "WARNING",
    occurred_at: "2026-05-21 09:10",
    actor: "Request administrator",
    message: "Invitation revoked after officer change.",
  },
];

export const notificationOutbox: NotificationOutboxSample[] = [
  {
    outbox_code: "OUTBOX_INV_REQ_SDG_0001",
    invitation_code: "INV_REQ_SDG_NIF_2025_0001_PROVIDER",
    channel: "MANUAL_COPY",
    delivery_status: "PENDING_MANUAL_SEND",
    recipient: "ssd.demo.officer@example.gov.in",
    created_at: "2026-05-29 08:23",
    attempt_count: 0,
  },
  {
    outbox_code: "OUTBOX_INV_REQ_SDG_0002",
    invitation_code: "INV_REQ_SDG_NIF_2025_0002_OWNER",
    channel: "EMAIL",
    delivery_status: "SENT",
    recipient: "state.reviewer@example.gov.in",
    created_at: "2026-05-30 09:16",
    last_attempt_at: "2026-05-30 09:17",
    attempt_count: 1,
  },
  {
    outbox_code: "OUTBOX_INV_REQ_HEALTH_0001",
    invitation_code: "INV_REQ_HEALTH_2025_0001_PROVIDER",
    channel: "EMAIL",
    delivery_status: "DELIVERED",
    recipient: "health.data.officer@example.gov.in",
    created_at: "2026-05-31 09:31",
    last_attempt_at: "2026-05-31 09:32",
    attempt_count: 1,
  },
];
