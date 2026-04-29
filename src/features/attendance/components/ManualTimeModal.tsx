"use client";

import { useState } from "react";
import { LogIn, LogOut, X, Clock } from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { useManualCheckIn, useManualCheckOut } from "../hooks/useAttendance";

type ActionType = "checkIn" | "checkOut";

interface ManualTimeModalProps {
  actionType: ActionType;
  scheduleId: string;
  userId: string;
  userName: string;
  zoneName: string;
  date: string; // "YYYY-MM-DD"
  onClose: () => void;
}

// "YYYY-MM-DD" + "HH:mm" → ISO 8601 UTC (예: "2026-04-14T00:00:00.000Z")
// new Date("YYYY-MM-DDTHH:mm:00")는 timezone 없으면 로컬 시간으로 파싱 → toISOString()으로 UTC 변환
function toUTCISOString(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

// 현재 시각 → "HH:mm"
function getNowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// 오늘 날짜 → "YYYY-MM-DD"
function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ManualTimeModal({
  actionType,
  scheduleId,
  userId,
  userName,
  zoneName,
  date,
  onClose,
}: ManualTimeModalProps) {
  const [time, setTime] = useState(getNowTime);

  const { mutate: checkIn, isPending: checkingIn } = useManualCheckIn();
  const { mutate: checkOut, isPending: checkingOut } = useManualCheckOut();
  const isPending = checkingIn || checkingOut;

  const isCheckIn = actionType === "checkIn";
  const Icon = isCheckIn ? LogIn : LogOut;
  const title = isCheckIn ? "출근 시간 입력" : "퇴근 시간 입력";
  const btnColor = isCheckIn
    ? "bg-success/80 hover:bg-success text-success-foreground"
    : "bg-secondary/80 hover:bg-secondary text-secondary-foreground";

  // 선택된 날짜가 오늘이면 현재 시각까지만 허용, 과거 날짜면 제한 없음
  const maxTime = date === getToday() ? getNowTime() : undefined;

  const isFutureTime =
    maxTime !== undefined && time > maxTime;

  const handleSubmit = () => {
    if (isFutureTime) return;
    const utcISO = toUTCISOString(date, time);
    if (isCheckIn) {
      checkIn(
        { scheduleId, userId, checkInTime: utcISO },
        { onSuccess: onClose }
      );
    } else {
      checkOut(
        { scheduleId, userId, checkOutTime: utcISO },
        { onSuccess: onClose }
      );
    }
  };

  return (
    <BaseModal open={true} onClose={onClose} maxWidth="max-w-sm" closeOnBackdrop={false}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Icon
                className={`w-5 h-5 ${
                  isCheckIn ? "text-success-foreground" : "text-secondary-foreground"
                }`}
              />
              <h2 className="text-lg font-bold text-text-strong">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* 대상 인력 정보 */}
            <div className="bg-muted rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-text-strong">{userName}</p>
              <p className="text-xs text-muted-foreground">
                {zoneName} · {date}
              </p>
            </div>

            {/* 시간 입력 */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {isCheckIn ? "출근 시간" : "퇴근 시간"}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="time"
                  value={time}
                  max={maxTime}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 text-base font-semibold border border-border rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
                />
              </div>
              {isFutureTime && (
                <p className="mt-1.5 text-xs text-danger-foreground">
                  현재 시각({maxTime}) 이후로는 설정할 수 없습니다.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 pb-5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-text rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!time || isFutureTime || isPending}
              className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${btnColor}`}
            >
              {isPending ? "처리 중..." : "입력 완료"}
            </button>
          </div>
    </BaseModal>
  );
}
