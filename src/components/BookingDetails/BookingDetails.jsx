import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as bookingService from "../../services/bookingService";
import HeroSection from "../HeroSection/HeroSection";
import styles from "./BookingDetails.module.css";
import PopupAlert from "../PopupAlert/PopupAlert";

const BookingDetails = ({ user }) => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getBookingById(bookingId);
        setBooking(data);
      } catch (err) {
        setError(err.message || "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleCancelBookingClick = () => {
    setPopupMessage("Are you sure you want to cancel this booking?");
    setShowCancelPopup(true);
  };

  const handleCancelBookingConfirm = async () => {
    try {
      setCancelling(true);
      await bookingService.cancelBooking(bookingId);
      setPopupMessage("Booking cancelled successfully!");
      setShowSuccessPopup(true);

      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } catch (err) {
      setPopupMessage(
        err.message || "Failed to cancel booking. Please try again."
      );
      setShowErrorPopup(true);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      upcoming: {
        text: "Upcoming",
        className: styles.statusUpcoming,
        icon: "📅",
      },
      today: { text: "Today", className: styles.statusToday, icon: "🎯" },
      past: { text: "Past", className: styles.statusPast, icon: "✅" },
    };

    const statusInfo = statusMap[status] || {
      text: status,
      className: styles.statusDefault,
      icon: "❓",
    };

    return (
      <span className={`${styles.statusBadge} ${statusInfo.className}`}>
        {statusInfo.icon} {statusInfo.text}
      </span>
    );
  };

  const canCancelBooking = () => {
    if (!booking || !booking.activity || !booking.activity.date_time) {
      return false;
    }

    if (booking.status === "past") {
      return false;
    }

    const activityDate = new Date(booking.activity.date_time);
    const now = new Date();
    const isFuture = activityDate > now;

    const isAdmin = user?.role === "admin";
    const isBookingOwner = String(booking.user_id) === String(user?.id);
    const canUserCancel = isAdmin || isBookingOwner;

    return isFuture && canUserCancel;
  };

  if (loading) {
    return (
      <main className={styles.container}>
        <HeroSection title="FarmVenture" height="300px" />
        <div className={styles.contentSection}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading booking details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className={styles.container}>
        <HeroSection title="FarmVenture" height="300px" />
        <div className={styles.contentSection}>
          <div className={styles.error}>
            <h2>Booking Not Found</h2>
            <p>{error || "This booking could not be found"}</p>
            <button
              onClick={() => navigate("/profile")}
              className={styles.backButton}
            >
              ← Back to Profile
            </button>
          </div>
        </div>
      </main>
    );
  }

  const totalPrice =
    parseFloat(booking.activity.price) * booking.tickets_number;

  return (
    <main className={styles.container}>
      <PopupAlert
        isOpen={showCancelPopup}
        onClose={() => setShowCancelPopup(false)}
        title="Cancel Booking"
        message={popupMessage}
        type="warning"
        confirmText="Yes, Cancel"
        cancelText="No, Keep Booking"
        showCancel={true}
        onConfirm={handleCancelBookingConfirm}
      />

      <PopupAlert
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Success"
        message={popupMessage}
        type="success"
        confirmText="OK"
        showCancel={false}
        autoClose={true}
        autoCloseTime={2000}
      />

      <PopupAlert
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        title="Error"
        message={popupMessage}
        type="error"
        confirmText="OK"
        showCancel={false}
      />

      <HeroSection title="FarmVenture" height="300px" />

      <div className={styles.contentSection}>
        <div className={styles.bookingDetailsWrapper}>
          <header className={styles.header}>
            <button
              onClick={() => navigate("/profile")}
              className={styles.backButton}
            >
              ← Back to Profile
            </button>
            <h1>Booking Details</h1>
          </header>

          <div className={styles.bookingCard}>
            <div className={styles.bookingHeader}>
              <div>
                <h2>Booking #{booking.id}</h2>
                <p className={styles.bookedDate}>
                  Booked on {new Date(booking.booked_at).toLocaleDateString()}{" "}
                  at{" "}
                  {new Date(booking.booked_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {getStatusBadge(booking.status)}
            </div>

            <div className={styles.activityInfo}>
              <div className={styles.activityImage}>
                {booking.activity.image_url ? (
                  <img
                    src={booking.activity.image_url}
                    alt={booking.activity.title}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>🎪</div>
                )}
              </div>

              <div className={styles.activityDetails}>
                <h3>{booking.activity.title}</h3>
                <p className={styles.description}>
                  {booking.activity.description}
                </p>

                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.icon}>📅</span>
                    <div>
                      <strong>Date</strong>
                      <p>
                        {new Date(
                          booking.activity.date_time
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.icon}>⏰</span>
                    <div>
                      <strong>Time</strong>
                      <p>
                        {new Date(
                          booking.activity.date_time
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.icon}>📍</span>
                    <div>
                      <strong>Location</strong>
                      <p>{booking.activity.location}</p>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.icon}>⏱️</span>
                    <div>
                      <strong>Duration</strong>
                      <p>{booking.activity.duration_minutes} minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.bookingInfo}>
              <h3>Booking Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span>Number of Tickets</span>
                  <strong>{booking.tickets_number}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>Price per Ticket</span>
                  <strong>
                    BHD {parseFloat(booking.activity.price).toFixed(2)}
                  </strong>
                </div>
                <div className={styles.infoItem}>
                  <span>Total Amount</span>
                  <strong className={styles.totalPrice}>
                    BHD {totalPrice.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            {user?.role === "admin" && (
              <div className={styles.customerInfo}>
                <h3>Customer Information</h3>
                <p>
                  <strong>Name:</strong> {booking.user.username}
                </p>
                <p>
                  <strong>Email:</strong> {booking.user.email}
                </p>
              </div>
            )}

            <div className={styles.actions}>
              <button
                onClick={() => navigate(`/activities/${booking.activity.id}`)}
                className={styles.viewActivityButton}
              >
                View Activity Details
              </button>

              {canCancelBooking() && (
                <button
                  onClick={handleCancelBookingClick}
                  disabled={cancelling}
                  className={styles.cancelButton}
                >
                  {cancelling ? "Cancelling..." : "Cancel Booking"}
                </button>
              )}
            </div>

            <div className={styles.importantNote}>
              <p>
                <strong>Important:</strong>
              </p>
              <ul>
                <li>Payment will be collected on-site</li>
                <li>Please arrive 15 minutes before the scheduled time</li>
                <li>
                  Cancellations must be made at least 24 hours in advance
                </li>
                <li>No refunds for no-shows</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BookingDetails;