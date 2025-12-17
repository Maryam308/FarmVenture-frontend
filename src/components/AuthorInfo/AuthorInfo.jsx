import styles from './AuthorInfo.module.css';
import ProfileIcon from '../../assets/images/profile.png';

const AuthorInfo = ({ content }) => {
  return (
    <div className={styles.container}>
      <img src={ProfileIcon} alt="User avatar" />
      <section>
        <p>{content.user.username}</p>
        <div className={styles.dateInfo}>
          <p>Listed {new Date(content.created_at).toLocaleDateString()}</p>
        </div>
      </section>
    </div>
  );
};

export default AuthorInfo;