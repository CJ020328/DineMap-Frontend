# DineMap Frontend

A simple React + Leaflet interface to visualize Subway outlets (or any other locations) on a map. Connects to the DineMap API (FastAPI backend) for data and AI-driven queries.

## Features
- Displays outlets as markers on an interactive Leaflet map
- Optional 5KM coverage circles around selected stores
- Integrates a chatbox UI to query the API (e.g., "Which stores close before 9pm?")
- Toggles for showing/hiding 5KM radius and clearing all selections
- Responsive design that works on both desktop and mobile devices

## Tech Stack
- **React**: UI library for building the interface
- **Vite**: Fast build tool and development server
- **Leaflet**: Interactive maps library
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React Query**: Data fetching and state management

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm or yarn

### Installation
1. Clone this repository (or copy into your existing project):
   ```bash
   git clone <repository-url>
   cd dinemap-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the backend API endpoint inside `src/config.js`:
   ```js
   // src/config.js
   export const config = {
     API_URL: "http://localhost:8000"  // or your deployed API base
   };
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   
The frontend is typically available at http://127.0.0.1:5173 (or whichever port Vite chooses).

## Project Structure
```
frontend/
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API services
│   ├── config.js      # Configuration file
│   ├── App.jsx        # Main app component
│   └── main.jsx       # Entry point
├── .env               # Environment variables (gitignored)
└── package.json       # Dependencies and scripts
```

## Deployment
This application can be easily deployed to Vercel, Netlify, or any static hosting service. For production deployment, make sure to:

1. Configure the correct API_URL in the config.js or use environment variables
2. Build the application using `npm run build`
3. Deploy the resulting `dist` directory to your hosting service

## Notes
- Leaflet is used for mapping; markers and circles are rendered dynamically based on the outlets fetched from the API
- Tailwind CSS helps style the UI quickly; see tailwind.config.js or postcss.config.js if you need to adjust styles
- ChatUI connects to the POST /chatbot/query endpoint in the backend, returning search results and highlighting them on the map

## Example Usage
1. Launch the DineMap API (backend) on port 8000
2. Set API_URL in config.js to point to http://localhost:8000
3. Run `npm run dev` to start the frontend
4. Open your browser at http://localhost:5173 (or displayed port) to explore the map UI and chatbot
5. Try asking the chatbot questions like "Which stores are open on Sundays?" or "Find me outlets near downtown"

## License
This frontend is part of the DineMap (Mindhive Assessment) project. If you reuse or modify it, please credit the original source or comply with any license terms.