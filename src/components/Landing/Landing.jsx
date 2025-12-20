import { Link } from "react-router-dom";
import HeroSection from "../HeroSection/HeroSection";
import styles from "./Landing.module.css";

const Landing = () => {
  return (
    <main className={styles.container}>
      <HeroSection title="FarmVenture" height="400px" />
      
      <div className={styles.contentSection}>
        <section className={styles.aboutSection}>
          <h2>Welcome to FarmVenture</h2>
          <p>
            Your local marketplace for fresh farm products and agricultural experiences. 
            We connect farmers directly with customers, ensuring the freshest produce 
            and authentic farm experiences. Discover organic vegetables, farm-fresh dairy, 
            and hands-on activities that bring you closer to sustainable agriculture.
          </p>
        </section>

        <section className={styles.featuresSection}>
          <h2>What We Offer</h2>
          <div className={styles.featuresGrid}>
            <Link to="/products" className={styles.featureCard}>
              <div className={styles.cardImageProducts}></div>
              <div className={styles.cardContent}>
                <h3>Fresh Products</h3>
                <p>Browse our selection of farm-fresh produce, dairy, and artisanal goods</p>
              </div>
            </Link>

            <Link to="/activities" className={styles.featureCard}>
              <div className={styles.cardImageActivities}></div>
              <div className={styles.cardContent}>
                <h3>Farm Activities</h3>
                <p>Join guided tours, workshops, and hands-on farming experiences</p>
              </div>
            </Link>

            <Link to="/about" className={styles.featureCard}>
              <div className={styles.cardImageStory}></div>
              <div className={styles.cardContent}>
                <h3>Our Story</h3>
                <p>Learn about our commitment to sustainable and organic farming</p>
              </div>
            </Link>
          </div>
        </section>

        <section className={styles.farmSection}>
          <div className={styles.farmImageContainer}>
            <div className={styles.farmImagePlaceholder}></div>
          </div>
          <div className={styles.farmTextContent}>
            <h2>Experience Farm Life at Its Best</h2>
            <p>
              Join us for authentic farm experiences, learn about sustainable 
              agriculture, and enjoy the freshest products straight from the source. 
              Whether you're looking for organic vegetables, farm-fresh eggs, or 
              a memorable day in the countryside, FarmVenture has something for everyone.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/products" className={styles.primaryButton}>
                Shop Products
              </Link>
              <Link to="/activities" className={styles.secondaryButton}>
                Book Activities
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Landing;