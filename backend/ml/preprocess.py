import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder


FEATURE_COLUMNS = [
    "source_encoded",
    "destination_encoded",
    "hour",
    "day_encoded",
    "month",
    "holiday",
]

DAY_ORDER = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday",
]


class TrafficPreprocessor:
    def __init__(self):
        self.source_encoder = LabelEncoder()
        self.destination_encoder = LabelEncoder()
        self.day_encoder = LabelEncoder()
        self.locations = []
        self.is_fitted = False

    def _normalize_columns(self, df):
        column_map = {
            "source location": "Source Location",
            "destination location": "Destination Location",
            "date": "Date",
            "time": "Time",
            "day of week": "Day of Week",
            "month": "Month",
            "holiday status": "Holiday Status",
            "traffic volume": "Traffic Volume",
            "source": "Source Location",
            "destination": "Destination Location",
            "holiday": "Holiday Status",
            "volume": "Traffic Volume",
            "traffic_volume": "Traffic Volume",
        }
        renamed = {}
        for col in df.columns:
            key = col.strip().lower()
            renamed[col] = column_map.get(key, col)
        df = df.rename(columns=renamed)
        return self._coalesce_duplicate_columns(df)

    def _coalesce_duplicate_columns(self, df):
        if df.columns.is_unique:
            return df
        merged = {}
        for col in df.columns.unique():
            subset = df.loc[:, df.columns == col]
            if subset.shape[1] == 1:
                merged[col] = subset.iloc[:, 0]
            else:
                merged[col] = subset.bfill(axis=1).iloc[:, 0]
        return pd.DataFrame(merged)

    def _parse_hour(self, time_val):
        if pd.isna(time_val):
            return 12
        time_str = str(time_val).strip()
        if ":" in time_str:
            parts = time_str.split(":")
            return int(parts[0]) % 24
        try:
            return int(float(time_str)) % 24
        except ValueError:
            return 12

    def _parse_holiday(self, val):
        if isinstance(val, pd.Series):
            val = val.iloc[0]
        if pd.isna(val):
            return 0
        val_str = str(val).strip().lower()
        if val_str in ("yes", "true", "1", "y", "holiday"):
            return 1
        return 0

    def _get_scalar(self, row, key, default=None):
        if key not in row.index:
            return default
        val = row[key]
        if isinstance(val, pd.Series):
            val = val.iloc[0]
        return val

    def _parse_month(self, row):
        month_val = self._get_scalar(row, "Month")
        if month_val is not None and pd.notna(month_val):
            try:
                month = int(month_val)
                if 1 <= month <= 12:
                    return month
            except (ValueError, TypeError):
                pass
        date_val = self._get_scalar(row, "Date")
        if date_val is not None and pd.notna(date_val):
            try:
                return pd.to_datetime(date_val).month
            except Exception:
                pass
        return 6

    def _parse_day(self, row):
        day_val = self._get_scalar(row, "Day of Week")
        if day_val is not None and pd.notna(day_val):
            return str(day_val).strip()
        date_val = self._get_scalar(row, "Date")
        if date_val is not None and pd.notna(date_val):
            try:
                return pd.to_datetime(date_val).strftime("%A")
            except Exception:
                pass
        return "Monday"

    def clean_dataframe(self, df):
        df = self._normalize_columns(df.copy())
        for col in ["hour", "day_name", "month", "holiday"]:
            if col in df.columns:
                df = df.drop(columns=[col])
        df = df.drop_duplicates()

        required = ["Source Location", "Destination Location"]
        for col in required:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")

        df["Source Location"] = df["Source Location"].astype(str).str.strip()
        df["Destination Location"] = df["Destination Location"].astype(str).str.strip()
        df = df[
            (df["Source Location"] != "") &
            (df["Destination Location"] != "") &
            (df["Source Location"].str.lower() != "nan") &
            (df["Destination Location"].str.lower() != "nan")
        ]

        if "Traffic Volume" in df.columns:
            df["Traffic Volume"] = pd.to_numeric(df["Traffic Volume"], errors="coerce")
            df = df.dropna(subset=["Traffic Volume"])
            q1 = df["Traffic Volume"].quantile(0.01)
            q99 = df["Traffic Volume"].quantile(0.99)
            df["Traffic Volume"] = df["Traffic Volume"].clip(q1, q99)

        df["hour"] = df["Time"].apply(self._parse_hour) if "Time" in df.columns else 12
        df["day_name"] = df.apply(self._parse_day, axis=1)
        df["month"] = df.apply(self._parse_month, axis=1)
        df["holiday"] = (
            df["Holiday Status"].apply(self._parse_holiday)
            if "Holiday Status" in df.columns
            else 0
        )

        for col in ["Source Location", "Destination Location", "day_name"]:
            df[col] = df[col].fillna("Unknown")

        return df.reset_index(drop=True)

    def fit(self, df):
        df = self.clean_dataframe(df)
        sources = df["Source Location"].unique().tolist()
        destinations = df["Destination Location"].unique().tolist()
        self.locations = sorted(set(sources + destinations))

        self.source_encoder.fit(self.locations)
        self.destination_encoder.fit(self.locations)

        days_present = df["day_name"].unique().tolist()
        day_labels = [d for d in DAY_ORDER if d in days_present]
        day_labels += [d for d in days_present if d not in day_labels]
        self.day_encoder.fit(day_labels)
        self.is_fitted = True
        return df

    def transform(self, df):
        if not self.is_fitted:
            raise RuntimeError("Preprocessor must be fitted before transform")

        df = self.clean_dataframe(df)

        def safe_encode(encoder, values, fallback="Unknown"):
            encoded = []
            classes = set(encoder.classes_)
            for val in values:
                if val not in classes:
                    val = fallback if fallback in classes else encoder.classes_[0]
                encoded.append(encoder.transform([val])[0])
            return encoded

        df["source_encoded"] = safe_encode(
            self.source_encoder, df["Source Location"].tolist()
        )
        df["destination_encoded"] = safe_encode(
            self.destination_encoder, df["Destination Location"].tolist()
        )
        df["day_encoded"] = safe_encode(
            self.day_encoder, df["day_name"].tolist(), fallback="Monday"
        )

        return df[FEATURE_COLUMNS]

    def fit_transform(self, df):
        df = self.fit(df)
        return self.transform(df)

    def transform_single(self, source, destination, hour, day, month, holiday):
        if not self.is_fitted:
            raise RuntimeError("Preprocessor must be fitted before transform")

        def encode_single(encoder, value, fallback="Unknown"):
            classes = set(encoder.classes_)
            if value not in classes:
                value = fallback if fallback in classes else encoder.classes_[0]
            return encoder.transform([value])[0]

        day_val = day if day in set(self.day_encoder.classes_) else "Monday"
        holiday_val = 1 if str(holiday).lower() in ("yes", "true", "1", "y") else 0

        return np.array([[
            encode_single(self.source_encoder, source),
            encode_single(self.destination_encoder, destination),
            int(hour) % 24,
            encode_single(self.day_encoder, day_val, fallback="Monday"),
            int(month) if 1 <= int(month) <= 12 else 6,
            holiday_val,
        ]])
