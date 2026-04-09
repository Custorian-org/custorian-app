import { Audio } from 'expo-av';
import { analyzeText, RiskAlert, createAlert } from './riskEngine';

// ── CONFIGURATION ────────────────────────────────────────────
// Replace with your actual OpenAI API key for Whisper transcription
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';

const WHISPER_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

/** Default recording chunk duration in milliseconds */
const DEFAULT_CHUNK_MS = 10_000;

// ── TYPES ────────────────────────────────────────────────────

export interface VoiceMonitorConfig {
  /** Recording chunk duration in ms (default 10 000) */
  chunkDurationMs?: number;
  /** Callback fired when the risk engine detects a threat */
  onAlert: (alert: RiskAlert) => void;
}

interface WhisperResponse {
  text: string;
  language?: string;
}

// ── TRANSCRIPTION ────────────────────────────────────────────

/**
 * Sends a recorded audio file to the OpenAI Whisper API and returns
 * the transcribed text. The `language` field is left unset so Whisper
 * auto-detects between English, Danish, and other languages.
 */
export async function transcribeAudio(fileUri: string): Promise<WhisperResponse> {
  const formData = new FormData();

  // React Native FormData accepts the { uri, name, type } object
  formData.append('file', {
    uri: fileUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  formData.append('model', 'whisper-1');
  // Omit "language" so Whisper auto-detects (supports both English & Danish)
  formData.append('response_format', 'verbose_json');

  const response = await fetch(WHISPER_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      // Content-Type is set automatically by FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Whisper API error ${response.status}: ${errBody}`);
  }

  const json = await response.json();
  return {
    text: json.text ?? '',
    language: json.language ?? undefined,
  };
}

// ── VOICE MONITOR CLASS ──────────────────────────────────────

export class VoiceMonitor {
  private recording: Audio.Recording | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private isListening = false;
  private chunkDurationMs: number;
  private onAlert: (alert: RiskAlert) => void;

  constructor(config: VoiceMonitorConfig) {
    this.chunkDurationMs = config.chunkDurationMs ?? DEFAULT_CHUNK_MS;
    this.onAlert = config.onAlert;
  }

  // ── Permissions ──────────────────────────────────────────

  /** Request microphone permission. Returns true if granted. */
  async requestPermission(): Promise<boolean> {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  }

  // ── Lifecycle ────────────────────────────────────────────

  /**
   * Start continuous voice monitoring.
   * Records audio in chunks, transcribes each chunk via Whisper,
   * then pipes the text through the risk engine.
   */
  async startListening(): Promise<void> {
    if (this.isListening) return;

    const granted = await this.requestPermission();
    if (!granted) {
      throw new Error('Microphone permission not granted');
    }

    // Prepare audio mode for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    this.isListening = true;
    await this.startChunk();

    // Every chunkDurationMs, stop the current recording, process it,
    // and immediately start a new one.
    this.timer = setInterval(async () => {
      if (!this.isListening) return;
      try {
        await this.rotateChunk();
      } catch (err) {
        console.warn('[VoiceMonitor] chunk rotation error:', err);
      }
    }, this.chunkDurationMs);
  }

  /** Stop voice monitoring and release resources. */
  async stopListening(): Promise<void> {
    this.isListening = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch {
        // Already stopped — ignore
      }
      this.recording = null;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
  }

  // ── Internal helpers ─────────────────────────────────────

  private async startChunk(): Promise<void> {
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    this.recording = recording;
  }

  /**
   * Stop the current recording, kick off transcription + analysis
   * in the background, and immediately start a new chunk so we
   * don't miss any audio.
   */
  private async rotateChunk(): Promise<void> {
    const finished = this.recording;
    if (!finished) return;

    // Stop the finished chunk
    await finished.stopAndUnloadAsync();
    const uri = finished.getURI();

    // Start a new chunk right away to minimise gaps
    this.recording = null;
    if (this.isListening) {
      await this.startChunk();
    }

    // Process the finished chunk (fire-and-forget so recording isn't blocked)
    if (uri) {
      this.processChunk(uri).catch((err) =>
        console.warn('[VoiceMonitor] processing error:', err),
      );
    }
  }

  /**
   * Transcribe one audio chunk and run the text through the risk engine.
   * If a threat is detected, fire the onAlert callback.
   */
  private async processChunk(fileUri: string): Promise<void> {
    const { text, language } = await transcribeAudio(fileUri);

    if (!text || text.trim().length === 0) return;

    const result = analyzeText(text);
    if (result) {
      const sourceLabel =
        language === 'da' ? 'Voice Chat (Danish)' :
        language === 'en' ? 'Voice Chat (English)' :
        `Voice Chat (${language ?? 'unknown'})`;

      const alert = createAlert(result.category, result.score, text, sourceLabel);
      this.onAlert(alert);
    }
  }
}

// ── SINGLETON CONVENIENCE EXPORT ─────────────────────────────

let _instance: VoiceMonitor | null = null;

/**
 * Get or create a shared VoiceMonitor instance.
 * Call with an onAlert callback the first time; subsequent calls
 * return the same instance.
 */
export function getVoiceMonitor(onAlert?: (alert: RiskAlert) => void): VoiceMonitor {
  if (!_instance) {
    if (!onAlert) {
      throw new Error('getVoiceMonitor requires an onAlert callback on first call');
    }
    _instance = new VoiceMonitor({ onAlert });
  }
  return _instance;
}
