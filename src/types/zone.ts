// ─── Zone ─────────────────────────────────────────────────────────────────────

export interface ZoneItem {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  workStartTime: string | null;
  workEndTime: string | null;
  isOvernight: boolean;
  sortOrder: number;
  requiredWorkers: number;
  repeatWeekdays: number[] | null;
  site: { id: string; name: string };
  createdAt: string;
}

/** POST /zone/:siteId — 백엔드 CreateZoneDto 와 1:1 대응
 *  - description: @IsNotEmpty() (entity는 nullable이지만 DTO는 필수)
 *  - sortOrder: @IsOptional() → 미전송 시 백엔드가 자동 계산
 *  - requiredWorkers: @IsOptional() — 기본값 1
 *  - repeatWeekdays: @IsOptional() — null이면 매일 운영
 */
export interface CreateZoneDto {
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  workStartTime: string;
  workEndTime: string;
  isOvernight?: boolean;
  sortOrder?: number;
  requiredWorkers?: number;
  repeatWeekdays?: number[] | null;
}

export type UpdateZoneDto = Partial<CreateZoneDto>;

/** take 는 @IsIn([5, 10, 30, 50, 100]) 제약 */
export type ZoneTake = 5 | 10 | 30 | 50 | 100;

export interface ZoneListParams {
  page: number;
  take: ZoneTake;
  name?: string;
}

export interface ZoneListResponse {
  data: { zones: ZoneItem[]; total: number };
}
