import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import NavBar from "./components/NavBar/NavBar";
import Landing from "./components/Landing/Landing";
import Dashboard from "./components/Dashboard/Dashboard";
import SignupForm from "./components/SignupForm/SignupForm";
import SigninForm from "./components/SigninForm/SigninForm";

import ActivityList from "./components/ActivityList/ActivityList";
import * as authService from "../src/services/authService";

import * as activityService from "./services/activitiesService";

const App = () => {
  const [user, setUser] = useState(authService.getUser());

  const [activities, setActivities] = useState([]);

  const navigate = useNavigate();

  const handleSignout = () => {
    authService.signout();
    setUser(null);
  };

  useEffect(() => {
    const getActivities = async () => {
      try {
        const activityData = await activityService.index();
        setActivities(activityData);
      } catch (error) {
        console.error("Error fetching activities:", error);
      }
    };

    if (user) {
      getActivities();
    }
  }, [user]);

  return (
    <>
      <NavBar user={user} handleSignout={handleSignout} />
      <Routes>
        {user ? (
          <>
            <Route path="/" element={<Dashboard user={user} />} />

            <Route
              path="/activities"
              element={<ActivityList activities={activities} />}
            />
          </>
        ) : (
          <Route path="/" element={<Landing />} />
        )}
        <Route path="/signup" element={<SignupForm setUser={setUser} />} />
        <Route path="/signin" element={<SigninForm setUser={setUser} />} />
      </Routes>
    </>
  );
};

export default App;
