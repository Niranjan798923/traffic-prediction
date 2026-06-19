import os
import sys
import threading
from collections import Counter

import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from ml.generate_dataset import ensure_dataset, load_locations
from ml.predict import make_prediction
from ml.preprocess import TrafficPreprocessor
from ml.train_model import load_model_bundle, train_and_save

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

DATASET_PATH = os.path.join(BASE_DIR, "data", "bangalore_traffic.csv")
prediction_history = []
history_lock = threading.Lock()
MAX_HISTORY = 500


def get_dataframe():
    ensure_dataset()
    df = pd.read_csv(DATASET_PATH)
    preprocessor = TrafficPreprocessor()
    return preprocessor.clean_dataframe(df)


def ensure_model():
    return load_model_bundle()

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Smart Bangalore Traffic Prediction API Running",
        "status": "success",
        "endpoints": [
            "/health",
            "/locations",
            "/statistics",
            "/predict",
            "/traffic-by-hour",
            "/traffic-by-day",
            "/congestion-by-area",
            "/visualization-data",
            "/prediction-history"
        ]
    })



@app.route("/health", methods=["GET"])
def health():
    model_exists = os.path.exists(
        os.path.join(BASE_DIR, "models", "traffic_model.pkl")
    )
    return jsonify({
        "status": "healthy",
        "service": "Smart Bangalore Traffic Prediction API",
        "model_loaded": model_exists,
    })


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}

    source = str(data.get("source", "")).strip()
    destination = str(data.get("destination", "")).strip()
    date = str(data.get("date", "")).strip()
    time_str = str(data.get("time", "12:00")).strip()
    holiday = str(data.get("holiday", "No")).strip()

    if not source or not destination:
        return jsonify({"error": "Source and destination are required"}), 400

    if not date:
        return jsonify({"error": "Date is required"}), 400

    try:
        result = make_prediction(source, destination, date, time_str, holiday)
        with history_lock:
            prediction_history.insert(0, {
                "source": source,
                "destination": destination,
                "traffic_volume": result["traffic_volume"],
                "traffic_category": result["traffic_category"],
                "timestamp": pd.Timestamp.now().isoformat(),
            })
            if len(prediction_history) > MAX_HISTORY:
                prediction_history.pop()
        return jsonify(result)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/statistics", methods=["GET"])
def statistics():
    try:
        bundle = ensure_model()
        metrics = bundle["metrics"]
        df = get_dataframe()

        with history_lock:
            hist_count = len(prediction_history)

        return jsonify({
            "dataset_records": int(len(df)),
            "model_accuracy": metrics.get("r2_score", 0),
            "mae": metrics.get("mae", 0),
            "rmse": metrics.get("rmse", 0),
            "routes_covered": metrics.get("routes_covered", 0),
            "historical_predictions": hist_count,
            "locations": metrics.get("locations", load_locations()),
            "peak_hours": get_peak_hours_data(df),
            "top_congested_areas": get_congestion_by_area_data(df)[:5],
            "traffic_distribution": get_traffic_distribution(df),
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/locations", methods=["GET"])
def locations():
    try:
        bundle = ensure_model()
        return jsonify({"locations": bundle["metrics"].get("locations", load_locations())})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


def get_peak_hours_data(df):
    hourly = df.groupby("hour")["Traffic Volume"].mean().reset_index()
    hourly.columns = ["hour", "avg_volume"]
    hourly["hour_label"] = hourly["hour"].apply(lambda h: f"{h:02d}:00")
    return hourly.sort_values("hour").to_dict(orient="records")


def get_traffic_by_day_data(df):
    day_order = [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday",
    ]
    daily = df.groupby("day_name")["Traffic Volume"].mean().reset_index()
    daily.columns = ["day", "avg_volume"]
    daily["day"] = pd.Categorical(daily["day"], categories=day_order, ordered=True)
    daily = daily.sort_values("day")
    return daily.to_dict(orient="records")


def get_congestion_by_area_data(df):
    source_agg = df.groupby("Source Location")["Traffic Volume"].mean()
    dest_agg = df.groupby("Destination Location")["Traffic Volume"].mean()
    combined = pd.concat([source_agg, dest_agg]).groupby(level=0).mean()
    combined = combined.sort_values(ascending=False).reset_index()
    combined.columns = ["area", "avg_volume"]
    return combined.to_dict(orient="records")


def get_traffic_distribution(df):
    bins = [0, 2000, 5000, 10000]
    labels = ["Low", "Medium", "Heavy"]
    df_copy = df.copy()
    df_copy["category"] = pd.cut(
        df_copy["Traffic Volume"], bins=bins, labels=labels, include_lowest=True
    )
    counts = df_copy["category"].value_counts().reindex(labels, fill_value=0)
    return [{"category": k, "count": int(v)} for k, v in counts.items()]


def get_histogram_data(df):
    volumes = df["Traffic Volume"].values
    hist, bin_edges = pd.cut(volumes, bins=20, retbins=True)
    counts = hist.value_counts().sort_index()
    result = []
    for interval, count in counts.items():
        result.append({
            "range": f"{int(interval.left)}-{int(interval.right)}",
            "count": int(count),
            "midpoint": int((interval.left + interval.right) / 2),
        })
    return result


def get_route_popularity(df):
    routes = df.apply(
        lambda r: f"{r['Source Location']} → {r['Destination Location']}", axis=1
    )
    top_routes = Counter(routes).most_common(8)
    return [{"route": r, "count": c} for r, c in top_routes]


def get_heatmap_data(df):
    locations = sorted(
        set(df["Source Location"].unique()) | set(df["Destination Location"].unique())
    )[:12]
    heatmap = []
    for src in locations:
        for dst in locations:
            subset = df[
                (df["Source Location"] == src) &
                (df["Destination Location"] == dst)
            ]
            avg_vol = float(subset["Traffic Volume"].mean()) if len(subset) > 0 else 0
            heatmap.append({
                "source": src,
                "destination": dst,
                "volume": round(avg_vol, 0),
            })
    return heatmap


@app.route("/traffic-by-hour", methods=["GET"])
def traffic_by_hour():
    try:
        df = get_dataframe()
        return jsonify(get_peak_hours_data(df))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/traffic-by-day", methods=["GET"])
def traffic_by_day():
    try:
        df = get_dataframe()
        return jsonify(get_traffic_by_day_data(df))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/congestion-by-area", methods=["GET"])
def congestion_by_area():
    try:
        df = get_dataframe()
        return jsonify(get_congestion_by_area_data(df))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/visualization-data", methods=["GET"])
def visualization_data():
    try:
        df = get_dataframe()
        return jsonify({
            "traffic_by_hour": get_peak_hours_data(df),
            "traffic_by_day": get_traffic_by_day_data(df),
            "congestion_by_area": get_congestion_by_area_data(df),
            "histogram": get_histogram_data(df),
            "route_popularity": get_route_popularity(df),
            "heatmap": get_heatmap_data(df),
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/prediction-history", methods=["GET"])
def get_prediction_history():
    with history_lock:
        return jsonify(prediction_history[:20])


def initialize_app():
    print("Initializing Smart Bangalore Traffic Prediction System...")
    ensure_dataset()
    print("Training/loading model...")
    train_and_save()
    print("Server ready!")


initialize_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
