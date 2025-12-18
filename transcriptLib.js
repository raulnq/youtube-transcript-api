import { YoutubeTranscript } from './lib.js';

export default async function getTranscript(videoId) {
  const data = await YoutubeTranscript.fetchTranscript(videoId);
  return { transcript: data.map(item => item.text).join(' '), views: 0 };
}
