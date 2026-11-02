import { InputError } from '../types';

/**
 * Voice statement: Muse Voice Transcribe on the Meta Model API turns a victim's spoken account
 * (in English, Nigerian Pidgin, Igbo, Yoruba or Hausa) into text for the police-report draft.
 * The browser records and converts to 16 kHz mono WAV, which is what the API accepts.
 */

const MODEL = () => process.env.META_TRANSCRIBE_MODEL || 'muse-voice-transcribe-1.0';
const LANGUAGE_BIAS: Record<string, string[]> = {
  english: ['English'],
  pidgin: ['Nigerian Pidgin', 'English'],
  igbo: ['Igbo', 'English'],
  yoruba: ['Yoruba', 'English'],
  hausa: ['Hausa', 'English'],
};
const KEYWORDS = ['TraceX', 'USDT', 'USDC', 'ETH', 'Ethereum', 'BNB', 'Binance', 'Bybit', 'wallet', 'transaction hash', 'crypto'];

export function checkWav(audio: Buffer) {
  if (!Buffer.isBuffer(audio) || audio.length < 44) throw new InputError('audio required: a WAV recording');
  if (audio.toString('ascii', 0, 4) !== 'RIFF' || audio.toString('ascii', 8, 12) !== 'WAVE') {
    throw new InputError('audio must be a WAV file (16 kHz mono PCM)');
  }
}

async function send(audio: Buffer, languageBias?: string[]) {
  const apiKey = process.env.META_API_KEY;
  if (!apiKey) throw new Error('no key - set META_API_KEY');
  const form = new FormData();
  form.append('request', new Blob([JSON.stringify({
    model: MODEL(),
    audioEncoding: 'WAV',
    mode: 'PUSH_TO_TALK',
    keywords: KEYWORDS,
    ...(languageBias ? { languageBias } : {}),
  })], { type: 'application/json' }));
  form.append('audio', new Blob([new Uint8Array(audio)], { type: 'audio/wav' }), 'statement.wav');
  const base = process.env.META_API_BASE_URL || 'https://api.meta.ai/v1';
  return fetch(`${base}/asr/transcribe`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
}

export async function transcribeStatement(audio: Buffer, language = 'english') {
  checkWav(audio);
  let res = await send(audio, LANGUAGE_BIAS[language]);
  // an unrecognised language hint is a 400 - let the model detect the language instead
  if (res.status === 400 && LANGUAGE_BIAS[language]) res = await send(audio);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Muse Voice Transcribe error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json() as { transcript?: string; audioDurationMs?: number };
  const transcript = data.transcript?.trim();
  if (!transcript) throw new Error('No speech was recognised in the recording.');
  return { model: MODEL(), transcript, durationMs: data.audioDurationMs ?? 0 };
}
