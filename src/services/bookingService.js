const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/bookings`;

// Create a new booking (CUSTOMER ONLY)
const createBooking = async (activityId, ticketsNumber = 1) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Please log in to book activities");
    }

    // Ensure activityId and ticketsNumber are numbers
    const bookingPayload = {
      activity_id: parseInt(activityId),
      tickets_number: parseInt(ticketsNumber),
    };

    console.log("Creating booking with:", bookingPayload);

    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingPayload),
    });

    console.log("Response status:", res.status);

    // Try to parse the response
    let responseData;
    try {
      responseData = await res.json();
    } catch (parseError) {
      console.error("Could not parse response as JSON:", parseError);
      throw new Error(`HTTP ${res.status}: Failed to create booking`);
    }

    if (!res.ok) {
      console.error("Booking failed with:", responseData);
      throw new Error(
        responseData.detail || `HTTP ${res.status}: Failed to create booking`
      );
    }

    console.log("Booking created successfully:", responseData);
    return responseData;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

const getMyBookings = async (statusFilter = null) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (statusFilter) params.append("status_filter", statusFilter);

    const queryString = params.toString();
    const url = queryString
      ? `${BASE_URL}/my?${queryString}`
      : `${BASE_URL}/my`;

    console.log("Fetching bookings from:", url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ detail: "Failed to fetch bookings" }));
      throw new Error(
        errorData.detail || `HTTP ${res.status}: Failed to fetch bookings`
      );
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    throw error;
  }
};
const getAllForUser = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Please log in to view bookings");
    }

    const res = await fetch(`${BASE_URL}/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ detail: "Failed to fetch bookings" }));
      throw new Error(
        errorData.detail || `HTTP ${res.status}: Failed to fetch bookings`
      );
    }

    return await res.json();
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
    // Ensure tickets_number is a number if present
    const payload = { ...updateData };
    if (payload.tickets_number) {
      payload.tickets_number = parseInt(payload.tickets_number);
    }

    const res = await fetch(`${BASE_URL}/${bookingId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
    console.log(
      `Checking availability for activity ${activityId}, tickets: ${ticketsNumber}`
    );

    // Get activity details - USE THE CORRECT API ENDPOINT
    const activitiesRes = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/activities/${activityId}`
    );

    if (!activitiesRes.ok) {
      const errorData = await activitiesRes
        .json()
        .catch(() => ({ detail: "Activity not found" }));
      throw new Error(errorData.detail || "Activity not found");
    }

    const activity = await activitiesRes.json();
    console.log("Activity data received:", activity);

    // Basic validation checks
    const now = new Date();
    const activityDate = new Date(activity.date_time);

    // Check if activity is in the past
    if (activityDate < now) {
      return {
        available: false,
        message: "Cannot book past activities",
      };
    }

    // Check capacity
    const spotsLeft = activity.max_capacity - activity.current_capacity;
    console.log(
      `Spots left: ${spotsLeft}, Tickets requested: ${ticketsNumber}`
    );

    if (spotsLeft <= 0) {
      return {
        available: false,
        message: "This activity is sold out",
      };
    }

    if (ticketsNumber > spotsLeft) {
      return {
        available: false,
        message: `Only ${spotsLeft} spot${
          spotsLeft !== 1 ? "s" : ""
        } available`,
      };
    }

    // Check if user is logged in - if not, they can still check availability
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Check if user already booked this activity using the booking service
        const response = await fetch(
          `${BASE_URL}/availability/${activityId}?tickets_number=${ticketsNumber}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const availabilityData = await response.json();
          return availabilityData;
        }
      } catch (err) {
        console.log("Note: Could not check booking duplication:", err.message);
        // Continue with basic availability check
      }
    }

    // Return basic availability if we couldn't check for duplicate bookings
    return {
      available: true,
      spots_left: spotsLeft,
      message: `${spotsLeft === 1 ? "1 spot" : `${spotsLeft} spots`} available`,
      activity: {
        id: activity.id,
        title: activity.title,
        date_time: activity.date_time,
        price: parseFloat(activity.price) || 0,
        max_capacity: activity.max_capacity,
        current_capacity: activity.current_capacity,
      },
    };
  } catch (error) {
    console.error("Error checking booking availability:", error);
    return {
      available: false,
      message:
        error.message || "Unable to check availability. Please try again.",
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
  getAllForUser,
};
