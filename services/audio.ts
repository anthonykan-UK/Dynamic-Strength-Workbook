
/**
 * Audio Utilities for Gemini Live API
 * Handles conversion between Web Audio API (Float32) and Gemini (PCM Int16).
 */

export function base64ToUint8Array(base64String: string): Uint8Array {
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Float32 (Web Audio) to Int16 (Gemini)
export function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

// Convert Int16 (Gemini) to Float32 (Web Audio)
export function int16ToFloat32(int16Buffer: ArrayBuffer): Float32Array {
  const int16Array = new Int16Array(int16Buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    const int = int16Array[i];
    float32Array[i] = int >= 0 ? int / 0x7FFF : int / 0x8000;
  }
  return float32Array;
}

// Optimized Audio Worklet code as a Blob URL (to avoid external file requirement)
export const audioWorkletCode = `
class AudioRecorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.index = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.index++] = channelData[i];
        if (this.index === this.bufferSize) {
          this.port.postMessage(this.buffer.slice());
          this.index = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('audio-recorder', AudioRecorder);
`;
