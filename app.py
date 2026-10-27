
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import json
import pandas as pd
from pathlib import Path

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "network_model.joblib"
INFO_PATH = BASE_DIR / "model_info.json"

# Load the saved trained model
model = joblib.load(MODEL_PATH)

with open(INFO_PATH, "r", encoding="utf-8") as file:
    model_info = json.load(file)


@app.route("/", methods=["GET"])
def home():
    
    return render_template("index.html")
    


@app.route("/api/info", methods=["GET"])
def info():
    return jsonify(model_info)


@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Please provide valid JSON input."}), 400

    required_fields = [
        "SNR",
        "Attenuation",
        "Distance to Tower (km)",
        "Call Duration (s)",
        "Environment",
        "Call Type",
        "Incoming/Outgoing"
    ]

    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({
            "error": "Missing fields",
            "fields": missing
        }), 400

    try:
        row = {
            "SNR": float(data["SNR"]),
            "Attenuation": float(data["Attenuation"]),
            "Distance to Tower (km)": float(data["Distance to Tower (km)"]),
            "Call Duration (s)": float(data["Call Duration (s)"]),
            "Environment": str(data["Environment"]).strip().lower(),
            "Call Type": str(data["Call Type"]).strip().lower(),
            "Incoming/Outgoing": str(data["Incoming/Outgoing"]).strip().lower()
        }

        # Validate numeric values
        numeric_fields = [
            "SNR",
            "Attenuation",
            "Distance to Tower (km)",
            "Call Duration (s)"
        ]

        for field in numeric_fields:
            value = row[field]
            if not pd.notna(value) or value < 0:
                return jsonify({
                    "error": f"{field} must be a valid non-negative number."
                }), 400

        allowed_environments = {"urban", "home", "open", "suburban"}
        allowed_call_types = {"voice", "data"}
        allowed_directions = {"incoming", "outgoing"}

        if row["Environment"] not in allowed_environments:
            return jsonify({"error": "Invalid environment."}), 400

        if row["Call Type"] not in allowed_call_types:
            return jsonify({"error": "Invalid call type."}), 400

        if row["Incoming/Outgoing"] not in allowed_directions:
            return jsonify({"error": "Invalid call direction."}), 400

        input_df = pd.DataFrame([row], columns=required_fields)

        prediction = model.predict(input_df)[0]
        probabilities = model.predict_proba(input_df)[0]
        confidence = float(max(probabilities) * 100)

        return jsonify({
            "predicted_category": str(prediction),
            "confidence_percent": round(confidence, 2),
            "model_name": model_info["model_name"],
            "accuracy_percent": model_info["accuracy_percent"],
            "note": model_info["note"]
        })

    except (TypeError, ValueError) as error:
        return jsonify({
            "error": f"Invalid input value: {error}"
        }), 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
