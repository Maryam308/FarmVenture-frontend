import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as activityService from "../../services/activitiesService";
import HeroSection from "../HeroSection/HeroSection";
import styles from "./ActivityForm.module.css";
import PopupAlert from "../PopupAlert/PopupAlert";

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
  });

  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file (JPG, PNG, GIF)");
      setShowErrorPopup(true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image must be less than 5MB");
      setShowErrorPopup(true);
      return;
    }

    setUploading(true);

    try {
      const imageUrl = await activityService.uploadImage(file);
      setFormData((prev) => ({ ...prev, image_url: imageUrl }));
      setImageFile(file);
    } catch (err) {
      setErrorMessage("Failed to upload image: " + err.message);
      setShowErrorPopup(true);
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

    // Validate image FIRST
    if (!formData.image_url && !activityId) {
      setErrorMessage("Activity image is required. Please upload an image before submitting.");
      setShowErrorPopup(true);
      return;
    }

    setLoading(true);

    // Validate other required fields
    if (!formData.title.trim()) {
      setErrorMessage("Activity title is required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setErrorMessage("Description is required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setErrorMessage("Valid price is required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setErrorMessage("Category is required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.date || !formData.time) {
      setErrorMessage("Date and time are required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.location.trim()) {
      setErrorMessage("Location is required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.max_capacity || parseInt(formData.max_capacity) <= 0) {
      setErrorMessage("Valid maximum capacity is required");
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    try {
      // Store as plain datetime string (no timezone conversion)
      // This ensures 2:00 PM stays as 2:00 PM for everyone
      const dateTimeString = `${formData.date}T${formData.time}:00`;

      const submitData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        date_time: dateTimeString,
        duration_minutes: parseInt(formData.duration_minutes),
        max_capacity: parseInt(formData.max_capacity),
        location: formData.location,
        category: formData.category,
        image_url: formData.image_url,
      };

      if (activityId) {
        await handleUpdateActivity(activityId, submitData);
        setSuccessMessage("Activity updated successfully!");
        setShowSuccessPopup(true);
        setTimeout(() => {
          navigate("/activities");
        }, 2000);
      } else {
        const { ...createData } = submitData;
        await handleAddActivity(createData);
        setSuccessMessage("Activity created successfully!");
        setShowSuccessPopup(true);
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to save activity. Please try again.");
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const formatDateTimeDisplay = (dateString, timeString) => {
    if (!dateString || !timeString) return "Not set";
    
    // Parse without timezone conversion
    const [year, month, day] = dateString.split('-');
    const [hour, minute] = timeString.split(':');
    
    const date = new Date(year, month - 1, day);
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    const timeStr = `${displayHour}:${minute} ${ampm}`;
    
    return `${dateStr} at ${timeStr}`;
  };

  useEffect(() => {
    const fetchActivity = async () => {
      if (activityId) {
        try {
          setLoading(true);
          const activityData = await activityService.show(activityId);

          // Parse date_time as plain string (no timezone conversion)
          let date = "";
          let time = "09:00";

          if (activityData.date_time) {
            // Split the datetime string directly
            const parts = activityData.date_time.split('T');
            date = parts[0]; // YYYY-MM-DD
            
            if (parts[1]) {
              // Get HH:MM from the time part
              const timeParts = parts[1].split(':');
              time = `${timeParts[0]}:${timeParts[1]}`; // HH:MM
            }
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
          });
        } catch (err) {
          setErrorMessage("Failed to load activity");
          setShowErrorPopup(true);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchActivity();
  }, [activityId]);

  return (
    <main className={styles.container}>
      <PopupAlert
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        title="Error"
        message={errorMessage}
        type="error"
        confirmText="OK"
        showCancel={false}
      />

      <PopupAlert
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Success"
        message={successMessage}
        type="success"
        confirmText="OK"
        showCancel={false}
        autoClose={true}
        autoCloseTime={2000}
      />

      <HeroSection title="FarmVenture" height="300px" />

      <div className={styles.contentSection}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h1>{activityId ? "Edit Activity" : "Create New Activity"}</h1>

          <div className={styles.formGroup}>
            <label htmlFor="image">
              Activity Image
              <span className={styles.required}>*</span>
            </label>

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

          <div className={styles.formGroup}>
            <label htmlFor="title">
              Activity Title
              <span className={styles.required}>*</span>
            </label>
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

          <div className={styles.formGroup}>
            <label htmlFor="description">
              Description
              <span className={styles.required}>*</span>
            </label>
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

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="price">
                Price per person (BHD)
                <span className={styles.required}>*</span>
              </label>
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
              <label htmlFor="category">
                Category
                <span className={styles.required}>*</span>
              </label>
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

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="date">
                Date
                <span className={styles.required}>*</span>
              </label>
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
              <label htmlFor="time">
                Start Time
                <span className={styles.required}>*</span>
              </label>
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

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="duration_minutes">
                Duration
                <span className={styles.required}>*</span>
              </label>
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
              <label htmlFor="max_capacity">
                Maximum Capacity
                <span className={styles.required}>*</span>
              </label>
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

          <div className={styles.formGroup}>
            <label htmlFor="location">
              Location
              <span className={styles.required}>*</span>
            </label>
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
                  <strong>Price:</strong> BHD{" "}
                  {parseFloat(formData.price || 0).toFixed(2)} per person
                </p>
                <p>
                  <strong>Capacity:</strong> Up to {formData.max_capacity} people
                </p>
              </div>
            </div>
          )}

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
      </div>
    </main>
  );
};

export default ActivityForm;