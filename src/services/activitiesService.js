const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/activities`;

// Get all activities (public - no auth needed for GET)
const index = async (upcomingOnly = true, search = null) => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append("upcoming_only", upcomingOnly);
    if (search) params.append("search", search);

    const queryString = params.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

    const res = await fetch(url);
    return res.json();
  } catch (error) {
    console.error("Error fetching activities:", error);
    throw error;
  }
};

// Get single activity by ID (public - no auth needed for GET)
const show = async (activityId) => {
  try {
    const res = await fetch(`${BASE_URL}/${activityId}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to fetch activity");
    }
    return res.json();
  } catch (error) {
    console.error(`Error fetching activity ${activityId}:`, error);
    throw error;
  }
};

// Create new activity (ADMIN ONLY - requires token)
const create = async (activityFormData) => {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activityFormData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to create activity");
    }

    return res.json();
  } catch (error) {
    console.error("Error creating activity:", error);
    throw error;
  }
};

// Update activity (ADMIN ONLY - requires token)
const update = async (activityId, activityFormData) => {
  try {
    const res = await fetch(`${BASE_URL}/${activityId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activityFormData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to update activity");
    }

    return res.json();
  } catch (error) {
    console.error(`Error updating activity ${activityId}:`, error);
    throw error;
  }
};

// Delete/Deactivate activity (ADMIN ONLY - soft delete)
const remove = async (activityId) => {
  try {
    const res = await fetch(`${BASE_URL}/${activityId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to delete activity");
    }

    return res.json();
  } catch (error) {
    console.error(`Error deleting activity ${activityId}:`, error);
    throw error;
  }
};

// Toggle activity status active/inactive (ADMIN ONLY)
const toggleStatus = async (activityId) => {
  try {
    const res = await fetch(`${BASE_URL}/${activityId}/toggle`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to toggle activity status");
    }

    return res.json();
  } catch (error) {
    console.error(`Error toggling activity ${activityId}:`, error);
    throw error;
  }
};

export { index, show, create, update, remove, toggleStatus };
