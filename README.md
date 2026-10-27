# NETCLASS — Network Performance Classifier

A machine learning project that classifies network signal performance into **Strong, Moderate, or Weak** categories using a Random Forest classifier. The project includes a Flask backend and a web interface for interactive predictions.

## Overview

NETCLASS uses network-related parameters to predict a signal category based on patterns learned from a dataset. Users can enter network measurements through a web interface and view the predicted category and model confidence.

**Note:** The categories are generated using illustrative signal-strength thresholds. They are not verified labels of overall network quality, and predictions should not be treated as definitive network diagnostics.

## Features

- Machine learning classification using Random Forest
- Flask backend with prediction API
- Interactive web interface for entering network parameters
- Prediction category and model confidence display
- Preprocessing of numerical and categorical features
- Model information and methodology details

## Technologies Used

- **Language:** Python
- **Machine Learning:** Scikit-learn
- **Data Processing:** Pandas
- **Model Storage:** Joblib
- **Backend:** Flask
- **Frontend:** HTML, CSS, JavaScript

## Input Parameters

The model uses the following input features:

- SNR
- Attenuation
- Distance to Tower
- Call Duration
- Environment
- Call Type
- Incoming/Outgoing

Signal Strength is excluded from the model inputs because it is used to generate the target categories.

## Model and Evaluation

Three classification algorithms were compared during experimentation:

| Model | Test Accuracy |
|---|---:|
| Random Forest | 49.46% |
| Extra Trees | 44.09% |
| Logistic Regression | 35.48% |

Random Forest achieved the highest accuracy among the three models tested.

The target categories were generated using these illustrative signal-strength thresholds:

- **Strong:** Signal strength ≥ -70 dBm
- **Moderate:** -90 dBm ≤ signal strength < -70 dBm
- **Weak:** Signal strength < -90 dBm

The reported accuracy is based on the available dataset and the selected train-test split. The dataset is small, and the results indicate that the model requires further improvement and validation before practical use.

## Project Structure

```text
NetworkPerformanceAI/
├── app.py
├── network_model.joblib
├── model_info.json
├── requirements.txt
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   └── script.js
└── .gitignore
```

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/aish04-pixel/NETCLASS-Network-Performance-Classifier.git
cd NETCLASS-Network-Performance-Classifier
```

### 2. Create and activate a virtual environment

```bash
python -m venv .venv
```

On Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the Flask application

```bash
python app.py
```

### 5. Open the website

Visit:

```text
http://127.0.0.1:5000/
```

## Future Improvements

- Increase dataset size and diversity
- Use verified network-quality labels
- Improve classification performance
- Evaluate the model on independent test data
- Explore real-time network measurements
- Deploy the application for public access

## Disclaimer

This project is developed for educational purposes. Predictions are experimental and should not be used as the sole basis for real-world network troubleshooting or operational decisions.

## Author

**Aishwarya M**

B.Tech Computer Science and Engineering (IoT)

[GitHub](https://github.com/aish04-pixel) · [LinkedIn](https://www.linkedin.com/in/aishwarya-m-engineering-student/)
