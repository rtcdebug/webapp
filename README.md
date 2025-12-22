# RTCDebug Website

The official website and tools for RTCDebug — a platform for diagnosing WebRTC call quality issues.

## Structure

```
rtcdebug/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx    # Marketing landing page
│   │   └── VisualizerPage.jsx # WebRTC dump analyzer tool
│   ├── components/            # Shared React components
│   └── utils/                 # Parser utilities
├── public/                    # Static assets
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── LICENSE
```

## Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173/` with:
- `/` — Landing page
- `/visualizer` — WebRTC dump visualizer tool

## Build

```bash
npm run build
```

Output is in `dist/`.

## Features

### Landing Page
- Product overview and value proposition
- Pricing tiers
- Waitlist signup
- Responsive design with animations

### WebRTC Dump Visualizer
A free tool to analyze `chrome://webrtc-internals` dumps:

- **Multi-peer connection support** — Handle dumps with multiple RTCPeerConnections
- **Connection timeline** — Visualize ICE states, signaling states, and events
- **ICE candidates table** — View local/remote candidates with selected pair highlighted
- **Codec info** — See negotiated audio/video codecs
- **Media stats charts** — Bitrate, packet loss, jitter, frame rate over time
- **Quality limitation tracking** — CPU, bandwidth, and other quality issues
- **Raw data explorer** — Browse the full JSON dump

## Tech Stack

- React 18
- React Router
- Vite
- Recharts (for charts)
- react-helmet-async (for SEO)

## License

MIT License — see [LICENSE](./LICENSE)
