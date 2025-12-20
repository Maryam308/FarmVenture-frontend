import HeroSection from "../HeroSection/HeroSection";
import styles from "./OurStory.module.css";

const OurStory = () => {
  return (
    <main className={styles.container}>
      <HeroSection title="FarmVenture" />
      
      <div className={styles.contentSection}>
        <section className={styles.storyCard}>
          <h2>Our story:</h2>
          <p>We will be putting photos afterwards</p>
        </section>
      </div>
    </main>
  );
};

export default OurStory;