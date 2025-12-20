import { Link } from "react-router-dom";
import HeroSection from "../HeroSection/HeroSection";
import styles from "./Dashboard.module.css";

const Dashboard = ({ user }) => {
  return (
    <div className={styles.container}>
      <HeroSection title="FarmVenture" />
      
      <div className={styles.contentSection}>
        <div className={styles.welcomeCard}>
          <h2>About Us:</h2>
          <p>Welcome back, {user.username}! You are logged in as a {user.role}.</p>
        </div>

        <div className={styles.quickActions}>
          <h2>Quick Access</h2>
          <div className={styles.actionsGrid}>
            <Link to="/products" className={styles.actionCard}>
              <div className={styles.actionPlaceholder} />
              <p>Browse Products</p>
            </Link>
            <Link to="/activities" className={styles.actionCard}>
              <div className={styles.actionPlaceholder} />
              <p>Browse Activities</p>
            </Link>
            <Link to="/profile" className={styles.actionCard}>
              <div className={styles.actionPlaceholder} />
              <p>My Profile</p>
            </Link>
          </div>
        </div>

        <div className={styles.storySection}>
          <h2>Our story:</h2>
          <p>We will be putting photos afterwards</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;