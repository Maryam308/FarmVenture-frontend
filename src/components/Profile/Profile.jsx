// src/components/Profile/Profile.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as productService from "../../services/productService";
import * as favoriteService from "../../services/favoriteService";
import * as bookingService from "../../services/bookingService";
import styles from "./Profile.module.css";
import PopupAlert from "../PopupAlert/PopupAlert";

const Profile = ({ user }) => {
  // Main tab state
  const [activeTab, setActiveTab] = useState(
    user?.role === "admin" ? "bookings" : "favorites"
  );

  // Sub-filter states
  const [favoriteFilter, setFavoriteFilter] = useState("all"); // 'all', 'products', 'activities'

  // Data states
  const [userProducts, setUserProducts] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [favoriteActivities, setFavoriteActivities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");

  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // MAIN DATA FETCH - runs once on mount and when user changes
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (user.role === "admin") {
          // Admin: fetch bookings only

          await fetchBookings();
        } else if (user.role === "customer") {
          // Customer: fetch favorites

          const allFavorites = await favoriteService.getFavorites();

          const products = [];
          const activities = [];

          allFavorites.forEach((fav, index) => {
            if (fav.item_type === "product" && fav.item) {
              products.push({
                ...fav.item,
                favorite_id: fav.id,
                favorited_at: fav.created_at,
              });
            } else if (fav.item_type === "activity" && fav.item) {
              activities.push({
                ...fav.item,
                favorite_id: fav.id,
                favorited_at: fav.created_at,
              });
            }
          });

          setFavoriteProducts(products);
          setFavoriteActivities(activities);

          // Fetch bookings for customer
          await fetchBookings();
        }
      } catch (error) {
        setError(error.message || "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.sub, user?.role]);

  // Fetch bookings function
  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoadingBookings(true);

      let bookingsData = [];

      if (user.role === "admin") {
        // Admin: fetch all bookings
        bookingsData = await bookingService.getAllBookingsAdmin();
      } else {
        // Customer: fetch only their bookings
        bookingsData = await bookingService.getMyBookings();
      }

      setBookings(bookingsData || []);
    } catch (error) {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Listen for favorite updates - only for customers
  useEffect(() => {
    if (!user || user.role !== "customer") return;

    const handleFavoriteUpdate = async () => {
      try {
        const allFavorites = await favoriteService.getFavorites();

        const products = [];
        const activities = [];

        allFavorites.forEach((fav) => {
          if (fav.item_type === "product" && fav.item) {
            products.push({
              ...fav.item,
              favorite_id: fav.id,
              favorited_at: fav.created_at,
            });
          } else if (fav.item_type === "activity" && fav.item) {
            activities.push({
              ...fav.item,
              favorite_id: fav.id,
              favorited_at: fav.created_at,
            });
          }
        });

        setFavoriteProducts(products);
        setFavoriteActivities(activities);
      } catch (error) {}
    };

    window.addEventListener("favoriteUpdated", handleFavoriteUpdate);
    window.addEventListener("storage", handleFavoriteUpdate);

    return () => {
      window.removeEventListener("favoriteUpdated", handleFavoriteUpdate);
      window.removeEventListener("storage", handleFavoriteUpdate);
    };
  }, [user?.sub, user?.role]);

  // Listen for booking updates
  useEffect(() => {
    if (!user) return;

    const handleBookingUpdate = () => {
      fetchBookings();
    };

    window.addEventListener("bookingCreated", handleBookingUpdate);
    window.addEventListener("bookingCancelled", handleBookingUpdate);

    return () => {
      window.removeEventListener("bookingCreated", handleBookingUpdate);
      window.removeEventListener("bookingCancelled", handleBookingUpdate);
    };
  }, [user]);

  // Filter bookings based on status
  const filteredBookings = (bookings || []).filter((booking) => {
    if (bookingStatusFilter === "all") return true;
    return booking.status === bookingStatusFilter;
  });

  // Get favorites based on filter
  const getFilteredFavorites = () => {
    if (favoriteFilter === "products") return favoriteProducts;
    if (favoriteFilter === "activities") return favoriteActivities;
    // 'all' - combine both
    return [...favoriteProducts, ...favoriteActivities];
  };

  // Handle favorite toggle for Profile
  const handleFavoriteToggle = async (itemId, itemType, isFavorited) => {
    if (!user || user.role !== "customer") return;

    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(itemId, itemType);
      } else {
        await favoriteService.addFavorite(itemId, itemType);
      }

      localStorage.setItem("favorites_updated", Date.now().toString());
      window.dispatchEvent(new Event("favoriteUpdated"));
    } catch (error) {}
  };

  // Handle cancel booking click
  const handleCancelBookingClick = (bookingId) => {
    setSelectedBookingId(bookingId);
    setPopupMessage("Are you sure you want to cancel this booking?");
    setShowCancelPopup(true);
  };

  // Handle cancel booking confirmation
  const handleCancelBookingConfirm = async () => {
    if (!selectedBookingId) return;

    try {
      setCancelling(true);
      await bookingService.cancelBooking(selectedBookingId);
      setPopupMessage("Booking cancelled successfully!");
      setShowSuccessPopup(true);

      // Refresh bookings after success
      fetchBookings();

      // Clear selected booking
      setSelectedBookingId(null);
    } catch (error) {
      setPopupMessage(error.message || "Failed to cancel booking");
      setShowErrorPopup(true);
    } finally {
      setCancelling(false);
    }
  };

  // Format booking status for display
  const formatBookingStatus = (status) => {
    const statusMap = {
      upcoming: { text: "Upcoming", className: styles.upcoming },
      today: { text: "Today", className: styles.today },
      past: { text: "Past", className: styles.past },
    };

    const statusInfo = statusMap[status] || {
      text: status,
      className: styles.default,
    };
    return (
      <span className={`${styles.statusBadge} ${statusInfo.className}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (!user) {
    return (
      <main className={styles.container}>
        <div className={styles.errorState}>
          <h2>Please Sign In</h2>
          <p>You need to be signed in to view your profile.</p>
          <Link to="/signin" className={styles.browseButton}>
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  const filteredFavorites = getFilteredFavorites();

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
      <section className={styles.profileHeader}>
        <h1>My Profile</h1>
        <div className={styles.userInfo}>
          <h2>{user.username || user.email || "User"}</h2>
          <p>{user.email}</p>
          <span
            className={`${styles.role} ${
              user.role === "admin" ? styles.admin : styles.customer
            }`}
          >
            {user.role?.toUpperCase() || "USER"}
          </span>
        </div>
      </section>

      {error && (
        <div className={styles.errorMessage}>
          <p>⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      )}

      <section className={styles.tabsSection}>
        {/* Main Tabs */}
        <div className={styles.tabNav}>
          {user?.role === "admin" ? (
            // Admin: Only Bookings Management tab
            <button
              className={`${styles.tabButton} ${
                activeTab === "bookings" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("bookings")}
            >
              Bookings Management
            </button>
          ) : (
            // Customer: Favorites and Booked Activities tabs
            <>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "favorites" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("favorites")}
              >
                Favorites
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "bookings" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("bookings")}
              >
                Booked Activities
              </button>
            </>
          )}
        </div>

        {/* ADMIN VIEW - Only Bookings */}
        {user?.role === "admin" && (
          <div className={styles.bookingsSection}>
            <div className={styles.sectionHeader}>
              <h2>All Bookings Management</h2>
              <div className={styles.bookingsStats}>
                <span className={styles.statTotal}>
                  {(bookings || []).length} Total Bookings
                </span>
                <span className={styles.statUpcoming}>
                  {
                    (bookings || []).filter((b) => b.status === "upcoming")
                      .length
                  }{" "}
                  Upcoming
                </span>
                <span className={styles.statToday}>
                  {(bookings || []).filter((b) => b.status === "today").length}{" "}
                  Today
                </span>
                <span className={styles.statPast}>
                  {(bookings || []).filter((b) => b.status === "past").length}{" "}
                  Past
                </span>
              </div>
            </div>

            <div className={styles.filterControls}>
              <div className={styles.filterGroup}>
                <label
                  htmlFor="bookingStatusFilter"
                  className={styles.filterLabel}
                >
                  Filter by Status:
                </label>
                <select
                  id="bookingStatusFilter"
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Bookings</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="today">Today</option>
                  <option value="past">Past</option>
                </select>
              </div>
              <div className={styles.adminNote}>
                <p>
                  📊 As an admin, you can view and manage all customer bookings.
                </p>
              </div>
            </div>

            {loadingBookings ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🎫</div>
                <p>
                  {bookingStatusFilter === "all"
                    ? "No bookings found in the system."
                    : `No ${bookingStatusFilter} bookings found.`}
                </p>
              </div>
            ) : (
              <div className={styles.bookingsGrid}>
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className={styles.bookingCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.bookingId}>
                        Booking #{booking.id}
                      </span>
                      {formatBookingStatus(booking.status)}
                      <span className={styles.customerInfo}>
                        Customer: {booking.user?.username || "Unknown"}
                      </span>
                    </div>

                    <div className={styles.cardContent}>
                      <h3>{booking.activity?.title || "Activity not found"}</h3>

                      <div className={styles.bookingDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Date:</span>
                          <span className={styles.detailValue}>
                            {booking.activity?.date_time
                              ? new Date(
                                  booking.activity.date_time
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Time:</span>
                          <span className={styles.detailValue}>
                            {booking.activity?.date_time
                              ? new Date(
                                  booking.activity.date_time
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Tickets:</span>
                          <span className={styles.detailValue}>
                            {booking.tickets_number}
                          </span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>
                            Price per ticket:
                          </span>
                          <span className={styles.detailValue}>
                            BHD{(booking.activity?.price || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Total:</span>
                          <span className={styles.detailValue}>
                            <strong>
                              BHD
                              {(
                                (booking.activity?.price || 0) *
                                booking.tickets_number
                              ).toFixed(2)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className={styles.bookedInfo}>
                        <span className={styles.bookedAt}>
                          Booked on:{" "}
                          {new Date(booking.booked_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      {booking.activity && (
                        <Link
                          to={`/activities/${booking.activity.id}`}
                          className={styles.viewButton}
                        >
                          View Activity
                        </Link>
                      )}
                      <Link
                        to={`/bookings/${booking.id}`}
                        className={styles.detailsButton}
                      >
                        Booking Details
                      </Link>
                      {booking.status === "upcoming" && (
                        <button
                          onClick={() => handleCancelBookingClick(booking.id)}
                          className={styles.cancelButton}
                        >
                          Cancel as Admin
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CUSTOMER VIEW */}
        {user?.role === "customer" && (
          <>
            {/* Favorites Tab */}
            {activeTab === "favorites" && (
              <div className={styles.favoritesSection}>
                <div className={styles.sectionHeader}>
                  <h2>My Favorites</h2>
                  <div className={styles.favoritesStats}>
                    <span className={styles.statCount}>
                      {favoriteProducts.length + favoriteActivities.length}{" "}
                      Total
                    </span>
                    <span className={styles.statProducts}>
                      {favoriteProducts.length} Products
                    </span>
                    <span className={styles.statActivities}>
                      {favoriteActivities.length} Activities
                    </span>
                  </div>
                </div>

                {/* Sub-filter for favorites */}
                <div className={styles.subFilterControls}>
                  <div className={styles.filterGroup}>
                    <label
                      htmlFor="favoriteFilter"
                      className={styles.filterLabel}
                    >
                      Show:
                    </label>
                    <select
                      id="favoriteFilter"
                      value={favoriteFilter}
                      onChange={(e) => setFavoriteFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Favorites</option>
                      <option value="products">Products Only</option>
                      <option value="activities">Activities Only</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading favorites...</p>
                  </div>
                ) : filteredFavorites.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>❤️</div>
                    <p>
                      {favoriteFilter === "all"
                        ? "You haven't favorited anything yet."
                        : favoriteFilter === "products"
                        ? "You haven't favorited any products yet."
                        : "You haven't favorited any activities yet."}
                    </p>
                    <p className={styles.helperText}>
                      Browse{" "}
                      {favoriteFilter === "activities"
                        ? "activities"
                        : "products"}{" "}
                      and click the heart icon to add them to favorites.
                    </p>
                    <div className={styles.buttonGroup}>
                      <Link to="/products" className={styles.browseButton}>
                        Browse Products
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className={styles.favoritesGrid}>
                    {filteredFavorites.map((item) => {
                      const isProduct = item.name !== undefined; // Products have 'name', activities have 'title'
                      const itemType = isProduct ? "product" : "activity";

                      return (
                        <div
                          key={`${itemType}-${item.id}`}
                          className={styles.favoriteCard}
                        >
                          <div className={styles.cardHeader}>
                            <span className={styles.typeBadge}>
                              {isProduct ? "Product" : "Activity"}
                            </span>
                            <button
                              className={styles.favoriteButton}
                              onClick={() =>
                                handleFavoriteToggle(item.id, itemType, true)
                              }
                              aria-label="Remove from favorites"
                            ></button>
                          </div>
                          <div className={styles.cardContent}>
                            <h3>
                              {isProduct
                                ? item.name || "Untitled Product"
                                : item.title || "Untitled Activity"}
                            </h3>
                            <p className={styles.price}>
                              ${item.price?.toFixed(2) || "0.00"}
                              {!isProduct && " per person"}
                            </p>
                            {isProduct ? (
                              <p className={styles.category}>
                                {item.category || "Uncategorized"}
                              </p>
                            ) : (
                              <>
                                <p className={styles.activityDate}>
                                  📅{" "}
                                  {new Date(
                                    item.date_time
                                  ).toLocaleDateString()}
                                </p>
                                <p className={styles.activityDuration}>
                                  ⏱️ {item.duration_minutes} minutes
                                </p>
                              </>
                            )}
                            <p className={styles.description}>
                              {item.description || "No description available."}
                            </p>
                          </div>
                          <div className={styles.cardFooter}>
                            <span className={styles.owner}>
                              By: {item.user?.username || "Unknown"}
                            </span>
                            <span
                              className={`${styles.status} ${
                                item.is_active ? styles.active : styles.inactive
                              }`}
                            >
                              {item.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <Link
                            to={
                              isProduct
                                ? `/products/${item.id}`
                                : `/activities/${item.id}`
                            }
                            className={styles.viewButton}
                          >
                            View {isProduct ? "Product" : "Activity"}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Booked Activities Tab */}
            {activeTab === "bookings" && (
              <div className={styles.bookingsSection}>
                <div className={styles.sectionHeader}>
                  <h2>My Booked Activities</h2>
                  <div className={styles.bookingsStats}>
                    <span className={styles.statTotal}>
                      {(bookings || []).length} Total Bookings
                    </span>
                    <span className={styles.statUpcoming}>
                      {
                        (bookings || []).filter((b) => b.status === "upcoming")
                          .length
                      }{" "}
                      Upcoming
                    </span>
                    <span className={styles.statToday}>
                      {
                        (bookings || []).filter((b) => b.status === "today")
                          .length
                      }{" "}
                      Today
                    </span>
                    <span className={styles.statPast}>
                      {
                        (bookings || []).filter((b) => b.status === "past")
                          .length
                      }{" "}
                      Past
                    </span>
                  </div>
                </div>

                <div className={styles.filterControls}>
                  <div className={styles.filterGroup}>
                    <label
                      htmlFor="bookingStatusFilter"
                      className={styles.filterLabel}
                    >
                      Filter by Status:
                    </label>
                    <select
                      id="bookingStatusFilter"
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Bookings</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="today">Today</option>
                      <option value="past">Past</option>
                    </select>
                  </div>
                </div>

                {loadingBookings ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading bookings...</p>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🎫</div>
                    <p>
                      {bookingStatusFilter === "all"
                        ? "You haven't booked any activities yet."
                        : `You don't have any ${bookingStatusFilter} bookings.`}
                    </p>
                    <p className={styles.helperText}>
                      Explore farm activities and book your spot!
                    </p>
                    <Link to="/activities" className={styles.browseButton}>
                      Browse Activities
                    </Link>
                  </div>
                ) : (
                  <div className={styles.bookingsGrid}>
                    {filteredBookings.map((booking) => (
                      <div key={booking.id} className={styles.bookingCard}>
                        <div className={styles.cardHeader}>
                          <span className={styles.bookingId}>
                            Booking #{booking.id}
                          </span>
                          {formatBookingStatus(booking.status)}
                        </div>

                        <div className={styles.cardContent}>
                          <h3>
                            {booking.activity?.title || "Activity not found"}
                          </h3>

                          <div className={styles.bookingDetails}>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Date:</span>
                              <span className={styles.detailValue}>
                                {booking.activity?.date_time
                                  ? new Date(
                                      booking.activity.date_time
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Time:</span>
                              <span className={styles.detailValue}>
                                {booking.activity?.date_time
                                  ? new Date(
                                      booking.activity.date_time
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "N/A"}
                              </span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>
                                Tickets:
                              </span>
                              <span className={styles.detailValue}>
                                {booking.tickets_number}
                              </span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>
                                Price per ticket:
                              </span>
                              <span className={styles.detailValue}>
                                BHD{(booking.activity?.price || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Total:</span>
                              <span className={styles.detailValue}>
                                <strong>
                                  BHD
                                  {(
                                    (booking.activity?.price || 0) *
                                    booking.tickets_number
                                  ).toFixed(2)}
                                </strong>
                              </span>
                            </div>
                          </div>

                          <div className={styles.bookedInfo}>
                            <span className={styles.bookedAt}>
                              Booked on:{" "}
                              {new Date(booking.booked_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className={styles.cardFooter}>
                          {booking.activity && (
                            <Link
                              to={`/activities/${booking.activity.id}`}
                              className={styles.viewButton}
                            >
                              View Activity
                            </Link>
                          )}
                          <Link
                            to={`/bookings/${booking.id}`}
                            className={styles.detailsButton}
                          >
                            Booking Details
                          </Link>
                          {booking.status === "upcoming" && (
                            <button
                              onClick={() =>
                                handleCancelBookingClick(booking.id)
                              }
                              className={styles.cancelButton}
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default Profile;
