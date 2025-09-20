import express from 'express';
import getTranscript from './transcript.js';
import morgan from 'morgan';
import { errorHandler, AppError } from './errorHandler.js';
import { validateApiKey } from './securityHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/;

app.use(morgan('dev'));
app.get('/transcript/:videoId', validateApiKey, async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new AppError('Video ID is required', 'validation', 400);
  }

  if (!videoIdRegex.test(videoId)) {
    throw new AppError('Invalid video ID format', 'validation', 400);
  }

  const { transcript, views } = await getTranscript(videoId);

  res.status(200).json({
    transcript,
    views,
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
