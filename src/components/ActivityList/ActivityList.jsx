import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./ActivityList.module.css";
import * as activityService from "../../services/activitiesService";
import * as bookingService from "../../services/bookingService";
import PopupAlert from "../PopupAlert/PopupAlert";

const ActivityList = ({
  user,
  activities: initialActivities = [],
  setActivities,
}) => {
  const [statusFilter, setStatusFilter] = useState("upcoming");
  const [loading, setLoading] = useState(!initialActivities.length);
  const [activities, setLocalActivities] = useState(initialActivities);
  const [userBookings, setUserBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    activities.forEach((activity) => {
      if (activity.category) {
        uniqueCategories.add(activity.category);
      }
    });
    return ["all", ...Array.from(uniqueCategories).sort()];
  }, [activities]);

  const fetchUserBookings = async () => {
    if (user && user.role !== "admin") {
      try {
        const bookings = await bookingService.getMyBookings();
        setUserBookings(bookings);
      } catch (error) {}
    }
  };

  const fetchActivities = async () => {
    if (user?.role === "admin") {
      try {
        setLoading(true);
        const allActivities = await activityService.getAllActivitiesAdmin();
        setLocalActivities(allActivities);
        if (setActivities) setActivities(allActivities);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    } else if (!initialActivities.length) {
      try {
        setLoading(true);
        const publicActivities = await activityService.index(true);
        setLocalActivities(publicActivities);
        if (setActivities) setActivities(publicActivities);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchUserBookings();
  }, [user, initialActivities.length, setActivities]);

  useEffect(() => {
    const handleBookingEvent = () => {
      fetchUserBookings();
      fetchActivities();
    };

    window.addEventListener("bookingCreated", handleBookingEvent);
    window.addEventListener("bookingCancelled", handleBookingEvent);

    return () => {
      window.removeEventListener("bookingCreated", handleBookingEvent);
      window.removeEventListener("bookingCancelled", handleBookingEvent);
    };
  }, [user]);

  const hasUserBookedActivity = (activityId) => {
    if (!user || user.role === "admin") return false;
    return userBookings.some(
      (booking) =>
        booking.activity_id === activityId && booking.status !== "past"
    );
  };

  const formatPrice = (price) => {
    return `BHD${parseFloat(price).toFixed(2)}`;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const formatDate = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteClick = (activityId, e) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedActivityId(activityId);
    setPopupMessage(
      "WARNING: This will PERMANENTLY DELETE the activity from the database. This action cannot be undone. Are you sure?"
    );
    setShowDeletePopup(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedActivityId) return;

    try {
      await activityService.remove(selectedActivityId);
      setLocalActivities((prev) =>
        prev.filter((a) => a.id !== selectedActivityId)
      );
      if (setActivities) {
        setActivities((prev) =>
          prev.filter((a) => a.id !== selectedActivityId)
        );
      }
    } catch (error) {
      const errorMessage = error.message || "Unknown error occurred";
      setErrorMessage(`Failed to delete activity: ${errorMessage}`);
      setShowErrorPopup(true);
    }

    setSelectedActivityId(null);
  };

  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    if (statusFilter === "upcoming") {
      filtered = filtered.filter((a) => new Date(a.date_time) > new Date());
    } else if (statusFilter === "past") {
      filtered = filtered.filter((a) => new Date(a.date_time) <= new Date());
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (activity) =>
          activity.title.toLowerCase().includes(query) ||
          activity.description.toLowerCase().includes(query) ||
          (activity.category && activity.category.toLowerCase().includes(query))
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (activity) =>
          activity.category &&
          activity.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    switch (sortBy) {
      case "date":
        filtered.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
        break;
      case "date-desc":
        filtered.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
        break;
      case "price-low-high":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high-low":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "capacity":
        filtered.sort((a, b) => a.current_capacity - b.current_capacity);
        break;
      case "duration":
        filtered.sort((a, b) => a.duration_minutes - b.duration_minutes);
        break;
      default:
        filtered.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
    }

    return filtered;
  }, [activities, statusFilter, searchQuery, categoryFilter, sortBy]);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = filteredActivities.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, sortBy, statusFilter]);

  const upcomingCount = activities.filter(
    (a) => new Date(a.date_time) > new Date()
  ).length;
  const pastCount = activities.filter(
    (a) => new Date(a.date_time) <= new Date()
  ).length;
  const totalCount = activities.length;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  if (loading) {
    return (
      <main className={styles.container}>
        <div className={styles.heroSection}>
          <div className={styles.heroOverlay}>
            <h1 className={styles.heroTitle}>FarmVenture</h1>
          </div>
        </div>
        <div className={styles.contentSection}>
          <div className={styles.emptyState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading activities...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <PopupAlert
        isOpen={showDeletePopup}
        onClose={() => setShowDeletePopup(false)}
        title="Delete Activity"
        message={popupMessage}
        type="warning"
        confirmText="Delete"
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

      <div className={styles.heroSection}>
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>FarmVenture</h1>
        </div>
      </div>

      <div className={styles.contentSection}>
        <div className={styles.headerSection}>
          <div className={styles.titleRow}>
            <h1>Farm Activities</h1>
            {user?.role === "admin" && (
              <Link to="/activities/new" className={styles.createButton}>
                + Create Activity
              </Link>
            )}
          </div>

          <div className={styles.stats}>
            <span className={styles.statUpcoming}>{upcomingCount} Upcoming</span>
            <span className={styles.statPast}>{pastCount} Past</span>
            <span className={styles.statTotal}>{totalCount} Total</span>
            {searchQuery && (
              <span className={styles.searchResults}>
                {filteredActivities.length} results for "{searchQuery}"
              </span>
            )}
          </div>

          <div className={styles.searchFilterBar}>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Search activities by title, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  className={styles.clearSearch}
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="categoryFilter" className={styles.filterLabel}>
                  Category:
                </label>
                <select
                  id="categoryFilter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Categories</option>
                  {categories
                    .filter((cat) => cat !== "all")
                    .map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="sortBy" className={styles.filterLabel}>
                  Sort by:
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="date">Date (Earliest First)</option>
                  <option value="date-desc">Date (Latest First)</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="capacity">Capacity (Most Available)</option>
                  <option value="duration">Duration (Shortest First)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <p>
              {searchQuery
                ? `No activities found matching "${searchQuery}"`
                : categoryFilter !== "all"
                ? `No activities found in the "${categoryFilter}" category`
                : statusFilter === "upcoming"
                ? "No upcoming activities available"
                : statusFilter === "past"
                ? "No past activities found"
                : "No activities available."}
            </p>
            <div className={styles.emptyStateButtonGroup}>
              {(searchQuery ||
                categoryFilter !== "all" ||
                (statusFilter !== "upcoming" && user?.role !== "admin")) && (
                <button
                  className={styles.clearFiltersButton}
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                    setStatusFilter("upcoming");
                  }}
                >
                  ✕ Clear Filters
                </button>
              )}
              {user?.role === "admin" && (
                <Link to="/activities/new" className={styles.addButton}>
                  ➕ Create Your First Activity
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className={styles.resultsInfo}>
              <p>
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredActivities.length)} of{" "}
                {filteredActivities.length} activities
                {searchQuery && ` for "${searchQuery}"`}
                {statusFilter === "upcoming" && " (Upcoming)"}
                {statusFilter === "past" && " (Past Events)"}
              </p>
              <div className={styles.sortIndicator}>
                {sortBy === "date" && "Sorted by: Date (Earliest First)"}
                {sortBy === "date-desc" && "Sorted by: Date (Latest First)"}
                {sortBy === "price-low-high" && "Sorted by: Price (Low to High)"}
                {sortBy === "price-high-low" && "Sorted by: Price (High to Low)"}
                {sortBy === "capacity" && "Sorted by: Available Spots"}
                {sortBy === "duration" && "Sorted by: Duration"}
              </div>
            </div>

            <div className={styles.grid}>
              {currentActivities.map((activity) => {
                const isUpcoming = new Date(activity.date_time) > new Date();
                const isSoldOut =
                  activity.current_capacity >= activity.max_capacity;
                const hasBooked = hasUserBookedActivity(activity.id);

                return (
                  <div key={activity.id} className={styles.activityCardWrapper}>
                    <div className={styles.activityCard}>
                      <Link
                        to={`/activities/${activity.id}`}
                        className={styles.cardLink}
                      >
                        <article>
                          <div className={styles.imageContainer}>
                            {activity.image_url ? (
                              <img
                                src={activity.image_url}
                                alt={activity.title}
                                className={styles.activityImage}
                              />
                            ) : (
                              <div className={styles.noImage}>
                                <span>🌾</span>
                                <p>No Image</p>
                              </div>
                            )}

                            {isUpcoming ? (
                              <div className={styles.upcomingBadge}>UPCOMING</div>
                            ) : (
                              <div className={styles.pastBadge}>PAST</div>
                            )}

                            {hasBooked && isUpcoming && (
                              <div className={styles.bookedBadge}>BOOKED</div>
                            )}

                            {isSoldOut && (
                              <div className={styles.soldOutBadge}>SOLD OUT</div>
                            )}
                          </div>

                          <div className={styles.activityContent}>
                            <header>
                              <div className={styles.activityHeader}>
                                <h2>{activity.title}</h2>
                                <div className={styles.priceTag}>
                                  {formatPrice(activity.price)}
                                  <span>/person</span>
                                </div>
                              </div>
                            </header>

                            <div className={styles.datetimeInfo}>
                              <span className={styles.iconText}>📅</span>
                              <span className={styles.date}>
                                {formatDate(activity.date_time)}
                              </span>
                              <span className={styles.time}>
                                {formatTime(activity.date_time)}
                              </span>
                            </div>

                            <p className={styles.description}>
                              {activity.description}
                            </p>

                            <div className={styles.activityDetails}>
                              <div className={styles.detailItem}>
                                <span className={styles.iconText}>⏰</span>
                                <span>
                                  {formatDuration(activity.duration_minutes)}
                                </span>
                              </div>

                              {activity.category && (
                                <div className={styles.detailItem}>
                                  <span className={styles.iconText}>🏷️</span>
                                  <span className={styles.category}>
                                    {activity.category}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className={styles.activityFooter}>
                              {activity.location && (
                                <span className={styles.location}>
                                  <span className={styles.iconText}>📍</span>
                                  {activity.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      </Link>

                      {user?.role === "admin" && (
                        <div className={styles.adminActions}>
                          <Link
                            to={`/activities/${activity.id}/edit`}
                            className={styles.editBtn}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Edit
                          </Link>

                          <button
                            onClick={(e) => handleDeleteClick(activity.id, e)}
                            className={styles.deleteBtn}
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      {user?.role !== "admin" && isUpcoming && (
                        <div className={styles.bookingAction}>
                          {hasBooked ? (
                            <button className={styles.bookedButton} disabled>
                              <span className={styles.bookedIcon}>✓</span>
                              Already Booked
                            </button>
                          ) : isSoldOut ? (
                            <button className={styles.soldOutButton} disabled>
                              Sold Out
                            </button>
                          ) : !user ? (
                            <button
                              className={styles.signInToBookButton}
                              disabled
                              title="Please sign in to book this activity"
                            >
                              <span className={styles.lockIcon}>🔒</span>
                              Sign In to Book
                            </button>
                          ) : (
                            <Link
                              to={`/activities/${activity.id}/book`}
                              className={styles.bookButton}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Book Now
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={`${styles.pageButton} ${
                    currentPage === 1 ? styles.disabled : ""
                  }`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>

                <div className={styles.pageNumbers}>
                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        className={`${styles.pageButton} ${
                          currentPage === page ? styles.active : ""
                        }`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                <button
                  className={`${styles.pageButton} ${
                    currentPage === totalPages ? styles.disabled : ""
                  }`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default ActivityList;