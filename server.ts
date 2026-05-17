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
app.get("/api/status", (req, res) => {
  const hasKey = !!process.env.GROQ_API_KEY;
  res.json({ 
    status: "online", 
    configured: hasKey,
    environment: process.env.NODE_ENV,
    limit: "512MB (Server) / 25MB (Groq API)"
  });
});

app.post("/api/transcribe", (req, res, next) => {
  upload.single("audio")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
          error: "Payload Too Large", 
          details: "The audio file exceeds the 512MB limit configured on this server. Note that Vercel free tier deployment limits uploads to ~4.5MB." 
        });
      }
      return res.status(400).json({ error: "Upload Error", details: err.message });
    } else if (err) {
      return res.status(500).json({ error: "System Error", details: "An internal error occurred during the file upload process." });
    }
    next();
  });
}, async (req: any, res: any) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Missing Data", details: "No audio file was received by the server." });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.error("GROQ_API_KEY is not defined in environment variables.");
      return res.status(500).json({ 
        error: "Configuration Missing", 
        details: "The GROQ_API_KEY is not set on the server. If this is a Vercel deployment, please add it to your Project Settings -> Environment Variables." 
      });
    }

    // Check for Groq's 25MB API limit
    if (file.size > 25 * 1024 * 1024) {
      return res.status(400).json({ 
        error: "API Provider Limit", 
        details: `The uploaded file (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds Groq's Whisper API limit of 25MB. Please use a smaller file or compress your audio.` 
      });
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
      return res.status(422).json({ error: "Processing Failure", details: "Groq processed the file but could not identify any speech content." });
    }

    res.json({ srt: srtContent, transcription: data.text });
  } catch (error: any) {
    const statusCode = error.response?.status || 500;
    let errorMsg = error.message;
    let errorDetails = "The transcription service encountered an error.";

    if (error.response?.data) {
      // Catch Groq specific API errors
      if (typeof error.response.data === 'object') {
        errorMsg = error.response.data.error?.message || error.response.data.message || error.message;
        errorDetails = `API Provider Error: ${errorMsg}`;
      } else {
        errorDetails = `Raw API Response: ${String(error.response.data).substring(0, 100)}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMsg = "Request Timeout";
      errorDetails = "The connection to the Groq API timed out. This could be due to a large file or network congestion.";
    }

    console.error(`[Server Error] Status ${statusCode}: ${errorMsg}`);
    
    res.status(statusCode).json({ 
      error: errorMsg, 
      details: errorDetails,
      code: error.code || 'CLOUD_EXECUTION_ERROR'
    });
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
