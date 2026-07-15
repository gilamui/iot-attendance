export interface DeviceStatus {
  online: boolean
  door: "locked" | "unlocked"
  uptime: number
  freeHeap: number
  enrollment_mode: boolean
  rssi?: number
  lastSeen?: string
  firmware?: string
}

export interface ScanEvent {
  fingerprint_id: number
  confidence: number
  match: boolean
  timestamp: number
  receivedAt?: string
}

export interface EnrollmentEvent {
  status:
    | "started"
    | "scan1_prompt"
    | "scan2_prompt"
    | "completed"
    | "failed"
    | "failed_mismatch"
    | "cancelled"
    | "deleted"
  fingerprint_id?: number
}

export interface DeviceLog {
  event: string
  message: string
  timestamp: number
}

export interface DeviceAlert {
  type: string
  message: string
}

export interface DeviceCommand {
  action:
    | "unlock"
    | "status"
    | "enroll_start"
    | "enroll_cancel"
    | "delete_fingerprint"
  fingerprint_id?: number
}
