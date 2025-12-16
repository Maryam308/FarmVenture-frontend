import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as hootService from '../../services/hootService';
import styles from './HootForm.module.css'


const HootForm = ({handleAddHoot, handleUpdateHoot}) => {
  const { hootId } = useParams();
  
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    category: 'News',
  });

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (hootId) {
      handleUpdateHoot(hootId, formData);
    } else {
      handleAddHoot(formData);
    };
  };

  useEffect(() => {
    const getHoot = async () => {
      const hootData = await hootService.show(hootId);
      setFormData(hootData);
    };
    if (hootId) getHoot();
  }, [hootId]);

  return (
    <main className={styles.container}>
      <form onSubmit={handleSubmit}>
      <h1>{hootId ? 'Edit Hoot' : 'New Hoot'}</h1>
        <label htmlFor="title-input">Title</label>
        <input
          required
          type="text"
          name="title"
          id="title-input"
          value={formData.title}
          onChange={handleChange}
        />
        <label htmlFor="text-input">Text</label>
        <textarea
          required
          type="text"
          name="text"
          id="text-input"
          value={formData.text}
          onChange={handleChange}
        />
        <label htmlFor="category-input">Category</label>
        <select
          required
          name="category"
          id="category-input"
          value={formData.category}
          onChange={handleChange}
        >
          <option value="News">News</option>
          <option value="Games">Games</option>
          <option value="Music">Music</option>
          <option value="Movies">Movies</option>
          <option value="Sports">Sports</option>
          <option value="Television">Television</option>
        </select>
        <button type="submit">SUBMIT</button>
      </form>
    </main>
  );
};

export default HootForm;