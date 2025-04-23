import { WhisperService } from "../services/whisper-service";
import fs from "fs";
import path from "path";

async function testWhisper() {
  try {
    const service = new WhisperService();

    // Test basic transcription
    console.log("Testing basic transcription...");
    const audioFile = path.join(__dirname, "../../input/test-audio.mp3");
    const result = await service.transcribeAudio(audioFile, {
      model: "whisper-1",
      language: "en",
      response_format: "json",
      temperature: 0.2,
    });
    console.log("Transcription result:", result);

    // Save transcription to file
    const outputPath = path.join(__dirname, "../../output/transcription.json");
    await service.saveTranscriptionToFile(result, outputPath);
    console.log("Transcription saved to:", outputPath);

    // Test batch transcription
    console.log("\nTesting batch transcription...");
    const audioFiles = [
      path.join(__dirname, "../../input/audio1.mp3"),
      path.join(__dirname, "../../input/audio2.mp3"),
    ];
    const batchResults = await service.batchTranscribe(audioFiles, {
      model: "whisper-1",
      language: "en",
    });
    console.log("Batch transcription results:", batchResults);

    // Test caching
    console.log("\nTesting caching...");
    const audioBuffer = fs.readFileSync(audioFile);
    const audioHash = service["generateAudioHash"](audioBuffer);
    await service.cacheTranscription(audioHash, result);
    const cachedResult = await service.getCachedTranscription(audioHash);
    console.log("Cached transcription:", cachedResult);

    // Test real-time transcription
    console.log("\nTesting real-time transcription...");
    const audioStream = fs.createReadStream(audioFile);
    await service.startRealtimeTranscription(
      audioStream as unknown as ReadableStream,
      (text) => console.log("Transcribed:", text),
      (error) => console.error("Transcription error:", error)
    );

    // Test transcription stats
    console.log("\nTesting transcription stats...");
    const stats = await service.getTranscriptionStats();
    console.log("Transcription stats:", stats);
  } catch (error) {
    console.error("Error testing Whisper:", error);
  }
}

testWhisper();
