import { Link } from "react-router-dom";
import HeroSection from "../HeroSection/HeroSection";
import styles from "./Dashboard.module.css";

const Dashboard = ({ user }) => {
  return (
    <div className={styles.container}>
      <HeroSection title="FarmVenture" height="300px" />
      
      <div className={styles.contentSection}>
        <div className={styles.welcomeCard}>
          <h2>Welcome back, {user.username}! 👋</h2>
          <p>You are logged in as <span className={styles.roleBadge}>{user.role}</span></p>
        </div>

        <div className={styles.quickActions}>
          <h2>Quick Access</h2>
          <div className={styles.actionsGrid}>
            <Link to="/products" className={styles.actionCard}>
              <div className={styles.cardImageProducts}></div>
              <div className={styles.cardContent}>
                <h3>Browse Products</h3>
                <p>Explore fresh farm products</p>
              </div>
            </Link>

            <Link to="/activities" className={styles.actionCard}>
              <div className={styles.cardImageActivities}></div>
              <div className={styles.cardContent}>
                <h3>Browse Activities</h3>
                <p>Discover farm experiences</p>
              </div>
            </Link>

            <Link to="/profile" className={styles.actionCard}>
              <div className={styles.cardImageProfile}></div>
              <div className={styles.cardContent}>
                <h3>My Profile</h3>
                <p>View and edit your profile</p>
              </div>
            </Link>
          </div>
        </div>

        {user.role === "admin" && (
          <div className={styles.adminSection}>
            <h2>Admin Quick Actions</h2>
            <div className={styles.adminGrid}>
              <Link to="/products/new" className={styles.adminCard}>
                <div className={styles.adminIcon}>➕</div>
                <h3>Add Product</h3>
              </Link>

              <Link to="/activities/new" className={styles.adminCard}>
                <div className={styles.adminIcon}>📅</div>
                <h3>Add Activity</h3>
              </Link>
            </div>
          </div>
        )}

        <div className={styles.storySection}>
          <h2>Discover Our Story</h2>
          <p>
            Learn about our journey towards sustainable farming and our commitment 
            to bringing fresh, organic produce directly from our farm to your table. 
            We believe in transparency, quality, and building a community around 
            local agriculture.
          </p>
          <Link to="/about" className={styles.storyButton}>
            Read Our Story
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;