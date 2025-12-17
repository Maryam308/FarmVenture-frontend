// src/components/ActivityDetails/ActivityDetails.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import * as activityService from "../../services/activitiesService";
import * as bookingService from "../../services/bookingService";
import styles from "./ActivityDetails.module.css";
import Loading from "../Loading/Loading";

const ActivityDetails = ({ user, handleDeleteActivity }) => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpcoming, setIsUpcoming] = useState(true);
  const [hasBooked, setHasBooked] = useState(false);

  // Format functions
  const formatPrice = (price) => `BHD${parseFloat(price).toFixed(2)}`;

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { dateStr, timeStr };
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "WARNING: This will PERMANENTLY DELETE the activity from the database. This action cannot be undone. Are you sure?"
      )
    ) {
      return;
    }

    try {
      await activityService.remove(activityId);
      if (handleDeleteActivity) {
        handleDeleteActivity(activityId);
      }
      navigate("/activities");
    } catch (err) {
      setError("Failed to delete activity: " + err.message);
    }
  };

  // Check if user has booked this activity
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

  // Fetch activity details
  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const activityData = await activityService.show(activityId);
      setActivity(activityData);
      setIsUpcoming(new Date(activityData.date_time) > new Date());
    } catch (err) {
      setError("Failed to load activity details");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchActivity();
    checkUserBooking();
  }, [activityId, user]);

  // Listen for booking events
  useEffect(() => {
    const handleBookingEvent = () => {
      fetchActivity(); // Refresh to update capacity
      checkUserBooking(); // Refresh booking status
    };

    window.addEventListener("bookingCreated", handleBookingEvent);
    window.addEventListener("bookingCancelled", handleBookingEvent);

    return () => {
      window.removeEventListener("bookingCreated", handleBookingEvent);
      window.removeEventListener("bookingCancelled", handleBookingEvent);
    };
  }, [user, activityId]);

  if (loading) return <Loading />;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!activity) return <div className={styles.error}>Activity not found</div>;

  const isAdmin = user?.role === "admin";
  const dateTime = formatDateTime(activity.date_time);
  const isSoldOut = activity.current_capacity >= activity.max_capacity;
  const spotsAvailable = activity.max_capacity - activity.current_capacity;

  return (
    <main className={styles.container}>
      <div className={styles.activityWrapper}>
        <div className={styles.detailsContainer}>
          <header className={styles.header}>
            <div className={styles.imageContainer}>
              {activity.image_url ? (
                <img
                  src={activity.image_url}
                  alt={activity.title}
                  className={styles.activityImage}
                />
              ) : (
                <div className={styles.noImage}>
                  <span>📅</span>
                  <p>No Image Available</p>
                </div>
              )}
            </div>

            <h1>{activity.title}</h1>

            <div className={styles.authorActions}>
              {isAdmin && (
                <div className={styles.actionButtons}>
                  <Link
                    to={`/activities/${activityId}/edit`}
                    className={styles.editButton}
                  >
                    Edit
                  </Link>

                  <button
                    onClick={handleDelete}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Price and DateTime Section */}
          <div className={styles.priceDateTimeSection}>
            <div className={styles.priceSection}>
              <h2 className={styles.price}>{formatPrice(activity.price)}</h2>
              <span className={styles.perPerson}>per person</span>
            </div>

            <div className={styles.dateTimeSection}>
              <div className={styles.dateTimeItem}>
                <div className={styles.icon}>📅</div>
                <div className={styles.dateTimeText}>
                  <span className={styles.dateLabel}>Date</span>
                  <span className={styles.date}>{dateTime.dateStr}</span>
                </div>
              </div>

              <div className={styles.dateTimeItem}>
                <div className={styles.icon}>⏰</div>
                <div className={styles.dateTimeText}>
                  <span className={styles.timeLabel}>Time</span>
                  <span className={styles.time}>{dateTime.timeStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <section className={styles.descriptionSection}>
            <h3>Description</h3>
            <p>{activity.description}</p>
          </section>

          {/* Activity Information */}
          <section className={styles.infoSection}>
            <h3>Activity Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>⏰</div>
                <div>
                  <strong>Duration:</strong>
                  <span>{formatDuration(activity.duration_minutes)}</span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>👥</div>
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
                <div className={styles.infoIcon}>📍</div>
                <div>
                  <strong>Location:</strong>
                  <span>{activity.location || "On-site at the farm"}</span>
                </div>
              </div>

              {activity.category && (
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>🏷️</div>
                  <div>
                    <strong>Category:</strong>
                    <span>
                      {activity.category
                        .split("_")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Booking Section (for upcoming events) */}
          {isUpcoming && (
            <section className={styles.bookingSection}>
              <h3>Join This Activity</h3>
              <div className={styles.bookingInfo}>
                <p>
                  <strong>
                    {spotsAvailable} spot{spotsAvailable !== 1 ? "s" : ""}{" "}
                    available
                  </strong>{" "}
                  out of {activity.max_capacity}
                </p>

                {!isAdmin ? (
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
                ) : (
                  <p className={styles.bookingNote}>
                    Admin accounts cannot book activities
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Sold Out Notice */}
          {isSoldOut && isUpcoming && (
            <section className={styles.soldOutSection}>
              <h3>Sold Out</h3>
              <div className={styles.soldOutInfo}>
                <div className={styles.soldOutIcon}>⚠️</div>
                <p>
                  This activity is fully booked. Check back later for future
                  events!
                </p>
              </div>
            </section>
          )}

          {/* Past Event Notice */}
          {!isUpcoming && (
            <section className={styles.pastEventSection}>
              <h3>Past Event</h3>
              <div className={styles.pastEventInfo}>
                <div className={styles.pastEventIcon}>ℹ️</div>
                <p>
                  This activity has already taken place. View our upcoming
                  activities for future events.
                </p>
                <Link to="/activities" className={styles.browseButton}>
                  Browse Upcoming Activities
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
};

export default ActivityDetails;
