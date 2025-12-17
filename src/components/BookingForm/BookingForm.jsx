// src/components/BookingForm/BookingForm.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as bookingService from "../../services/bookingService";
import * as activityService from "../../services/activitiesService";
import styles from "./BookingForm.module.css";

const BookingForm = ({ user }) => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingData, setBookingData] = useState({
    tickets_number: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch activity details
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch activity details
        const activityData = await activityService.show(activityId);

        setActivity(activityData);
      } catch (err) {
        setError(
          "Failed to load activity details: " +
            (err.message || "Please check your connection")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({
      ...prev,
      [name]: parseInt(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate("/signin");
      return;
    }

    // Check if user is admin (admins can't book)
    if (user.role === "admin") {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Basic validation
      const spotsLeft = activity.max_capacity - activity.current_capacity;
      const isUpcoming = new Date(activity.date_time) > new Date();

      if (!isUpcoming) {
        throw new Error("Cannot book past activities.");
      }

      if (bookingData.tickets_number > spotsLeft) {
        throw new Error(
          `Only ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} available.`
        );
      }

      if (bookingData.tickets_number < 1) {
        throw new Error("Please select at least 1 ticket.");
      }

      // Create booking - backend will return the created booking with ID
      const createdBooking = await bookingService.createBooking(
        activityId,
        bookingData.tickets_number
      );

      window.dispatchEvent(new Event("bookingCreated"));
      // Navigate to the booking details page
      navigate(`/bookings/${createdBooking.id}`);
    } catch (err) {
      // Handle specific error cases
      if (err.message.includes("already booked")) {
        setError(
          "You have already booked this activity. You can view it in your profile."
        );
      } else if (err.message.includes("Admins cannot")) {
        setError(
          "Admins cannot book activities. Please use a customer account."
        );
      } else if (err.message.includes("not found")) {
        setError("Activity not found or is no longer available.");
      } else {
        setError(err.message || "Failed to create booking. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading activity details...</p>
        </div>
      </main>
    );
  }

  if (error && !activity) {
    return (
      <main className={styles.container}>
        <div className={styles.error}>
          <h2>Unable to Book</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Go Back
          </button>
        </div>
      </main>
    );
  }

  if (!activity) {
    return (
      <main className={styles.container}>
        <div className={styles.error}>
          <h2>Activity Not Found</h2>
          <p>The activity you're trying to book could not be found.</p>
          <button
            onClick={() => navigate("/activities")}
            className={styles.backButton}
          >
            ← Back to Activities
          </button>
        </div>
      </main>
    );
  }

  const isUpcoming = new Date(activity.date_time) > new Date();

  const spotsLeft = activity.max_capacity - activity.current_capacity;
  const isSoldOut = spotsLeft <= 0;
  const maxTickets = Math.min(spotsLeft, 50);

  // Check if booking is possible
  const canBook = isUpcoming && !isSoldOut && user?.role !== "admin";

  return (
    <main className={styles.container}>
      <div className={styles.bookingWrapper}>
        <header className={styles.header}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Back
          </button>
          <h1>Book Activity</h1>
        </header>

        <div className={styles.activityInfo}>
          <h2>{activity.title}</h2>
          <div className={styles.activityDetails}>
            <div className={styles.detailItem}>
              <span className={styles.icon}>📅</span>
              <span>{new Date(activity.date_time).toLocaleDateString()}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.icon}>⏰</span>
              <span>
                {new Date(activity.date_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.icon}>💰</span>
              <span>BHD{parseFloat(activity.price).toFixed(2)} per person</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.icon}>👥</span>
              <span>{spotsLeft} spots available</span>
            </div>
          </div>
        </div>

        {!canBook ? (
          <div className={styles.cannotBook}>
            <div className={styles.cannotBookIcon}>🚫</div>
            <h3>Booking Not Available</h3>
            {!isUpcoming && <p>This activity has already taken place.</p>}

            {isSoldOut && <p>This activity is sold out.</p>}
            {user?.role === "admin" && <p>Admins cannot book activities.</p>}
            {!user && <p>Please log in to book activities.</p>}
            <button
              onClick={() => navigate(-1)}
              className={styles.returnButton}
            >
              Return to Activity
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.bookingForm}>
            <div className={styles.formGroup}>
              <label htmlFor="tickets_number">
                Number of Tickets *
                <span className={styles.ticketInfo}>
                  (Max {maxTickets} tickets, {spotsLeft} spots left)
                </span>
              </label>
              <div className={styles.ticketSelector}>
                <button
                  type="button"
                  onClick={() =>
                    setBookingData((prev) => ({
                      tickets_number: Math.max(1, prev.tickets_number - 1),
                    }))
                  }
                  disabled={bookingData.tickets_number <= 1}
                  className={styles.ticketButton}
                >
                  −
                </button>
                <input
                  type="number"
                  id="tickets_number"
                  name="tickets_number"
                  value={bookingData.tickets_number}
                  onChange={handleChange}
                  min="1"
                  max={maxTickets}
                  className={styles.ticketInput}
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setBookingData((prev) => ({
                      tickets_number: Math.min(
                        maxTickets,
                        prev.tickets_number + 1
                      ),
                    }))
                  }
                  disabled={bookingData.tickets_number >= maxTickets}
                  className={styles.ticketButton}
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.priceSummary}>
              <h3>Price Summary</h3>
              <div className={styles.priceRow}>
                <span>
                  {bookingData.tickets_number} × BHD
                  {parseFloat(activity.price).toFixed(2)}
                </span>
                <span>
                  BHD
                  {(
                    parseFloat(activity.price) * bookingData.tickets_number
                  ).toFixed(2)}
                </span>
              </div>
              <div className={styles.totalRow}>
                <strong>Total Amount</strong>
                <strong>
                  BHD
                  {(
                    parseFloat(activity.price) * bookingData.tickets_number
                  ).toFixed(2)}
                </strong>
              </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.bookingTerms}>
              <p>
                <strong>Booking Terms:</strong> Payment will be collected
                on-site • Cancellations must be made at least 24 hours in
                advance • No refunds for no-shows
              </p>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={styles.cancelButton}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={styles.submitButton}
              >
                {submitting ? "Processing..." : "Confirm Booking"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
};

export default BookingForm;
