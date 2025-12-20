import { Link } from "react-router-dom";
import HeroSection from "../HeroSection/HeroSection";
import styles from "./Landing.module.css";

const Landing = () => {
  return (
    <main className={styles.container}>
      <HeroSection title="FarmVenture" />
      
      <div className={styles.contentSection}>
        <section className={styles.aboutSection}>
          <h2>About Us:</h2>
          <p>
            Welcome to FarmVenture - your local marketplace for fresh farm products 
            and agricultural experiences. We connect farmers directly with customers, 
            ensuring the freshest produce and authentic farm experiences.
          </p>
        </section>

        <section className={styles.featuresSection}>
          <h2>Recent Products</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.cardPlaceholder}></div>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.cardPlaceholder}></div>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.cardPlaceholder}></div>
            </div>
          </div>
        </section>

        <section className={styles.farmSection}>
          <div className={styles.farmImageContainer}>
            <div className={styles.farmImagePlaceholder}></div>
          </div>
          <div className={styles.farmTextContent}>
            <h2>Experience farm life at its best</h2>
            <p>
              Join us for authentic farm experiences, learn about sustainable 
              agriculture, and enjoy the freshest products straight from the source.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Landing;