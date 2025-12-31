
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { float32ToInt16, int16ToFloat32, base64ToUint8Array, arrayBufferToBase64, audioWorkletCode } from "./audio";
import { UserData, Language } from "../types";

// Types for callbacks
type OnMessageCallback = (text: string, isFinal: boolean) => void;
type OnToolCallCallback = (toolCall: any) => void;
type OnStatusChangeCallback = (isActive: boolean) => void;

export class LiveClient {
  private ai: GoogleGenAI;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private nextStartTime: number = 0;
  private session: any = null; // Session object from verify
  private isConnected: boolean = false;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(
    userData: UserData,
    language: Language,
    onMessage: OnMessageCallback,
    onToolCall: OnToolCallCallback,
    onStatusChange: OnStatusChangeCallback
  ) {
    if (this.isConnected) return;

    try {
      // 1. Setup Audio Context - Try to enforce 24kHz for consistency with Gemini
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await this.audioContext.audioWorklet.addModule(
        URL.createObjectURL(new Blob([audioWorkletCode], { type: "text/javascript" }))
      );

      // 2. Setup Microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000 
      }});

      // 3. Connect to Gemini Live
      const userName = userData.name || "Friend";
      const userStrengths = userData.assessmentStrengths.filter(s => s).join(', ') || "None yet";
      
      // --- STRICT LANGUAGE & ROLE CONFIGURATION ---
      
      const cantoneseInstruction = `
      CRITICAL LANGUAGE RULE: You MUST speak in **Hong Kong Colloquial Cantonese (廣東話口語)**.
      - NEVER read Written Chinese (書面語) aloud. 
      - Use "係" not "是", "嘅" not "的", "依家" not "現在", "講" not "說".
      - Tone: Warm, patient, soft counseling tone (溫柔, 耐心, 輔導語氣). Not robotic.
      `;

      const englishInstruction = `
      LANGUAGE: Speak in clear, professional British English.
      Tone: Professional, supportive, structured (like an experienced executive coach).
      `;

      const langInstruction = language === 'zh-HK' ? cantoneseInstruction : englishInstruction;

      const openingLine = language === 'zh-HK' 
          ? `你好 ${userName}。我是你的優勢教練。今日我們會通過對話，找出你成功的模式。我們開始吧？請告訴我最近一次，你覺得自己表現得最好、最有活力的經歷。`
          : `Hello ${userName}. I am your Strength Coach. Our goal today is to uncover your patterns of success. Let's start. Could you tell me about a recent time when you felt truly at your best—energized and effective?`;

      const roleInstruction = `
      ROLE: You are an **Empathetic Life Coach & Strength Counselor**.
      
      GOAL: To create a safe, supportive space for the user to explore their strengths and stories. Your priority is psychological safety and feeling heard, not just data extraction.
      
      PROTOCOL:
      1. **DEEP LISTENING (CRITICAL)**: 
         - **NEVER INTERRUPT**. Allow long pauses. Silence is where insight happens. 
         - Wait at least 1-2 seconds of silence before responding to ensure the user is truly finished.
         - If the user is struggling to find words, give them space. Do not rush to fill the void.
      
      2. **Reflective Responses**: 
         - Before asking a new question, briefly validate or reflect on what they just shared (e.g., "I can hear how meaningful that moment was for you...").
         - Use a warm, calm, and steady pace. Do not sound robotic or rushed.
      
      3. **Gentle Inquiry**: 
         - Ask *one* open-ended question at a time.
         - Invite depth rather than demanding facts. (e.g., "What was happening inside you at that moment?" instead of "What did you do?")
      
      4. **Capture**: When you hear a clear Strength Pattern (Action + Energy), call the 'proposeStory' tool implicitly without breaking the flow.
      
      OPENING LINE SCRIPT: "${openingLine}"
      
      CONTEXT:
      User's Top Strengths: ${userStrengths}
      `;

      const sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: `${roleInstruction} ${langInstruction}`,
          tools: [{
            functionDeclarations: [
                {
                    name: "proposeStory",
                    description: "Save a COMPLETED strength story. Only call this after the user has described a full event.",
                    parameters: {
                        type: "OBJECT" as any,
                        properties: {
                            text: { type: "STRING" as any, description: "A summary of the story the user just told." },
                            pattern: { type: "STRING" as any, description: "The strength pattern identified." },
                            action: { type: "STRING" as any, description: "The specific action they took." },
                            feeling: { type: "STRING" as any, description: "How they felt (e.g. Energized)." }
                        },
                        required: ["text", "pattern"]
                    }
                },
                {
                    name: "proposeStrength",
                    description: "Save a newly discovered strength name.",
                    parameters: {
                        type: "OBJECT" as any,
                        properties: {
                            strength: { type: "STRING" as any }
                        },
                        required: ["strength"]
                    }
                }
            ]
          }],
        },
        callbacks: {
            onopen: async () => {
                console.log("Live Session Connected");
                this.isConnected = true;
                onStatusChange(true);

                // KICKSTART: Force the model to start the protocol.
                // We send a text input acting as a "system trigger".
                // We add a small delay to ensure the WebSocket audio channel is ready.
                setTimeout(() => {
                    if (this.isConnected) {
                        const triggerMsg = "SYSTEM_TRIGGER: The session has started. Speak the OPENING LINE SCRIPT now. REMEMBER: DO NOT INTERRUPT THE USER.";
                        sessionPromise.then(s => s.sendRealtimeInput([{ mimeType: "text/plain", data: triggerMsg }]));
                    }
                }, 100);
            },
            onmessage: async (msg: LiveServerMessage) => {
                // Handle Audio Output
                const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                    this.playAudioChunk(audioData);
                }

                // Handle Tool Calls
                if (msg.toolCall) {
                    console.log("Tool Call Received:", msg.toolCall);
                    // Iterate through function calls
                    if(msg.toolCall.functionCalls) {
                        for(const fc of msg.toolCall.functionCalls) {
                             onToolCall({ name: fc.name, args: fc.args, id: fc.id });
                             // Send immediate response to keep flow going
                             sessionPromise.then(s => s.sendToolResponse({
                                 functionResponses: {
                                     name: fc.name,
                                     id: fc.id,
                                     response: { result: "OK" }
                                 }
                             }));
                        }
                    }
                }
            },
            onclose: () => {
                console.log("Live Session Closed");
                this.disconnect(onStatusChange);
            },
            onerror: (e) => {
                console.error("Live Session Error", e);
                this.disconnect(onStatusChange);
            }
        }
      });

      this.session = sessionPromise;

      // 4. Start Audio Streaming (Input)
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-recorder');
      
      this.workletNode.port.onmessage = (event) => {
          const float32Data = event.data;
          const currentSampleRate = this.audioContext?.sampleRate || 24000;
          const int16Data = float32ToInt16(float32Data);
          const base64Data = arrayBufferToBase64(int16Data.buffer);
          
          // Only send audio if connected
          if (this.isConnected) {
              sessionPromise.then(session => {
                  session.sendRealtimeInput({
                      media: {
                          mimeType: `audio/pcm;rate=${currentSampleRate}`, 
                          data: base64Data
                      }
                  });
              });
          }
      };

      this.sourceNode.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination); // Keep alive

    } catch (e) {
      console.error("Connection Failed", e);
      this.disconnect(onStatusChange);
      throw e;
    }
  }

  private async playAudioChunk(base64Data: string) {
      if (!this.audioContext) return;
      
      const uint8 = base64ToUint8Array(base64Data);
      const float32 = int16ToFloat32(uint8.buffer);
      
      const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      const now = this.audioContext.currentTime;
      // Schedule to ensure no overlap but minimal gap
      const startTime = Math.max(now, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;
  }

  disconnect(onStatusChange: OnStatusChangeCallback) {
    this.isConnected = false;
    onStatusChange(false);
    
    if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
    }
    if (this.workletNode) {
        this.workletNode.disconnect();
        this.workletNode = null;
    }
    if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop());
        this.mediaStream = null;
    }
    if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
    }
    // Close Gemini session if possible
    if (this.session) {
        this.session.then((s: any) => s.close && s.close());
        this.session = null;
    }
  }
}
