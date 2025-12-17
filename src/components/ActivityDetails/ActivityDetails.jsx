// src/components/ActivityDetails/ActivityDetails.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import * as activityService from "../../services/activitiesService";
import styles from "./ActivityDetails.module.css";
import Loading from "../Loading/Loading";

const ActivityDetails = ({ user, handleDeleteActivity }) => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpcoming, setIsUpcoming] = useState(true);

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
      console.error("Delete error:", err);
    }
  };

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        const activityData = await activityService.show(activityId);

        setActivity(activityData);
        setIsUpcoming(new Date(activityData.date_time) > new Date());
      } catch (err) {
        console.error("Fetch activity error:", err);
        setError("Failed to load activity details");
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId]);

  if (loading) return <Loading />;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!activity) return <div className={styles.error}>Activity not found</div>;

  const isAdmin = user?.role === "admin";
  const canEditDelete = isAdmin;

  const dateTime = formatDateTime(activity.date_time);
  const isSoldOut = activity.current_capacity >= activity.max_capacity;

  return (
    <main className={styles.container}>
      <div className={styles.activityWrapper}>
        {/* Activity Details */}
        <div className={styles.detailsContainer}>
          <header className={styles.header}>
            {/* Activity Image */}
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
                      ({activity.max_capacity - activity.current_capacity} spots
                      left)
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
          {isUpcoming && !isSoldOut && (
            <section className={styles.bookingSection}>
              <h3>Join This Activity</h3>
              <div className={styles.bookingInfo}>
                <p>
                  <strong>
                    {activity.max_capacity - activity.current_capacity} spots
                    available
                  </strong>{" "}
                  out of {activity.max_capacity}
                </p>

                {user?.role !== "admin" ? (
                  <div className={styles.bookingActions}>
                    <Link
                      to={`/activities/${activityId}/book`}
                      className={styles.bookButton}
                    >
                      Book Now
                    </Link>
                    <p className={styles.bookingNote}>
                      Secure your spot for this activity
                    </p>
                  </div>
                ) : (
                  <p className={styles.bookingNote}>
                    To book this activity, please contact us or visit our farm
                    office.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Sold Out Notice */}
          {isSoldOut && (
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
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
};

export default ActivityDetails;
