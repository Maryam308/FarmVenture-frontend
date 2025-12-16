import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import * as hootService from '../../services/hootService';
import * as commentService from '../../services/commentService';

import styles from './CommentForm.module.css';

import Icon from '../Icon/Icon';

const CommentForm = ({handleAddComment}) => {
  const [formData, setFormData] = useState({ text: '' });
  const { hootId, commentId } = useParams();
  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (hootId && commentId) {
      commentService.update(hootId, commentId, formData);
      navigate(`/hoots/${hootId}`);
    } else {
      handleAddComment(formData);
    };
    setFormData({ text: '' });
  };

  useEffect(() => {
    const fetchHoot = async () => {
      const hootData = await hootService.show(hootId);
      setFormData(hootData.comments.find((comment) => comment._id === commentId));
    };
    if (hootId && commentId) fetchHoot();
  }, [hootId, commentId])

  if (hootId && commentId) return (
    <main className={styles.container}>
      <form onSubmit={handleSubmit}>
        <h1>Edit Comment</h1>
        <label htmlFor="text-input">Your comment:</label>
        <textarea
          required
          type="text"
          name="text"
          id="text-input"
          value={formData.text}
          onChange={handleChange}
        />
        <button type="submit">
          Edit Comment
        </button>
      </form>
    </main>
  );
  
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="text-input">Your comment:</label>
      <textarea
        required
        type="text"
        name="text"
        id="text-input"
        value={formData.text}
        onChange={handleChange}
      />
      <button type="submit">
        <Icon category="Create" />
      </button>
    </form>
  );
};

export default CommentForm;