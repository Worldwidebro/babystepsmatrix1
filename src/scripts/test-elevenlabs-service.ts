import { ElevenLabsService } from "../services/elevenlabs-service";
import fs from "fs";
import path from "path";

async function testElevenLabsService() {
  try {
    const service = new ElevenLabsService();

    // Test getting available voices
    console.log("Fetching available voices...");
    const voices = await service.getAvailableVoices();
    console.log("Available voices:", voices);

    // Test generating speech with advanced settings
    const text = "Hello! This is a test of the ElevenLabs service.";
    const voiceId = voices[0].voice_id;

    console.log("Generating speech with advanced settings...");
    const audioBuffer = await service.generateSpeech(
      text,
      voiceId,
      "eleven_multilingual_v2",
      {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        speaker_boost: true,
        emotion: "happy",
        speaking_rate: 1.2,
        pitch: 1.1,
        volume: 1.0,
      }
    );

    // Save the audio to a file
    const outputPath = path.join(__dirname, "../../output/test-speech.mp3");
    fs.writeFileSync(outputPath, audioBuffer);
    console.log("Audio saved to:", outputPath);

    // Test streaming with chunk handling
    console.log("Testing streaming with chunk handling...");
    await service.streamSpeech(text, voiceId, 2048, (chunk) => {
      console.log("Received chunk of size:", chunk.length);
    });

    // Test WebSocket streaming
    console.log("Testing WebSocket streaming...");
    await service.startWebSocketStream(
      voiceId,
      (audio) => console.log("Received audio chunk:", audio.length),
      (error) => console.error("WebSocket error:", error)
    );
    await service.sendTextToWebSocket(text);

    // Test voice cloning
    console.log("Testing voice cloning...");
    const audioFile = new File(["test"], "test.mp3", { type: "audio/mpeg" });
    const clonedVoice = await service.cloneVoiceFromAudio(
      "Test Voice",
      [audioFile],
      "A test voice"
    );
    console.log("Cloned voice:", clonedVoice);

    // Test speech-to-text
    console.log("Testing speech-to-text...");
    const transcription = await service.transcribeAudio(audioFile);
    console.log("Transcription:", transcription);

    // Test realtime transcription
    console.log("Testing realtime transcription...");
    await service.startRealtimeTranscription(
      (text) => console.log("Transcribed:", text),
      (error) => console.error("Transcription error:", error)
    );

    // Test voice design
    console.log("Testing voice design...");
    const designedVoice = await service.designVoice(
      "Designed Voice",
      {
        stability: 0.7,
        similarity_boost: 0.8,
        style: 0.6,
      },
      "professional"
    );
    console.log("Designed voice:", designedVoice);

    // Test voice style mixing
    console.log("Testing voice style mixing...");
    const mixedVoice = await service.mixVoiceStyles(voiceId, {
      professional: 0.7,
      casual: 0.3,
    });
    console.log("Mixed voice:", mixedVoice);

    // Test batch processing
    console.log("Testing batch processing...");
    const batchJob = await service.batchTextToSpeech(
      ["Text 1", "Text 2", "Text 3"],
      voiceId
    );
    console.log("Batch job:", batchJob);

    // Test voice library management
    console.log("Testing voice library management...");
    await service.shareVoice(voiceId, "user123");
    await service.archiveVoice(voiceId);
    await service.unarchiveVoice(voiceId);

    // Test caching
    console.log("Testing caching...");
    await service.cacheAudio(text, audioBuffer);
    const cachedAudio = await service.getCachedAudio(text);
    console.log(
      "Cached audio retrieved:",
      cachedAudio ? "Success" : "Not found"
    );

    // Test usage stats
    console.log("Fetching usage stats...");
    const usageStats = await service.getUsageStats();
    console.log("Usage stats:", usageStats);
  } catch (error) {
    console.error("Error testing ElevenLabs service:", error);
  }
}

testElevenLabsService();
