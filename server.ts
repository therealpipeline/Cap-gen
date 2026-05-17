import express from "express";
import path from "path";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

const app = express();

// Use memory storage with a much higher limit as requested
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 512 * 1024 * 1024 } // 512MB limit
});

// API Routes
app.post("/api/transcribe", (req, res, next) => {
  upload.single("audio")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: "File too large. System is configured for 512MB, but please check your hosting provider (e.g. Vercel Free is 4.5MB)." });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: "An unknown error occurred during upload." });
    }
    next();
  });
}, async (req: any, res: any) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // Check for Groq's 25MB API limit
    if (file.size > 25 * 1024 * 1024) {
      return res.status(400).json({ 
        error: "Groq API Limit Exceeded", 
        details: "The audio file is " + (file.size / (1024 * 1024)).toFixed(2) + "MB. Groq's Whisper API has a hard limit of 25MB. Please compress the audio or split it into smaller parts." 
      });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.error("GROQ_API_KEY missing");
      return res.status(500).json({ error: "Server configuration error: GROQ_API_KEY is missing." });
    }

    const formData = new FormData();
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "word");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${groqKey}`,
        },
        timeout: 60000, 
      }
    );

    const data = response.data;
    let srtContent = "";
    const words = data.words || [];
    
    if (words.length > 0) {
      words.forEach((wordObj: any, index: number) => {
        srtContent += `${index + 1}\n`;
        srtContent += `${formatSrtTime(wordObj.start)} --> ${formatSrtTime(wordObj.end)}\n`;
        srtContent += `${wordObj.word.trim()}\n\n`;
      });
    } else if (data.segments) {
      data.segments.forEach((segment: any, index: number) => {
        srtContent += `${index + 1}\n`;
        srtContent += `${formatSrtTime(segment.start)} --> ${formatSrtTime(segment.end)}\n`;
        srtContent += `${segment.text.trim()}\n\n`;
      });
    } else {
      return res.status(422).json({ error: "Speech not detected." });
    }

    res.json({ srt: srtContent, transcription: data.text });
  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    const errorMsg = error.response?.data?.error?.message || error.message;
    res.status(statusCode).json({ error: "Transcription failed", details: errorMsg });
  }
});

function formatSrtTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

// Vite and Static serving logic
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dynamic import to avoid loading Vite in production
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  // Use a check to prevent app.listen during Vercel serverless execution
  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setupServer();

export default app;
