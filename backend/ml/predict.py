import pandas as pd

from ml.preprocess import FEATURE_COLUMNS
from ml.train_model import load_model_bundle, volume_to_category


def estimate_travel_time(source, destination, volume, hour):
    base_minutes = 25
    if source == destination:
        base_minutes = 5

    congestion_delay = (volume / 1000) * 2.5
    peak_hours = {7, 8, 9, 17, 18, 19, 20}
    peak_factor = 1.25 if hour in peak_hours else 1.0

    travel_time = base_minutes + congestion_delay * peak_factor
    return int(round(max(5, min(120, travel_time))))


def compute_confidence(model, features_df):
    if hasattr(model, "estimators_"):
        X = features_df.values
        preds = [tree.predict(X)[0] for tree in model.estimators_]
        std = float(max(preds) - min(preds))
        confidence = max(0.55, min(0.98, 1.0 - (std / 8000)))
        return round(confidence * 100, 1)
    return 85.0


def compute_congestion_score(volume):
    score = min(100, max(0, (volume / 9500) * 100))
    return round(score, 1)


def make_prediction(source, destination, date, time_str, holiday):
    bundle = load_model_bundle()
    model = bundle["model"]
    preprocessor = bundle["preprocessor"]

    hour = preprocessor._parse_hour(time_str)
    month = 6
    day = "Monday"

    if date:
        try:
            dt = pd.to_datetime(date)
            month = dt.month
            day = dt.strftime("%A")
        except Exception:
            pass

    features = preprocessor.transform_single(
        source, destination, hour, day, month, holiday
    )
    features_df = pd.DataFrame(features, columns=FEATURE_COLUMNS)
    volume = float(model.predict(features_df)[0])
    volume = max(100, round(volume))

    category = volume_to_category(volume)
    congestion_score = compute_congestion_score(volume)
    travel_time = estimate_travel_time(source, destination, volume, hour)
    confidence = compute_confidence(model, features_df)

    return {
        "traffic_volume": volume,
        "traffic_category": category,
        "congestion_score": congestion_score,
        "estimated_travel_time": travel_time,
        "prediction_confidence": confidence,
        "source": source,
        "destination": destination,
        "date": date,
        "time": time_str,
        "holiday": holiday,
    }
