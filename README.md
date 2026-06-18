# Smart Bangalore Traffic Prediction System

AI-powered traffic congestion prediction platform for Bangalore city. Built with React, Flask, and Scikit-Learn Random Forest.

## Features

- **ML-Powered Predictions** — Random Forest model trained on 15,000+ traffic records
- **Real-Time Dashboard** — Live statistics, peak hours, and congestion analytics
- **Interactive Visualizations** — 6 chart types including heatmaps and route popularity
- **30+ Bangalore Locations** — Major corridors, tech hubs, and commercial areas
- **Auto-Retraining** — Model trains automatically if `traffic_model.pkl` is missing

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Axios |
| Backend | Python Flask, Flask-CORS |
| ML | Scikit-Learn RandomForestRegressor, Pandas, NumPy, Joblib |
| Deployment | Netlify (Frontend), Render (Backend) |

## Project Structure

```
Traffic Prediction/
├── backend/
│   ├── app.py                  # Flask API server
│   ├── data/
│   │   ├── bangalore_traffic.csv   # Generated dataset
│   │   └── locations.json          # Bangalore locations
│   ├── ml/
│   │   ├── generate_dataset.py     # Dataset generator
│   │   ├── preprocess.py           # Feature engineering
│   │   ├── train_model.py          # Model training
│   │   └── predict.py              # Prediction logic
│   └── models/
│       └── traffic_model.pkl       # Trained model (auto-generated)
├── frontend/
│   ├── src/
│   │   ├── pages/                  # Home, Prediction, Visualization
│   │   ├── components/             # UI components
│   │   └── api/client.js           # API client
│   ├── netlify.toml
│   └── package.json
├── render.yaml
├── requirements.txt
└── README.md
```

## Quick Start (Local Development)

### Prerequisites

- Python 3.11+
- Node.js 20+
- npm

### 1. Backend Setup

```bash
cd backend
pip install -r ../requirements.txt
python -m ml.train_model
python app.py
```

Backend runs at `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

The Vite dev server proxies `/api/*` requests to the Flask backend.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/predict` | Predict traffic volume |
| GET | `/statistics` | Dashboard statistics |
| GET | `/traffic-by-hour` | Hourly traffic data |
| GET | `/traffic-by-day` | Daily traffic data |
| GET | `/congestion-by-area` | Area congestion data |
| GET | `/visualization-data` | All chart data |
| GET | `/locations` | Available locations |

### Prediction Request

```json
POST /predict
{
  "source": "Koramangala",
  "destination": "Whitefield",
  "date": "2025-06-13",
  "time": "08:30",
  "holiday": "No"
}
```

### Prediction Response

```json
{
  "traffic_volume": 6750,
  "traffic_category": "Heavy",
  "congestion_score": 71.1,
  "estimated_travel_time": 42,
  "prediction_confidence": 87.5
}
```

## Traffic Categories

| Volume Range | Category |
|-------------|----------|
| 0 – 2,000 | Low |
| 2,001 – 5,000 | Medium |
| 5,001+ | Heavy |

## ML Pipeline

1. **Dataset Generation** — 15,000 realistic Bangalore traffic records
2. **Preprocessing** — Missing values, duplicates, outliers, label encoding
3. **Feature Engineering** — Source, Destination, Hour, Day, Month, Holiday
4. **Training** — RandomForestRegressor (200 trees, max_depth=20)
5. **Evaluation** — MAE, RMSE, R² Score
6. **Persistence** — Model saved as `traffic_model.pkl`

## Deployment

### Backend → Render

1. Push code to GitHub
2. Connect repository to [Render](https://render.com)
3. Render auto-detects `render.yaml`
4. Deploy — model trains during build

### Frontend → Netlify

1. Connect repository to [Netlify](https://netlify.com)
2. Set build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
3. Set environment variable:
   - `VITE_API_URL` = `https://your-render-app.onrender.com`
4. Deploy

Update the API URL in `frontend/netlify.toml` redirects to match your Render backend URL.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL (frontend) | `/api` |
| `PORT` | Backend server port | `5000` |
| `FLASK_ENV` | Flask environment | `production` |

## License

MIT
