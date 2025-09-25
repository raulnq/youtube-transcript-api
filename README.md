# YouTube Transcript API

A REST API for fetching YouTube video transcripts using Playwright and Express.js. This service extracts transcripts and view counts from YouTube videos through web scraping.

## Features

- 🎥 Extract transcripts from YouTube videos
- 📊 Retrieve video view counts
- 🔑 Optional API key authentication
- 🛡️ Robust error handling with RFC 7807 Problem Details
- 🎭 Uses Playwright for reliable web scraping
- 🚀 Express.js REST API
- 📝 Comprehensive logging with Morgan
- ❤️ Health check endpoint for monitoring
- 🔧 Configurable selectors via environment variablesscript API

## API Endpoints

### Health Check

```http
GET /live
```

**Description:**
Health check endpoint that returns the current status of the service.

**Response:**

```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": 1695123456789
}
```

### Get Transcript

```http
GET /transcript/:videoId
```

**Headers (Optional):**

- `X-API-Key: your-api-key`

**Parameters:**

- `videoId` (required): The YouTube video ID (11 characters, alphanumeric with hyphens and underscores)

**Validation:**
The API automatically validates:

- Video ID format (must be exactly 11 characters)
- Video existence and availability
- Video accessibility (detects private, deleted, or region-blocked videos)

**Response:**

```json
{
  "transcript": "Full transcript text...",
  "views": 1234567
}
```

**Error Response:**

```json
{
  "type": "/problems/validation",
  "title": "validation",
  "status": 400,
  "detail": "Invalid video ID format",
  "instance": "/transcript/invalid-id"
}
```

**Video Not Found Error:**

```json
{
  "type": "/problems/not_found",
  "title": "not_found",
  "status": 404,
  "detail": "Video not found or unavailable",
  "instance": "/transcript/dQw4w9WgXcQ"
}
```

**Authentication Error:**

```json
{
  "type": "/problems/authentication",
  "title": "authentication",
  "status": 401,
  "detail": "API key is required",
  "instance": "/transcript/dQw4w9WgXcQ"
}
```

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/raulnq/youtube-transcript-api.git
   cd youtube-transcript-api
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Install Playwright browsers:**

   ```bash
   npm run install-browsers
   ```

4. **Create environment file (optional):**

   ```bash
   cp .env.example .env
   ```

5. **Start the server:**

   ```bash
   npm start
   ```

   For development with auto-reload:

   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000` by default.

## Usage Examples

### Using curl

```bash
# Health check
curl http://localhost:5000/live

# Get transcript for a YouTube video (no API key required if not set)
curl http://localhost:5000/transcript/dQw4w9WgXcQ

# With API key using X-API-Key header
curl -H "X-API-Key: your-secret-api-key" \
     http://localhost:5000/transcript/dQw4w9WgXcQ

