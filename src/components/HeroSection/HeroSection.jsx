import React from 'react';
import styles from './HeroSection.module.css';

const HeroSection = ({ title, backgroundImage, showOverlay = true, height = "400px" }) => {
  const backgroundUrl = backgroundImage || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600';
  
  return (
    <section 
      className={styles.heroSection} 
      style={{ 
        backgroundImage: `url('${backgroundUrl}')`,
        height: height 
      }}
    >
      {showOverlay && <div className={styles.heroOverlay} />}
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>{title}</h1>
      </div>
    </section>
  );
};

export default HeroSection;