import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from ml.generate_dataset import ensure_dataset
from ml.preprocess import TrafficPreprocessor

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "traffic_model.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")
DATASET_PATH = os.path.join(BASE_DIR, "data", "bangalore_traffic.csv")


def volume_to_category(volume):
    if volume <= 2000:
        return "Low"
    if volume <= 5000:
        return "Medium"
    return "Heavy"


def train_and_save(force=False):
    os.makedirs(MODEL_DIR, exist_ok=True)

    if os.path.exists(MODEL_PATH) and not force:
        return load_model_bundle()

    ensure_dataset()
    df = pd.read_csv(DATASET_PATH)

    preprocessor = TrafficPreprocessor()
    df_clean = preprocessor.fit(df)
    X = preprocessor.transform(df)
    y = df_clean["Traffic Volume"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = float(r2_score(y_test, y_pred))

    metrics = {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2_score": round(r2, 4),
        "training_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "total_records": int(len(df_clean)),
        "routes_covered": int(
            df_clean[["Source Location", "Destination Location"]]
            .drop_duplicates()
            .shape[0]
        ),
        "locations": preprocessor.locations,
    }

    bundle = {
        "model": model,
        "preprocessor": preprocessor,
        "metrics": metrics,
    }

    joblib.dump(bundle, MODEL_PATH)
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    return bundle


def load_model_bundle():
    if not os.path.exists(MODEL_PATH):
        return train_and_save()
    return joblib.load(MODEL_PATH)


if __name__ == "__main__":
    bundle = train_and_save(force=True)
    print("Model trained successfully")
    print(json.dumps(bundle["metrics"], indent=2))
