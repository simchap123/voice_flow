export type RecordingState =
  | 'IDLE'
  | 'RECORDING'
  | 'PROCESSING_STT'
  | 'PROCESSING_CLEANUP'
  | 'INJECTING'
  | 'CANCELLED'

export interface TranscriptionResult {
  rawText: string
  cleanedText: string
  duration: number
  timestamp: number
  language: string
  wordCount: number
}

export interface HistoryEntry {
  id: string
  rawText: string
  cleanedText: string
  duration: number
  timestamp: number
  language: string
  wordCount: number
}