# Example response
{
  "transcript": "Never gonna give you up, never gonna let you down...",
  "views": 1400000000
}
```

### Using JavaScript (fetch)

```javascript
async function getTranscript(videoId, apiKey = null) {
  try {
    const headers = {};

    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(
      `http://localhost:5000/transcript/${videoId}`,
      {
        headers,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch transcript');
    }

    return data;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}

// Usage without API key
getTranscript('dQw4w9WgXcQ')
  .then(data => console.log(data))
  .catch(error => console.error(error));

// Usage with API key
getTranscript('dQw4w9WgXcQ', 'your-secret-api-key')
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### Using Python (requests)

```python
import requests

def get_transcript(video_id, api_key=None):
    url = f"http://localhost:5000/transcript/{video_id}"
    headers = {}

    if api_key:
        headers['X-API-Key'] = api_key

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as error:
        print(f"Error fetching transcript: {error}")
        raise

# Usage without API key
transcript_data = get_transcript("dQw4w9WgXcQ")
print(transcript_data)

# Usage with API key
transcript_data = get_transcript("dQw4w9WgXcQ", "your-secret-api-key")
print(transcript_data)
```

## Environment Variables

You can customize the behavior using environment variables:

| Variable                      | Description                                    | Default                                                           |
| ----------------------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| `PORT`                        | Server port                                    | `5000`                                                            |
| `API_KEY`                     | Required API key for authentication (optional) | Not set (authentication disabled)                                 |
| `USER_AGENT`                  | Browser user agent                             | Chrome user agent string                                          |
| `EXPAND_SELECTOR`             | CSS selector for expand button                 | `tp-yt-paper-button#expand`                                       |
| `NOT_FOUND_SELECTOR`          | CSS selector for video not found errors        | `div.promo-title:has-text("This video isn\'t available anymore")` |
| `SHOW_TRANSCRIPT_SELECTOR`    | CSS selector for transcript button             | `button[aria-label="Show transcript"]`                            |
| `VIEW_COUNT_SELECTOR`         | CSS selector for view count                    | `yt-formatted-string#info span`                                   |
| `TRANSCRIPT_SEGMENT_SELECTOR` | CSS selector for transcript segments           | `ytd-transcript-segment-renderer`                                 |
| `TRANSCRIPT_SELECTOR`         | CSS selector for transcript container          | `ytd-transcript-renderer`                                         |
| `TRANSCRIPT_TEXT_SELECTOR`    | CSS selector for transcript text               | `.segment-text`                                                   |

### Setting up API Key Authentication

To enable API key authentication, set the `API_KEY` environment variable:

```bash
# Using .env file
echo "API_KEY=your-secret-api-key-here" >> .env

# Or export directly (Linux/Mac)
export API_KEY=your-secret-api-key-here

# Or set in PowerShell (Windows)
$env:API_KEY="your-secret-api-key-here"
```

**Note:** If `API_KEY` is not set, the API will work without authentication. Set it only when you want to protect your API.

## Monitoring and Health Checks

The API includes a built-in health check endpoint at `/live` that provides:

- **Service Status**: Confirms the service is responding
- **Uptime**: Shows how long the server has been running (in seconds)
- **Timestamp**: Current server timestamp

This endpoint is useful for:

- **Container Orchestration**: Docker Swarm, Kubernetes health checks
- **Load Balancers**: Health-based traffic routing
- **Monitoring Systems**: Service availability alerts
- **DevOps Pipelines**: Deployment verification

**Example Health Check Response:**

```json
{
  "status": "healthy",
  "uptime": 3600.45,
  "timestamp": 1695123456789
}
```

## Development

### Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run lint:format` - Run linting and formatting together
- `npm run commit` - Interactive commit with conventional commits
- `npm run install-browsers` - Install Playwright browsers

### Code Quality

This project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for Git hooks
- **Commitlint** for conventional commits

### Project Structure

```
youtube-transcript-api/
├── server.js              # Main Express server
├── transcript.js          # Transcript extraction logic
├── errorHandler.js        # Error handling utilities
├── package.json           # Project dependencies
├── eslint.config.js       # ESLint configuration
├── commitlint.config.js   # Commitlint configuration
└── README.md              # This file
```

## Error Handling

The API uses RFC 7807 Problem Details for HTTP APIs for consistent error responses:

| Status Code | Type                    | Description                    |
| ----------- | ----------------------- | ------------------------------ |
| 400         | `validation`            | Invalid or missing video ID    |
| 401         | `authentication`        | Missing or invalid API key     |
| 404         | `not_found`             | Video not found or unavailable |
| 500         | `internal-server-error` | Server or scraping error       |

## Limitations

- **Rate Limiting**: YouTube may rate limit requests if too many are made quickly
- **Selector Changes**: YouTube may change their HTML structure, breaking selectors
- **Geographic Restrictions**: Some videos may not be available in all regions
- **Private Videos**: Cannot access transcripts for private or restricted videos
- **No Transcript**: Not all videos have transcripts available

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`npm run commit`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This tool is for educational and research purposes only. Please respect YouTube's Terms of Service and use responsibly. The authors are not responsible for any misuse of this software.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/raulnq/youtube-transcript-api/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about the error and steps to reproduce

---

**Note**: This project relies on web scraping YouTube's interface. YouTube may change their HTML structure at any time, which could break the functionality. Keep the project updated and monitor for any changes.
