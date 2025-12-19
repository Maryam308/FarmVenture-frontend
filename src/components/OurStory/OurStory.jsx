import styles from "./OurStory.module.css";

const OurStory = () => {
  return (
    <main className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>FarmVenture</h1>
        </div>
      </div>

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