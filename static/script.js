
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("predict-form");
  const submitButton = document.getElementById("submit-btn");
  const submitLabel = document.getElementById("submit-label");
  const resetButton = document.getElementById("reset-btn");
  const formError = document.getElementById("form-error");

  const statusDot = document.querySelector(".status-dot");
  const statusText = document.getElementById("status-text");

  const resultSection = document.getElementById("result");
  const resultPanel = document.getElementById("result-panel");
  const resultCategory = document.getElementById("result-category");
  const resultConfidence = document.getElementById("result-confidence");
  const resultModel = document.getElementById("result-model");
  const resultTag = document.getElementById("result-tag");
  const resultInterpretation = document.getElementById("result-interpretation");

  const fields = [
    {
      id: "snr",
      key: "SNR",
      label: "Signal-to-noise ratio",
      numeric: true
    },
    {
      id: "attenuation",
      key: "Attenuation",
      label: "Attenuation",
      numeric: true,
      min: 0
    },
    {
      id: "distance",
      key: "Distance to Tower (km)",
      label: "Distance to tower",
      numeric: true,
      min: 0
    },
    {
      id: "duration",
      key: "Call Duration (s)",
      label: "Call duration",
      numeric: true,
      min: 0
    },
    {
      id: "environment",
      key: "Environment",
      label: "Environment"
    },
    {
      id: "call_type",
      key: "Call Type",
      label: "Call type"
    },
    {
      id: "direction",
      key: "Incoming/Outgoing",
      label: "Connection direction"
    }
  ];

  function setBackendStatus(online) {
    statusDot.dataset.state = online ? "online" : "offline";
    statusText.textContent = online ? "Backend connected" : "Backend unavailable";
  }

  async function checkBackend() {
    try {
      const response = await fetch("/api/info", {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error("Backend returned an error.");
      }

      const info = await response.json();
      setBackendStatus(true);

      if (info.model_name) {
        resultModel.textContent = info.model_name;
      }
    } catch (error) {
      setBackendStatus(false);
    }
  }

  function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  function clearFormError() {
    formError.textContent = "";
    formError.hidden = true;
  }

  function setFieldError(field, message) {
    const input = document.getElementById(field.id);
    const error = document.getElementById(`${field.id}-err`);
    const container = input.closest(".field");

    error.textContent = message;
    container.classList.toggle("invalid", Boolean(message));

    if (message) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
  }

  function clearFieldErrors() {
    fields.forEach((field) => setFieldError(field, ""));
  }

  function validateForm() {
    let valid = true;
    let firstInvalid = null;

    fields.forEach((field) => {
      const input = document.getElementById(field.id);
      const rawValue = input.value.trim();
      let message = "";

      if (rawValue === "") {
        message = "Please enter or select a value.";
      } else if (field.numeric) {
        const number = Number(rawValue);

        if (!Number.isFinite(number)) {
          message = "Enter a valid number.";
        } else if (field.min !== undefined && number < field.min) {
          message = `Value must be at least ${field.min}.`;
        }
      }

      setFieldError(field, message);

      if (message) {
        valid = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });

    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  function setLoading(loading) {
    submitButton.disabled = loading;
    submitButton.setAttribute("aria-busy", String(loading));
    submitLabel.textContent = loading
      ? "Classifying..."
      : "Run classification";
  }

  function getInterpretation(category) {
    switch (category.toLowerCase()) {
      case "strong":
        return "The model classified this input as Strong. This is a model prediction, not a verified measurement of real-world network quality.";
      case "moderate":
        return "The model classified this input as Moderate. Actual network performance may differ from this prediction.";
      case "weak":
        return "The model classified this input as Weak. Actual network performance may differ from this prediction.";
      default:
        return "The model returned a category that this interface does not recognize.";
    }
  }

  function displayResult(data) {
    const category = String(data.predicted_category || "Unknown");
    const normalizedCategory = category.toLowerCase();

    resultPanel.dataset.category = [
      "strong",
      "moderate",
      "weak"
    ].includes(normalizedCategory)
      ? normalizedCategory
      : "unknown";

    resultCategory.textContent = category;
    resultModel.textContent = data.model_name || "Random Forest Classifier";

    const confidence = Number(data.confidence_percent);
    resultConfidence.textContent = Number.isFinite(confidence)
      ? `${confidence.toFixed(1)}%`
      : "Unavailable";

    resultTag.textContent = "MODEL OUTPUT";
    resultInterpretation.textContent = getInterpretation(category);

    resultSection.hidden = false;
    resultSection.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start"
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearFormError();

    if (!validateForm()) {
      showFormError("Check the highlighted fields before running the classification.");
      return;
    }

    const payload = {};

    fields.forEach((field) => {
      const value = document.getElementById(field.id).value.trim();
      payload[field.key] = field.numeric ? Number(value) : value;
    });

    setLoading(true);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("The server returned an unreadable response.");
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || "Prediction request failed.");
      }

      if (!data.predicted_category) {
        throw new Error("The server response did not contain a prediction.");
      }

      setBackendStatus(true);
      displayResult(data);
    } catch (error) {
      setBackendStatus(false);
      showFormError(
        error.message ||
        "Could not connect to the Flask API. Check that the server is running."
      );
    } finally {
      setLoading(false);
    }
  });

  form.addEventListener("input", (event) => {
    const field = fields.find((item) => item.id === event.target.id);

    if (field) {
      setFieldError(field, "");
      clearFormError();
    }
  });

  form.addEventListener("change", (event) => {
    const field = fields.find((item) => item.id === event.target.id);

    if (field) {
      setFieldError(field, "");
      clearFormError();
    }
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      clearFieldErrors();
      clearFormError();
      resultSection.hidden = true;
      resultPanel.dataset.category = "unknown";
      resultCategory.textContent = "—";
      resultConfidence.textContent = "—";
      resultTag.textContent = "MODEL OUTPUT";
      resultInterpretation.textContent =
        "Submit connection parameters to generate a prediction.";
      setLoading(false);
    }, 0);
  });

  resetButton.addEventListener("click", () => {
    // The form's reset event performs the cleanup.
  });

  checkBackend();
});
