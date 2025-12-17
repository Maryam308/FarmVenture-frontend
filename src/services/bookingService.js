const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/bookings`;

// Create a new booking (CUSTOMER ONLY)
const createBooking = async (activityId, ticketsNumber = 1) => {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        activity_id: activityId,
        tickets_number: ticketsNumber,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to create booking");
    }

    return res.json();
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

// Get current user's bookings (CUSTOMER VIEW)
const getMyBookings = async (statusFilter = null) => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (statusFilter) params.append("status_filter", statusFilter);

    const queryString = params.toString();
    const url = queryString
      ? `${BASE_URL}/my?${queryString}`
      : `${BASE_URL}/my`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to fetch bookings");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    throw error;
  }
};

// Get all bookings (ADMIN ONLY)
const getAllBookingsAdmin = async (filters = {}) => {
  try {
    // Build query parameters from filters
    const params = new URLSearchParams();
    if (filters.userId) params.append("user_id", filters.userId);
    if (filters.activityId) params.append("activity_id", filters.activityId);
    if (filters.statusFilter)
      params.append("status_filter", filters.statusFilter);

    const queryString = params.toString();
    const url = queryString
      ? `${BASE_URL}/admin/all?${queryString}`
      : `${BASE_URL}/admin/all`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to fetch admin bookings");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching admin bookings:", error);
    throw error;
  }
};

// Get specific booking by ID
const getBookingById = async (bookingId) => {
  try {
    const res = await fetch(`${BASE_URL}/${bookingId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to fetch booking");
    }

    return res.json();
  } catch (error) {
    console.error(`Error fetching booking ${bookingId}:`, error);
    throw error;
  }
};

// Update booking (e.g., change number of tickets)
const updateBooking = async (bookingId, updateData) => {
  try {
    const res = await fetch(`${BASE_URL}/${bookingId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to update booking");
    }

    return res.json();
  } catch (error) {
    console.error(`Error updating booking ${bookingId}:`, error);
    throw error;
  }
};

// Cancel/delete booking
const cancelBooking = async (bookingId) => {
  try {
    const res = await fetch(`${BASE_URL}/${bookingId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to cancel booking");
    }

    return res.json();
  } catch (error) {
    console.error(`Error canceling booking ${bookingId}:`, error);
    throw error;
  }
};

// Get booking statistics (ADMIN ONLY)
const getBookingStatsAdmin = async () => {
  try {
    const res = await fetch(`${BASE_URL}/stats/admin`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to fetch booking statistics");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching booking statistics:", error);
    throw error;
  }
};

// Helper function to check if user can book an activity
const checkBookingAvailability = async (activityId, ticketsNumber = 1) => {
  try {
    // Get activity details first
    const activitiesRes = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/activities/${activityId}`
    );

    if (!activitiesRes.ok) {
      throw new Error("Activity not found");
    }

    const activity = await activitiesRes.json();

    // Check if activity is active
    if (!activity.is_active) {
      return {
        available: false,
        message: "This activity is currently inactive",
      };
    }

    // Check if activity is in the past
    const activityDate = new Date(activity.date_time);
    const now = new Date();
    if (activityDate < now) {
      return {
        available: false,
        message: "Cannot book past activities",
      };
    }

    // Check capacity
    const spotsLeft = activity.max_capacity - activity.current_capacity;
    if (spotsLeft < ticketsNumber) {
      return {
        available: false,
        message: `Only ${spotsLeft} spot${
          spotsLeft !== 1 ? "s" : ""
        } available`,
      };
    }

    // Check if user already booked this activity
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const myBookings = await getMyBookings();
        const alreadyBooked = myBookings.some(
          (booking) => booking.activity_id === activityId
        );
        if (alreadyBooked) {
          return {
            available: false,
            message: "You have already booked this activity",
          };
        }
      } catch (err) {
        // If error fetching bookings, continue (user might not be logged in)
        console.log("Could not check existing bookings:", err.message);
      }
    }

    return {
      available: true,
      spotsLeft: spotsLeft,
      activity: activity,
    };
  } catch (error) {
    console.error("Error checking booking availability:", error);
    return {
      available: false,
      message: error.message || "Unable to check availability",
    };
  }
};

// Format booking status for display
const formatBookingStatus = (status) => {
  const statusMap = {
    upcoming: { text: "Upcoming", color: "blue", emoji: "📅" },
    today: { text: "Today", color: "green", emoji: "🎯" },
    past: { text: "Past", color: "gray", emoji: "✅" },
  };

  return statusMap[status] || { text: status, color: "gray", emoji: "❓" };
};

// Calculate total price for booking
const calculateBookingTotal = (activityPrice, ticketsNumber) => {
  const total = parseFloat(activityPrice) * ticketsNumber;
  return `BHD${total.toFixed(2)}`;
};

export {
  createBooking,
  getMyBookings,
  getAllBookingsAdmin,
  getBookingById,
  updateBooking,
  cancelBooking,
  getBookingStatsAdmin,
  checkBookingAvailability,
  formatBookingStatus,
  calculateBookingTotal,
};
