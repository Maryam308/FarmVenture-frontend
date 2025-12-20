import HeroSection from "../HeroSection/HeroSection";
import styles from "./OurStory.module.css";
import FarmVideo from "../../assets/videos/FarmVenture.mp4";

const OurStory = () => {
  return (
    <main className={styles.container}>
      <HeroSection title="FarmVenture" height="300px" />
      
      <div className={styles.contentSection}>
        <section className={styles.storyHeader}>
          <h1>Our Story</h1>
          <p className={styles.subtitle}>From humble beginnings to a thriving farm community</p>
        </section>

        <section className={styles.videoSection}>
          <div className={styles.videoWrapper}>
            <video 
              className={styles.farmVideo}
              autoPlay 
              loop 
              playsInline
            >
              <source src={FarmVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        <section className={styles.storyContent}>
          <div className={styles.storyCard}>
            <h2>🌱 How It All Began</h2>
            <p>
              FarmVenture started as a small family farm in the heart of Bahrain, 
              with a simple dream: to bring fresh, organic produce directly from 
              our fields to your table. What began as a few acres of land has grown 
              into a thriving agricultural community that connects farmers with 
              customers who value quality, sustainability, and authenticity.
            </p>
          </div>

          <div className={styles.storyCard}>
            <h2>🌾 Our Mission</h2>
            <p>
              We believe in sustainable farming practices that respect the land 
              and produce the highest quality food. Our mission is to make fresh, 
              locally-grown products accessible to everyone while educating our 
              community about where their food comes from and how it's grown.
            </p>
          </div>

          <div className={styles.storyCard}>
            <h2>🚜 What We Do</h2>
            <p>
              Today, FarmVenture is more than just a farm—it's a complete 
              agricultural experience. We offer farm-fresh products including 
              organic vegetables, dairy, eggs, and artisanal goods. We also host 
              educational farm tours, hands-on workshops, and seasonal activities 
              that bring families closer to nature and sustainable agriculture.
            </p>
          </div>

          <div className={styles.storyCard}>
            <h2>💚 Our Values</h2>
            <div className={styles.valuesList}>
              <div className={styles.valueItem}>
                <span className={styles.valueIcon}>🌿</span>
                <div>
                  <h3>Sustainability</h3>
                  <p>We practice eco-friendly farming methods that protect our environment for future generations.</p>
                </div>
              </div>
              <div className={styles.valueItem}>
                <span className={styles.valueIcon}>✨</span>
                <div>
                  <h3>Quality</h3>
                  <p>Every product is carefully grown, harvested, and selected to ensure the highest standards.</p>
                </div>
              </div>
              <div className={styles.valueItem}>
                <span className={styles.valueIcon}>🤝</span>
                <div>
                  <h3>Community</h3>
                  <p>We're building a community of people who care about healthy food and sustainable living.</p>
                </div>
              </div>
              <div className={styles.valueItem}>
                <span className={styles.valueIcon}>📚</span>
                <div>
                  <h3>Education</h3>
                  <p>We believe in sharing knowledge about farming, nutrition, and environmental stewardship.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.storyCard}>
            <h2>🎯 Looking Forward</h2>
            <p>
              As we continue to grow, our commitment remains the same: providing 
              our community with the freshest products and most authentic farm 
              experiences. We're constantly expanding our offerings, improving our 
              practices, and finding new ways to connect people with the source of 
              their food. Thank you for being part of our journey!
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default OurStory;