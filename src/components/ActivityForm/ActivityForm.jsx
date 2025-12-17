// src/components/ActivityForm/ActivityForm.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as activityService from "../../services/activitiesService";
import styles from "./ActivityForm.module.css";

const ActivityForm = ({ handleAddActivity, handleUpdateActivity }) => {
  const { activityId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    date: "",
    time: "09:00",
    duration_minutes: "60",
    max_capacity: "20",
    location: "",
    category: "",
    image_url: "",
    is_active: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "farm_tour",
    "workshop",
    "harvesting",
    "animal_care",
    "cooking_class",
    "other",
  ];

  const durations = [
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1.5 hours" },
    { value: "120", label: "2 hours" },
    { value: "180", label: "3 hours" },
    { value: "240", label: "4 hours" },
  ];

  // Generate time options with 15-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of ["00", "15", "30", "45"]) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleChange = (event) => {
    const { name, value, type } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || "" : value,
    }));
    setError("");
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const imageUrl = await activityService.uploadImage(file);
      setFormData((prev) => ({ ...prev, image_url: imageUrl }));
      setImageFile(file);
    } catch (err) {
      setError("Failed to upload image: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image_url: "" }));
    setImageFile(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    if (!formData.image_url) {
      setError("Activity image is required");
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError("Category is required");
      setLoading(false);
      return;
    }

    if (!formData.location) {
      setError("Location is required");
      setLoading(false);
      return;
    }

    if (!formData.date || !formData.time) {
      setError("Date and time are required");
      setLoading(false);
      return;
    }

    try {
      // Combine date and time into ISO string
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      const submitData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        date_time: dateTime.toISOString(),
        duration_minutes: parseInt(formData.duration_minutes),
        max_capacity: parseInt(formData.max_capacity),
        location: formData.location,
        category: formData.category,
        image_url: formData.image_url,
        is_active: formData.is_active,
      };

      console.log("Submitting activity data:", submitData);

      if (activityId) {
        await handleUpdateActivity(activityId, submitData);
        navigate("/activities");
      } else {
        const { is_active, ...createData } = submitData;
        await handleAddActivity(createData);
      }
    } catch (err) {
      setError(err.message || "Failed to save activity. Please try again.");
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Format date for display
  const formatDateTimeDisplay = (dateString, timeString) => {
    if (!dateString || !timeString) return "Not set";
    const date = new Date(`${dateString}T${timeString}`);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    const fetchActivity = async () => {
      if (activityId) {
        try {
          setLoading(true);
          const activityData = await activityService.show(activityId);
          console.log("Fetched activity data:", activityData);

          // Parse existing date_time
          let date = "";
          let time = "09:00";

          if (activityData.date_time) {
            const activityDate = new Date(activityData.date_time);
            date = activityDate.toISOString().split("T")[0];

            // Round minutes to nearest 15 minutes
            const minutes = activityDate.getMinutes();
            const roundedMinutes = Math.round(minutes / 15) * 15;
            const hour = activityDate.getHours().toString().padStart(2, "0");
            const minute = roundedMinutes.toString().padStart(2, "0");
            time = `${hour}:${minute}`;
          }

          setFormData({
            title: activityData.title,
            description: activityData.description,
            price: activityData.price.toString(),
            date: date,
            time: time,
            duration_minutes: activityData.duration_minutes?.toString() || "60",
            max_capacity: activityData.max_capacity?.toString() || "20",
            location: activityData.location || "",
            category: activityData.category || "",
            image_url: activityData.image_url || "",
            is_active: activityData.is_active,
          });
        } catch (err) {
          setError("Failed to load activity");
          console.error("Fetch error:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchActivity();
  }, [activityId]);

  return (
    <main className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1>{activityId ? "Edit Activity" : "Create New Activity"}</h1>

        {error && <div className={styles.error}>{error}</div>}

        {/* Image Upload Section - REQUIRED */}
        <div className={styles.formGroup}>
          <label htmlFor="image">Activity Image *</label>

          <div className={styles.imageSection}>
            {formData.image_url ? (
              <div className={styles.imagePreview}>
                <img src={formData.image_url} alt="Preview" />
                <div className={styles.imageActions}>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className={styles.removeImage}
                  >
                    Remove Image
                  </button>
                  <span className={styles.imageStatus}>
                    ✓ Image uploaded successfully
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.imageUpload}>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className={styles.fileInput}
                  disabled={uploading}
                  required={!activityId}
                />
                <label htmlFor="image" className={styles.uploadButton}>
                  {uploading ? "Uploading..." : "Choose Image"}
                </label>
                <p className={styles.uploadHint}>
                  JPG, PNG, GIF • Max 5MB • Required
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Title */}
        <div className={styles.formGroup}>
          <label htmlFor="title">Activity Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            minLength="1"
            maxLength="100"
            placeholder="e.g., Guided Farm Tour"
          />
        </div>

        {/* Description */}
        <div className={styles.formGroup}>
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            maxLength="1000"
            rows="4"
            placeholder="Describe the activity, what participants will do, what they'll learn..."
          />
        </div>

        {/* Price and Category */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="price">Price per person (BHD) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="25.00"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date and Time Picker - Split into date and time */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              min={getMinDate()}
              className={styles.dateInput}
            />
            <p className={styles.formHelp}>Choose a future date</p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="time">Start Time *</label>
            <select
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className={styles.timeSelect}
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </option>
              ))}
            </select>
            <p className={styles.formHelp}>15-minute intervals</p>
          </div>
        </div>

        {/* Duration and Capacity */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="duration_minutes">Duration *</label>
            <select
              id="duration_minutes"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              required
            >
              {durations.map((duration) => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="max_capacity">Maximum Capacity *</label>
            <input
              type="number"
              id="max_capacity"
              name="max_capacity"
              value={formData.max_capacity}
              onChange={handleChange}
              required
              min="1"
              max="100"
              placeholder="20"
            />
          </div>
        </div>

        {/* Location - REQUIRED */}
        <div className={styles.formGroup}>
          <label htmlFor="location">Location *</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            maxLength="100"
            placeholder="e.g., Main Barn, Meeting Point"
            required
          />
        </div>

        {/* Active/Inactive Radio Buttons (Only for editing) */}
        {activityId && (
          <div className={styles.formGroup}>
            <label>Activity Status *</label>
            <div className={styles.radioGroup}>
              <label
                className={`${styles.radioLabel} ${
                  formData.is_active ? styles.active : ""
                }`}
              >
                <input
                  type="radio"
                  name="is_active"
                  value="true"
                  checked={formData.is_active === true}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, is_active: true }))
                  }
                />
                <span className={styles.radioText}>
                  <span className={styles.statusDot}></span>
                  Active (Visible to customers)
                </span>
              </label>
              <label
                className={`${styles.radioLabel} ${
                  formData.is_active === false ? styles.inactive : ""
                }`}
              >
                <input
                  type="radio"
                  name="is_active"
                  value="false"
                  checked={formData.is_active === false}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, is_active: false }))
                  }
                />
                <span className={styles.radioText}>
                  <span className={styles.statusDot}></span>
                  Inactive (Hidden from customers)
                </span>
              </label>
            </div>
            <p className={styles.radioHelp}>
              Note: Inactive activities are hidden from public view.
            </p>
          </div>
        )}

        {/* Form Summary Preview */}
        {formData.title && (
          <div className={styles.previewSection}>
            <h3>Activity Preview</h3>
            <div className={styles.previewContent}>
              <p>
                <strong>Title:</strong> {formData.title}
              </p>
              <p>
                <strong>Date & Time:</strong>{" "}
                {formatDateTimeDisplay(formData.date, formData.time)}
              </p>
              <p>
                <strong>Duration:</strong>{" "}
                {durations.find((d) => d.value === formData.duration_minutes)
                  ?.label || "Not set"}
              </p>
              <p>
                <strong>Price:</strong> BHD
                {parseFloat(formData.price || 0).toFixed(2)} per person
              </p>
              <p>
                <strong>Capacity:</strong> Up to {formData.max_capacity} people
              </p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <button
            type="submit"
            disabled={loading || uploading}
            className={styles.submitButton}
          >
            {loading
              ? "Saving..."
              : activityId
              ? "Update Activity"
              : "Create Activity"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/activities")}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
};

export default ActivityForm;
