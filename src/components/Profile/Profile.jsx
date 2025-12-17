import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import * as productService from "../../services/productService";
import * as favoriteService from "../../services/favoriteService";
import * as bookingService from "../../services/bookingService";
import styles from "./Profile.module.css";

const Profile = ({ user }) => {
  // Main tab state - default based on role
  const [activeTab, setActiveTab] = useState(
    user?.role === "admin" ? "bookings" : "products"
  );

  // Data states
  const [userProducts, setUserProducts] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [favoriteActivities, setFavoriteActivities] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("active"); // For admin products
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [favoriteFilter, setFavoriteFilter] = useState("all");

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!user || user.role === "admin") return;

    try {
      setLoadingFavorites(true);
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
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setFavoriteProducts([]);
      setFavoriteActivities([]);
    } finally {
      setLoadingFavorites(false);
    }
  }, [user]);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingBookings(true);
      let bookingsData = [];

      if (user.role === "admin") {
        bookingsData = await bookingService.getAllBookingsAdmin();
      } else {
        bookingsData = await bookingService.getMyBookings();
      }

      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [user]);

  // Initial data fetch
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
          // Admin: fetch all products
          const allProducts = await productService.getAllProductsAdmin(true);
          setUserProducts(allProducts);

          // Fetch all bookings
          await fetchBookings();
        } else {
          // Customer: fetch user's products
          const userId = user.id || user._id || user.userId;
          if (!userId) {
            throw new Error("User ID not found");
          }

          const allUserProducts = await productService.getAllUserProducts(
            userId
          );
          setUserProducts(allUserProducts);

          // Fetch favorites and bookings
          await Promise.all([fetchFavorites(), fetchBookings()]);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setError(error.message || "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, fetchFavorites, fetchBookings]);

  // Listen for favorite updates
  useEffect(() => {
    if (!user || user.role === "admin") return;

    const handleFavoriteUpdate = () => {
      fetchFavorites();
    };

    window.addEventListener("favoriteUpdated", handleFavoriteUpdate);
    return () => {
      window.removeEventListener("favoriteUpdated", handleFavoriteUpdate);
    };
  }, [user, fetchFavorites]);

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
  }, [user, fetchBookings]);

  // Handle favorite toggle
  const handleFavoriteToggle = async (itemId, itemType, isFavorited) => {
    if (!user || user.role === "admin") return;

    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(itemId, itemType);
      } else {
        await favoriteService.addFavorite(itemId, itemType);
      }

      window.dispatchEvent(new Event("favoriteUpdated"));
      await fetchFavorites();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Handle cancel booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      await bookingService.cancelBooking(bookingId);
      alert("Booking cancelled successfully!");
      window.dispatchEvent(new Event("bookingCancelled"));
      await fetchBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert(error.message || "Failed to cancel booking");
    }
  };

  // Format booking status
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

  // Filter products (admin)
  const filteredProducts = userProducts.filter((product) => {
    if (statusFilter === "active") return product.is_active;
    if (statusFilter === "inactive") return !product.is_active;
    return true;
  });

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    if (bookingStatusFilter === "all") return true;
    return booking.status === bookingStatusFilter;
  });

  // Filter favorites (customer)
  const filteredFavorites = (() => {
    if (favoriteFilter === "products") return favoriteProducts;
    if (favoriteFilter === "activities") return favoriteActivities;
    return [...favoriteProducts, ...favoriteActivities];
  })();

  // Stats
  const activeCount = userProducts.filter((p) => p.is_active).length;
  const inactiveCount = userProducts.filter((p) => !p.is_active).length;
  const totalCount = userProducts.length;

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

  return (
    <main className={styles.container}>
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
        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          {user.role === "admin" ? (
            // Admin tabs: Products + Bookings
            <>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "products" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("products")}
              >
                Products Management
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "bookings" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("bookings")}
              >
                Bookings Management
              </button>
            </>
          ) : (
            // Customer tabs: Products + Bookings
            <>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "products" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("products")}
              >
                My Products
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "bookings" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("bookings")}
              >
                My Bookings
              </button>
            </>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "products" && (
          <div className={styles.productsSection}>
            <div className={styles.sectionHeader}>
              <h2>
                {user.role === "admin"
                  ? "All Products Management"
                  : "My Products"}
              </h2>
              <div className={styles.productStats}>
                <span className={styles.statActive}>{activeCount} Active</span>
                <span className={styles.statInactive}>
                  {inactiveCount} Inactive
                </span>
                <span className={styles.statTotal}>{totalCount} Total</span>
              </div>
            </div>

            <div className={styles.filterControls}>
              <div className={styles.filterGroup}>
                <label htmlFor="statusFilter" className={styles.filterLabel}>
                  Filter by Status:
                </label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="all">All Products</option>
                </select>
              </div>
              {user.role === "admin" && (
                <div className={styles.adminNote}>
                  <p>
                    💼 As an admin, you can manage all products on the platform.
                  </p>
                </div>
              )}
            </div>

            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📦</div>
                <p>
                  {statusFilter === "all"
                    ? "No products found."
                    : statusFilter === "active"
                    ? "No active products found."
                    : "No inactive products found."}
                </p>
                <Link to="/products/new" className={styles.addButton}>
                  Create First Product
                </Link>
              </div>
            ) : (
              <div className={styles.productsGrid}>
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className={styles.productCard}
                  >
                    <div className={styles.imageContainer}>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className={styles.productImage}
                        />
                      ) : (
                        <div className={styles.noImagePlaceholder}>
                          <span>🌱</span>
                          <p>No Image</p>
                        </div>
                      )}
                      {!product.is_active && (
                        <div className={styles.inactiveBadge}>INACTIVE</div>
                      )}
                    </div>
                    <div className={styles.productInfo}>
                      <h3>{product.name}</h3>
                      <p className={styles.price}>
                        ${product.price.toFixed(2)}
                      </p>
                      <p className={styles.category}>{product.category}</p>
                      {user.role === "admin" && (
                        <div className={styles.ownerInfo}>
                          <p className={styles.owner}>
                            Owner: {product.user?.username || "Unknown"}
                          </p>
                        </div>
                      )}
                      <span
                        className={`${styles.status} ${
                          product.is_active ? styles.active : styles.inactive
                        }`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className={styles.bookingsSection}>
            <div className={styles.sectionHeader}>
              <h2>
                {user.role === "admin"
                  ? "All Bookings Management"
                  : "My Bookings"}
              </h2>
              <div className={styles.bookingsStats}>
                <span className={styles.statTotal}>
                  {bookings.length} Total
                </span>
                <span className={styles.statUpcoming}>
                  {bookings.filter((b) => b.status === "upcoming").length}{" "}
                  Upcoming
                </span>
                <span className={styles.statToday}>
                  {bookings.filter((b) => b.status === "today").length} Today
                </span>
                <span className={styles.statPast}>
                  {bookings.filter((b) => b.status === "past").length} Past
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
              {user.role === "admin" && (
                <div className={styles.adminNote}>
                  <p>📊 As an admin, you can view and manage all bookings.</p>
                </div>
              )}
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
                    ? "No bookings found."
                    : `No ${bookingStatusFilter} bookings found.`}
                </p>
                <p className={styles.helperText}>
                  {user.role === "admin"
                    ? "Customer bookings will appear here."
                    : "Explore farm activities and book your spot!"}
                </p>
                {user.role !== "admin" && (
                  <Link to="/activities" className={styles.browseButton}>
                    Browse Activities
                  </Link>
                )}
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
                      {user.role === "admin" && (
                        <span className={styles.customerInfo}>
                          Customer: {booking.user?.username || "Unknown"}
                        </span>
                      )}
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
                        Details
                      </Link>
                      {booking.status === "upcoming" && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className={styles.cancelButton}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default Profile;
