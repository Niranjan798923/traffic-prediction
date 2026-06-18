import json
import os
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
LOCATIONS_FILE = os.path.join(DATA_DIR, "locations.json")
DATASET_PATH = os.path.join(DATA_DIR, "bangalore_traffic.csv")

KARNATAKA_HOLIDAYS_2024 = {
    "2024-01-26", "2024-03-08", "2024-03-25", "2024-03-29", "2024-04-14",
    "2024-04-17", "2024-05-01", "2024-08-15", "2024-08-26", "2024-10-02",
    "2024-10-12", "2024-11-01", "2024-11-15", "2024-12-25",
    "2025-01-26", "2025-03-08", "2025-03-14", "2025-04-14", "2025-04-18",
    "2025-05-01", "2025-08-15", "2025-08-26", "2025-10-02", "2025-10-21",
    "2025-11-01", "2025-12-25",
}

CONGESTION_HOTSPOTS = {
    "Silk Board": 1.35,
    "Marathahalli": 1.28,
    "Electronic City": 1.25,
    "Whitefield": 1.22,
    "Hebbal": 1.18,
    "Outer Ring Road": 1.30,
    "Bellandur": 1.26,
    "Hosur Road": 1.20,
    "Bannerghatta Road": 1.15,
    "Old Airport Road": 1.17,
}

HOUR_MULTIPLIERS = {
    0: 0.15, 1: 0.10, 2: 0.08, 3: 0.08, 4: 0.12, 5: 0.35,
    6: 0.65, 7: 1.15, 8: 1.45, 9: 1.20, 10: 0.95, 11: 1.05,
    12: 1.15, 13: 1.10, 14: 1.00, 15: 1.05, 16: 1.15, 17: 1.35,
    18: 1.50, 19: 1.40, 20: 1.10, 21: 0.85, 22: 0.55, 23: 0.30,
}

DAY_MULTIPLIERS = {
    "Monday": 1.10,
    "Tuesday": 1.05,
    "Wednesday": 1.05,
    "Thursday": 1.08,
    "Friday": 1.15,
    "Saturday": 0.85,
    "Sunday": 0.70,
}


def load_locations():
    with open(LOCATIONS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def compute_traffic_volume(source, destination, hour, day, month, is_holiday):
    base = 3200
    hour_factor = HOUR_MULTIPLIERS.get(hour, 1.0)
    day_factor = DAY_MULTIPLIERS.get(day, 1.0)
    month_factor = 1.0 + 0.05 * np.sin((month - 1) * np.pi / 6)

    source_factor = CONGESTION_HOTSPOTS.get(source, 1.0)
    dest_factor = CONGESTION_HOTSPOTS.get(destination, 1.0)
    route_factor = (source_factor + dest_factor) / 2

    if source == destination:
        route_factor *= 0.3

    holiday_factor = 0.55 if is_holiday else 1.0
    weekend_bonus = 0.75 if day in ("Saturday", "Sunday") and not is_holiday else 1.0

    volume = base * hour_factor * day_factor * month_factor * route_factor
    volume *= holiday_factor * weekend_bonus

    if day in ("Monday", "Friday") and hour in (8, 9, 18, 19):
        volume *= 1.12

    noise = random.gauss(0, volume * 0.08)
    volume = max(150, min(9500, volume + noise))
    return int(round(volume))


def generate_dataset(num_records=15000, seed=42):
    random.seed(seed)
    np.random.seed(seed)
    locations = load_locations()
    records = []
    start_date = datetime(2024, 1, 1)

    for _ in range(num_records):
        source = random.choice(locations)
        destination = random.choice(locations)
        days_offset = random.randint(0, 540)
        date_obj = start_date + timedelta(days=days_offset)
        hour = random.choices(
            range(24),
            weights=[HOUR_MULTIPLIERS[h] for h in range(24)],
            k=1,
        )[0]
        minute = random.choice([0, 15, 30, 45])
        time_str = f"{hour:02d}:{minute:02d}"
        day_of_week = date_obj.strftime("%A")
        month = date_obj.month
        date_str = date_obj.strftime("%Y-%m-%d")
        is_holiday = date_str in KARNATAKA_HOLIDAYS_2024 or day_of_week == "Sunday"

        volume = compute_traffic_volume(
            source, destination, hour, day_of_week, month, is_holiday
        )

        records.append({
            "Source Location": source,
            "Destination Location": destination,
            "Date": date_str,
            "Time": time_str,
            "Day of Week": day_of_week,
            "Month": month,
            "Holiday Status": "Yes" if is_holiday else "No",
            "Traffic Volume": volume,
        })

    df = pd.DataFrame(records)
    df = df.drop_duplicates()
    return df


def ensure_dataset():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATASET_PATH):
        df = generate_dataset()
        df.to_csv(DATASET_PATH, index=False)
    return DATASET_PATH


if __name__ == "__main__":
    path = ensure_dataset()
    df = pd.read_csv(path)
    print(f"Dataset saved to {path} with {len(df)} records")
