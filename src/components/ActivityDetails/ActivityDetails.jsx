import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import * as activityService from "../../services/activitiesService";
import * as bookingService from "../../services/bookingService";
import HeroSection from "../HeroSection/HeroSection";
import styles from "./ActivityDetails.module.css";
import Loading from "../Loading/Loading";
import PopupAlert from "../PopupAlert/PopupAlert";
import AuthorInfo from "../AuthorInfo/AuthorInfo";

const ActivityDetails = ({ user, handleDeleteActivity }) => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpcoming, setIsUpcoming] = useState(true);
  const [hasBooked, setHasBooked] = useState(false);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const formatPrice = (price) => `BHD ${parseFloat(price).toFixed(2)}`;

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const formatDateTime = (dateTime) => {
    // Parse UTC datetime string directly without timezone conversion
    const dateTimeParts = dateTime.split("T");
    const datePart = dateTimeParts[0]; // YYYY-MM-DD
    const timePart = dateTimeParts[1]
      ? dateTimeParts[1].split(":")
      : ["00", "00"];

    // Create date object from parts for formatting
    const [year, month, day] = datePart.split("-");
    const date = new Date(year, month - 1, day);

    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Format time from the parsed parts
    const hour = parseInt(timePart[0]);
    const minute = timePart[1];
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const timeStr = `${displayHour
      .toString()
      .padStart(2, "0")}:${minute} ${ampm}`;

    return { dateStr, timeStr };
  };

  const handleDeleteClick = () => {
    setShowDeletePopup(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await activityService.remove(activityId);
      if (handleDeleteActivity) {
        handleDeleteActivity(activityId);
      }
      setSuccessMessage("Activity deleted successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => {
        navigate("/activities");
      }, 2000);
    } catch (err) {
      setErrorMessage("Failed to delete activity: " + err.message);
      setShowErrorPopup(true);
    }
  };

  const checkUserBooking = async () => {
    if (!user || user.role === "admin") {
      setHasBooked(false);
      return;
    }

    try {
      const bookings = await bookingService.getMyBookings();
      const booked = bookings.some(
        (booking) =>
          booking.activity_id === parseInt(activityId) &&
          booking.status !== "past"
      );
      setHasBooked(booked);
    } catch (error) {
      setHasBooked(false);
    }
  };

  const fetchActivity = async () => {
    try {
      setLoading(true);

      const activityData = await activityService.show(activityId);
      setActivity(activityData);
      setIsUpcoming(new Date(activityData.date_time) > new Date());
    } catch (err) {
      setErrorMessage("Failed to load activity details");
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    checkUserBooking();
  }, [activityId, user]);

  useEffect(() => {
    const handleBookingEvent = () => {
      fetchActivity();
      checkUserBooking();
    };

    window.addEventListener("bookingCreated", handleBookingEvent);
    window.addEventListener("bookingCancelled", handleBookingEvent);

    return () => {
      window.removeEventListener("bookingCreated", handleBookingEvent);
      window.removeEventListener("bookingCancelled", handleBookingEvent);
    };
  }, [user, activityId]);

  if (loading) return <Loading />;

  if (!activity) {
    return (
      <main className={styles.container}>
        <HeroSection title="FarmVenture" height="300px" />
        <div className={styles.contentSection}>
          <div className={styles.error}>Activity not found</div>
        </div>
      </main>
    );
  }

  const isAdmin = user?.role === "admin";
  const dateTime = formatDateTime(activity.date_time);
  const isSoldOut = activity.current_capacity >= activity.max_capacity;
  const spotsAvailable = activity.max_capacity - activity.current_capacity;

  return (
    <main className={styles.container}>
      <PopupAlert
        isOpen={showDeletePopup}
        onClose={() => setShowDeletePopup(false)}
        title="Delete Activity"
        message="Are you sure you want to permanently delete this activity? This action cannot be undone."
        type="warning"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        showCancel={true}
        onConfirm={handleDeleteConfirm}
      />

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
        <div className={styles.activityWrapper}>
          <div className={styles.topSection}>
            {/* LEFT: Image */}
            <div className={styles.imageContainer}>
              {activity.image_url ? (
                <img
                  src={activity.image_url}
                  alt={activity.title}
                  className={styles.activityImage}
                />
              ) : (
                <div className={styles.noImage}>
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-calendar-icon lucide-calendar"
                    >
                      <path d="M8 2v4" />
                      <path d="M16 2v4" />
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <path d="M3 10h18" />
                    </svg>
                  </span>
                  <p>No Image Available</p>
                </div>
              )}
            </div>

            {/* RIGHT: Details */}
            <div className={styles.detailsContainer}>
              <div className={styles.categorySection}>
                {activity.category && (
                  <span className={styles.category}>
                    {activity.category
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </span>
                )}
                {isUpcoming ? (
                  <span className={styles.upcomingLabel}>Upcoming</span>
                ) : (
                  <span className={styles.pastLabel}>Past Event</span>
                )}
              </div>

              <h1>{activity.title}</h1>

              <div className={styles.priceSection}>
                <h2 className={styles.price}>{formatPrice(activity.price)}</h2>
                <span className={styles.perPerson}>per person</span>
              </div>

              <section className={styles.infoSection}>
                <h3>Activity Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-calendar-icon lucide-calendar"
                      >
                        <path d="M8 2v4" />
                        <path d="M16 2v4" />
                        <rect width="18" height="18" x="3" y="4" rx="2" />
                        <path d="M3 10h18" />
                      </svg>
                    </div>
                    <div>
                      <strong>Date:</strong>
                      <span>{dateTime.dateStr}</span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-clock-icon lucide-clock"
                      >
                        <path d="M12 6v6l4 2" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <div>
                      <strong>Time:</strong>
                      <span>{dateTime.timeStr}</span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-clock-icon lucide-clock"
                      >
                        <path d="M12 6v6l4 2" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <div>
                      <strong>Duration:</strong>
                      <span>{formatDuration(activity.duration_minutes)}</span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-users-icon lucide-users"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <path d="M16 3.128a4 4 0 0 1 0 7.744" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    </div>
                    <div>
                      <strong>Capacity:</strong>
                      <span>
                        {activity.current_capacity} of {activity.max_capacity}{" "}
                        booked
                        <span className={styles.spotsLeft}>
                          ({spotsAvailable} spots left)
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-map-pin-icon lucide-map-pin"
                      >
                        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <strong>Location:</strong>
                      <span>{activity.location || "On-site at the farm"}</span>
                    </div>
                  </div>
                </div>
              </section>

              <div className={styles.authorActions}>
                <AuthorInfo content={activity} />
              </div>

              {isAdmin && (
                <div className={styles.actionButtons}>
                  <Link
                    to={`/activities/${activityId}/edit`}
                    className={styles.editButton}
                  >
                    Edit Activity
                  </Link>
                  <button
                    onClick={handleDeleteClick}
                    className={styles.deleteButton}
                  >
                    Delete Activity
                  </button>
                </div>
              )}

              {isUpcoming && !isAdmin && (
                <div className={styles.bookingActions}>
                  {hasBooked ? (
                    <button className={styles.bookedButton} disabled>
                      <span className={styles.bookedIcon}>✓</span>
                      Already Booked
                    </button>
                  ) : isSoldOut ? (
                    <button className={styles.soldOutButton} disabled>
                      Sold Out
                    </button>
                  ) : user ? (
                    <>
                      <Link
                        to={`/activities/${activityId}/book`}
                        className={styles.bookButton}
                      >
                        Book Now
                      </Link>
                      <p className={styles.bookingNote}>
                        Secure your spot for this activity
                      </p>
                    </>
                  ) : (
                    <>
                      <Link to="/signin" className={styles.bookButton}>
                        Sign In to Book
                      </Link>
                      <p className={styles.bookingNote}>
                        You need to be signed in to book activities
                      </p>
                    </>
                  )}
                </div>
              )}

              {!isUpcoming && (
                <div className={styles.pastEventNotice}>
                  <p>This activity has already taken place.</p>
                  <Link to="/activities" className={styles.browseButton}>
                    Browse Upcoming Activities
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM: Description */}
          <section className={styles.descriptionSection}>
            <h3>Description</h3>
            <p>{activity.description}</p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ActivityDetails;
