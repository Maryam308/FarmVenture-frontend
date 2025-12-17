const signup = async (formData) => {
  try {
    const dataToSend = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
    };

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      }
    );

    const json = await res.json();
    if (json.err) {
      throw new Error(json.err);
    }
    return json;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const signin = async (user) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    const json = await res.json();

    if (json.error) {
      throw new Error(json.error);
    }

    if (json.token) {
      window.localStorage.setItem("token", json.token);

      // Decode the token to get user info
      const payload = JSON.parse(atob(json.token.split(".")[1]));

      return {
        id: payload.sub || payload.user_id || payload.id,
        sub: payload.sub,
        user_id: payload.user_id,
        email: payload.email,
        username: payload.username,
        role: payload.role,
        ...payload,
      };
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const getUser = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    // Decode the JWT token
    const payload = JSON.parse(atob(token.split(".")[1]));

    // Extract and map user information
    return {
      id: payload.sub || payload.user_id || payload.id,

      sub: payload.sub,
      user_id: payload.user_id,
      email: payload.email,
      username: payload.username,
      role: payload.role,
      ...payload,
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

const signout = () => {
  localStorage.removeItem("token");
};

export { signup, signin, getUser, signout };
