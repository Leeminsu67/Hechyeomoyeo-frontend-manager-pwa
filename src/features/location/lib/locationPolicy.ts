export const LOCATION_DELAYED_MS = 10 * 60 * 1000;
export const LOCATION_INTERRUPTION_SUSPECTED_MS = 15 * 60 * 1000;
export const LOCATION_LONG_MISSING_MS = 30 * 60 * 1000;

export const LOCATION_MANAGER_FIRST_ALERT_MS =
  LOCATION_INTERRUPTION_SUSPECTED_MS;
export const LOCATION_MANAGER_REPEAT_ALERT_MS = LOCATION_LONG_MISSING_MS;
export const LOCATION_HISTORY_GAP_MS = LOCATION_DELAYED_MS;

export const LOCATION_ADMIN_DELAYED_MESSAGE =
  "위치 정보 수신이 지연되고 있습니다. 근무자의 앱 실행 상태, 위치 권한, 네트워크 상태에 따라 발생할 수 있습니다.";

export const LOCATION_WORKER_START_NOTICE =
  "근무 중에는 원활한 위치 기록을 위해 앱을 종료하지 않고 유지해 주세요. 앱을 강제 종료하거나 위치 권한이 변경될 경우 위치 기록이 중단될 수 있으며, 관리자 화면에 위치 수신 지연 상태로 안내될 수 있습니다.";

export const LOCATION_WORKER_CHECK_REQUEST_MESSAGE =
  "위치 수신이 지연되고 있습니다. 앱 실행 상태와 위치 권한을 확인해 주세요.";
