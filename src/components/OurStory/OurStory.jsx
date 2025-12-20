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
          <p className={styles.subtitle}>
            From humble beginnings to a thriving farm community
          </p>
        </section>

        <section className={styles.videoSection}>
          <div className={styles.videoWrapper}>
            <video className={styles.farmVideo} autoPlay loop playsInline>
              <source src={FarmVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        <section className={styles.storyContent}>
          <div className={styles.storyCard}>
            <h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-leaf-icon lucide-leaf"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>{" "}
              How It All Began
            </h2>
            <p>
              FarmVenture started as a small family farm in the heart of
              Bahrain, with a simple dream: to bring fresh, organic produce
              directly from our fields to your table. What began as a few acres
              of land has grown into a thriving agricultural community that
              connects farmers with customers who value quality, sustainability,
              and authenticity.
            </p>
          </div>

          <div className={styles.storyCard}>
            <h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-wheat-icon lucide-wheat"
              >
                <path d="M2 22 16 8" />
                <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
                <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
                <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
                <path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" />
                <path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
                <path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
                <path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
              </svg>{" "}
              Our Mission
            </h2>
            <p>
              We believe in sustainable farming practices that respect the land
              and produce the highest quality food. Our mission is to make
              fresh, locally-grown products accessible to everyone while
              educating our community about where their food comes from and how
              it's grown.
            </p>
          </div>

          <div className={styles.storyCard}>
            <h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-truck-icon lucide-truck"
              >
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                <circle cx="17" cy="18" r="2" />
                <circle cx="7" cy="18" r="2" />
              </svg>{" "}
              What We Do
            </h2>
            <p>
              Today, FarmVenture is more than just a farm—it's a complete
              agricultural experience. We offer farm-fresh products including
              organic vegetables, dairy, eggs, and artisanal goods. We also host
              educational farm tours, hands-on workshops, and seasonal
              activities that bring families closer to nature and sustainable
              agriculture.
            </p>
          </div>

          <div className={styles.storyCard}>
            <h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-heart-icon lucide-heart"
              >
                <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
              </svg>{" "}
              Our Values
            </h2>
            <div className={styles.valuesList}>
              <div className={styles.valueItem}>
                <span className={styles.valueIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-sprout-icon lucide-sprout"
                  >
                    <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" />
                    <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" />
                    <path d="M5 21h14" />
                  </svg>
                </span>
                <div>
                  <h3>Sustainability</h3>
                  <p>
                    We practice eco-friendly farming methods that protect our
                    environment for future generations.
                  </p>
                </div>
              </div>
              <div className={styles.valueItem}>
                <span className={styles.valueIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-sparkle-icon lucide-sparkle"
                  >
                    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                  </svg>
                </span>
                <div>
                  <h3>Quality</h3>
                  <p>
                    Every product is carefully grown, harvested, and selected to
                    ensure the highest standards.
                  </p>
                </div>
              </div>
              <div className={styles.valueItem}>
                <span className={styles.valueIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-handshake-icon lucide-handshake"
                  >
                    <path d="m11 17 2 2a1 1 0 1 0 3-3" />
                    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
                    <path d="m21 3 1 11h-2" />
                    <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
                    <path d="M3 4h8" />
                  </svg>
                </span>
                <div>
                  <h3>Community</h3>
                  <p>
                    We're building a community of people who care about healthy
                    food and sustainable living.
                  </p>
                </div>
              </div>
              <div className={styles.valueItem}>
                <span className={styles.valueIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-book-copy-icon lucide-book-copy"
                  >
                    <path d="M5 7a2 2 0 0 0-2 2v11" />
                    <path d="M5.803 18H5a2 2 0 0 0 0 4h9.5a.5.5 0 0 0 .5-.5V21" />
                    <path d="M9 15V4a2 2 0 0 1 2-2h9.5a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5.5H11a2 2 0 0 1 0-4h10" />
                  </svg>
                </span>
                <div>
                  <h3>Education</h3>
                  <p>
                    We believe in sharing knowledge about farming, nutrition,
                    and environmental stewardship.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.storyCard}>
            <h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-goal-icon lucide-goal"
              >
                <path d="M12 13V2l8 4-8 4" />
                <path d="M20.561 10.222a9 9 0 1 1-12.55-5.29" />
                <path d="M8.002 9.997a5 5 0 1 0 8.9 2.02" />
              </svg>{" "}
              Looking Forward
            </h2>
            <p>
              As we continue to grow, our commitment remains the same: providing
              our community with the freshest products and most authentic farm
              experiences. We're constantly expanding our offerings, improving
              our practices, and finding new ways to connect people with the
              source of their food. Thank you for being part of our journey!
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default OurStory;
