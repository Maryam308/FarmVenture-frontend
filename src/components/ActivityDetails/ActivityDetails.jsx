// src/components/ActivityDetails/ActivityDetails.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AuthorInfo from "../AuthorInfo/AuthorInfo";
import Icon from "../Icon/Icon";
import * as activityService from "../../services/activitiesService";
import * as favoriteService from "../../services/favoriteService";
import styles from "./ActivityDetails.module.css";
import Loading from "../Loading/Loading";

const ActivityDetails = ({ user, handleDeleteActivity }) => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(true);
  const [isUpcoming, setIsUpcoming] = useState(true);

  // Format functions
  const formatPrice = (price) => `$${parseFloat(price).toFixed(2)}`;

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
        "Are you sure you want to delete this activity? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await handleDeleteActivity(activityId);
      navigate("/activities");
    } catch (err) {
      setError("Failed to delete activity: " + err.message);
      console.error("Delete error:", err);
    }
  };

  // Check if activity is favorited
  const checkFavoriteStatus = async () => {
    if (!user) {
      setIsFavorited(false);
      setLoadingFavorite(false);
      return;
    }

    try {
      setLoadingFavorite(true);
      console.log("Checking favorite status for activity:", activityId);
      const response = await favoriteService.checkFavorite(
        activityId,
        "activity"
      );
      console.log("Favorite check response:", response);
      setIsFavorited(response.is_favorited);
    } catch (error) {
      console.error("Error checking favorite status:", error);
      setIsFavorited(false);
    } finally {
      setLoadingFavorite(false);
    }
  };

  // Broadcast favorite update to other components
  const broadcastFavoriteUpdate = () => {
    localStorage.setItem("favorites_updated", Date.now().toString());
    window.dispatchEvent(new Event("favoriteUpdated"));
    console.log("Broadcasted favorite update");
  };

  // Toggle favorite status
  const handleFavoriteToggle = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      if (isFavorited) {
        console.log("Removing favorite for activity:", activityId);
        await favoriteService.removeFavorite(activityId, "activity");
        setIsFavorited(false);
      } else {
        console.log("Adding favorite for activity:", activityId);
        await favoriteService.addFavorite(activityId, "activity");
        setIsFavorited(true);
      }

      broadcastFavoriteUpdate();
    } catch (error) {
      console.error("Error toggling favorite:", error);
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
    checkFavoriteStatus();
  }, [activityId, user]);

  // Listen for favorite updates from other components
  useEffect(() => {
    const handleFavoriteUpdate = () => {
      console.log("ActivityDetails received favorite update, refreshing...");
      checkFavoriteStatus();
    };

    window.addEventListener("favoriteUpdated", handleFavoriteUpdate);

    return () => {
      window.removeEventListener("favoriteUpdated", handleFavoriteUpdate);
    };
  }, [activityId, user]);

  if (loading) return <Loading />;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!activity) return <div className={styles.error}>Activity not found</div>;

  const isAdmin = user?.role === "admin";
  const canEditDelete = isAdmin;
  const canViewInactive = isAdmin || activity.is_active;
  const dateTime = formatDateTime(activity.date_time);
  const isSoldOut = activity.current_capacity >= activity.max_capacity;

  // If activity is inactive and user cannot view it, show not found
  if (!activity.is_active && !canViewInactive) {
    return (
      <main className={styles.container}>
        <div className={styles.error}>
          <h2>Activity Not Available</h2>
          <p>This activity is currently inactive and cannot be viewed.</p>
          <Link to="/activities" className={styles.backLink}>
            ← Back to Activities
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.activityWrapper}>
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

          {/* Status Badges */}
          <div className={styles.statusBadges}>
            {!isUpcoming && <div className={styles.pastBadge}>PAST EVENT</div>}
            {!activity.is_active && (
              <div className={styles.inactiveBadge}>INACTIVE</div>
            )}
            {isSoldOut && <div className={styles.soldOutBadge}>SOLD OUT</div>}
          </div>

          {/* Favorite Button */}
          {user && (
            <button
              className={`${styles.favoriteButton} ${
                isFavorited ? styles.favorited : ""
              }`}
              onClick={handleFavoriteToggle}
              aria-label={
                isFavorited ? "Remove from favorites" : "Add to favorites"
              }
              disabled={loadingFavorite}
            >
              {isFavorited ? "❤️" : "🤍"}
            </button>
          )}
        </div>

        {/* Activity Details */}
        <div className={styles.detailsContainer}>
          <header className={styles.header}>
            <div className={styles.categorySection}>
              {activity.category && (
                <span className={styles.category}>
                  {activity.category.toUpperCase()}
                </span>
              )}
              <span
                className={`${styles.status} ${
                  activity.is_active ? styles.active : styles.inactive
                }`}
              >
                {activity.is_active ? "✓ Active" : "✗ Inactive"}
              </span>
              {!isUpcoming && (
                <span className={styles.pastLabel}>Past Event</span>
              )}
              {isUpcoming && (
                <span className={styles.upcomingLabel}>Upcoming</span>
              )}
            </div>

            <h1>{activity.title}</h1>

            <div className={styles.authorActions}>
              <AuthorInfo content={activity} />
              {canEditDelete && (
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
                    Delete Permanently
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
                <Icon name="Calendar" className={styles.icon} />
                <div className={styles.dateTimeText}>
                  <span className={styles.dateLabel}>Date</span>
                  <span className={styles.date}>{dateTime.dateStr}</span>
                </div>
              </div>

              <div className={styles.dateTimeItem}>
                <Icon name="Clock" className={styles.icon} />
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
                <Icon name="Clock" className={styles.infoIcon} />
                <div>
                  <strong>Duration:</strong>
                  <span>{formatDuration(activity.duration_minutes)}</span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <Icon name="Users" className={styles.infoIcon} />
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
                <Icon name="Location" className={styles.infoIcon} />
                <div>
                  <strong>Location:</strong>
                  <span>{activity.location || "On-site at the farm"}</span>
                </div>
              </div>

              {activity.category && (
                <div className={styles.infoItem}>
                  <Icon name="Category" className={styles.infoIcon} />
                  <div>
                    <strong>Category:</strong>
                    <span>{activity.category}</span>
                  </div>
                </div>
              )}

              <div className={styles.infoItem}>
                <Icon name="Calendar" className={styles.infoIcon} />
                <div>
                  <strong>Created On:</strong>
                  <span>
                    {new Date(activity.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <Icon name="Update" className={styles.infoIcon} />
                <div>
                  <strong>Last Updated:</strong>
                  <span>
                    {new Date(activity.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <Icon name="User" className={styles.infoIcon} />
                <div>
                  <strong>Organizer:</strong>
                  <span>{activity.user?.username || "Farm Staff"}</span>
                </div>
              </div>

              {isAdmin && !activity.is_active && (
                <div className={styles.infoItem}>
                  <Icon name="Alert" className={styles.infoIcon} />
                  <div>
                    <strong>Admin Note:</strong>
                    <span className={styles.adminNote}>
                      Activity is inactive and hidden from public view
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Booking Section (for upcoming events) */}
          {isUpcoming && activity.is_active && !isSoldOut && (
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
                <p className={styles.bookingNote}>
                  To book this activity, please contact us or visit our farm
                  office.
                </p>
              </div>
            </section>
          )}

          {/* Sold Out Notice */}
          {isSoldOut && (
            <section className={styles.soldOutSection}>
              <h3>Sold Out</h3>
              <div className={styles.soldOutInfo}>
                <Icon name="Alert" className={styles.soldOutIcon} />
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
                <Icon name="Info" className={styles.pastEventIcon} />
                <p>
                  This activity has already taken place. View our upcoming
                  activities for future events.
                </p>
              </div>
            </section>
          )}

          {/* Admin Actions (for inactive activities) */}
          {isAdmin && !activity.is_active && (
            <section className={styles.adminActions}>
              <h3>Admin Actions</h3>
              <div className={styles.adminButtons}>
                <button
                  onClick={() => {
                    activityService
                      .toggleStatus(activity.id)
                      .then((updatedActivity) => {
                        setActivity(updatedActivity);
                        alert("Activity activated successfully!");
                      })
                      .catch((err) => {
                        alert("Failed to activate activity: " + err.message);
                      });
                  }}
                  className={styles.activateButton}
                >
                  Activate Activity
                </button>
                <p className={styles.adminNote}>
                  This activity is currently hidden from regular users. Activate
                  it to make it visible in the activities list.
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
