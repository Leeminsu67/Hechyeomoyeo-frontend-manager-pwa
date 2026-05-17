import { ROLE } from "@/types/user";

export type PushNotificationRole = string | number | null | undefined;

const PUSH_NOTIFICATION_ROLE_VALUES = new Set<number>([
  ROLE.OWNER,
  ROLE.HR_MANAGER,
  ROLE.MANAGER,
]);

export function canUsePushNotifications(role: PushNotificationRole) {
  return PUSH_NOTIFICATION_ROLE_VALUES.has(Number(role));
}
