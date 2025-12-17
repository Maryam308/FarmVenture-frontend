import { Link } from "react-router-dom";
import Icon from "../Icon/Icon";

const ActivityList = ({ activities, isAdmin = false }) => {
  // Format price with 2 decimal places
  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // Format duration to hours/minutes
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  // Format date for display
  const formatDate = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main>
      {activities.length === 0 ? (
        <div>
          <h3>No activities available</h3>
          <p>Check back later for new farm experiences!</p>
        </div>
      ) : (
        activities.map((activity) => (
          <Link key={activity.id} to={`/activities/${activity.id}`}>
            <article>
              {!activity.is_active && <div>INACTIVE</div>}

              <header>
                <div>
                  <h2>{activity.title}</h2>
                  <div>
                    {formatPrice(activity.price)}
                    <span>/person</span>
                  </div>
                </div>

                <div>
                  <div>
                    <Icon category="Calendar" />
                    <span>{formatDate(activity.date_time)}</span>
                    <span>{formatTime(activity.date_time)}</span>
                  </div>
                </div>
              </header>

              <p>{activity.description}</p>

              <div>
                <div>
                  <Icon category="Clock" />
                  <span>{formatDuration(activity.duration_minutes)}</span>
                </div>

                <div>
                  <Icon category="Users" />
                  <span>
                    {activity.current_capacity} of {activity.max_capacity}{" "}
                    booked
                  </span>
                  {activity.available_spots !== undefined && (
                    <span>
                      ({activity.max_capacity - activity.current_capacity} spots
                      left)
                    </span>
                  )}
                </div>

                {isAdmin && (
                  <div>
                    <Icon category="Admin" />
                    <span>Admin View</span>
                  </div>
                )}
              </div>

              {new Date(activity.date_time) > new Date() ? (
                <div>
                  <Icon category="Upcoming" />
                  <span>Upcoming</span>
                </div>
              ) : (
                <div>
                  <Icon category="Past" />
                  <span>Past Event</span>
                </div>
              )}
            </article>
          </Link>
        ))
      )}
    </main>
  );
};

export default ActivityList;
