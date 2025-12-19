import { Link } from "react-router-dom";
import styles from "./Dashboard.module.css";

const Dashboard = ({ user }) => {
  return (
    <main className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>FarmVenture</h1>
        </div>
      </div>

      <div className={styles.contentSection}>
        <div className={styles.welcomeCard}>
          <h2>About Us:</h2>
          <p>
            Welcome back, {user.username}! You are logged in as a {user.role}.
          </p>
        </div>

        <section className={styles.quickActions}>
          <h2>Quick Access</h2>
          <div className={styles.actionsGrid}>
            <Link to="/products" className={styles.actionCard}>
              <div className={styles.actionPlaceholder}></div>
              <p>Browse Products</p>
            </Link>
            <Link to="/activities" className={styles.actionCard}>
              <div className={styles.actionPlaceholder}></div>
              <p>Browse Activities</p>
            </Link>
            <Link to="/profile" className={styles.actionCard}>
              <div className={styles.actionPlaceholder}></div>
              <p>My Profile</p>
            </Link>
          </div>
        </section>

        <section className={styles.storySection}>
          <h2>Our story:</h2>
          <p>We will be putting photos afterwards</p>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;