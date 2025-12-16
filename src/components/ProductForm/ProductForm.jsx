import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as productService from '../../services/productService';
import styles from './ProductForm.module.css';

const ProductForm = ({ handleAddProduct, handleUpdateProduct }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'fruits',
    image_url: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'fruits', 'vegetables', 'dairy', 'meat', 'grains', 'other'
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || '' : value
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (productId) {
        // Update existing product
        await handleUpdateProduct(productId, submitData);
      } else {
        // Create new product
        await handleAddProduct(submitData);
      }
      
      navigate('/products');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (productId) {
        try {
          setLoading(true);
          const productData = await productService.getProduct(productId);
          setFormData({
            name: productData.name,
            description: productData.description,
            price: productData.price.toString(),
            category: productData.category,
            image_url: productData.image_url || ''
          });
        } catch (err) {
          setError('Failed to load product for editing');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchProduct();
  }, [productId]);

  if (loading && productId) {
    return <div>Loading product data...</div>;
  }

  return (
    <main className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1>{productId ? 'Edit Product' : 'Add New Product'}</h1>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <div className={styles.formGroup}>
          <label htmlFor="name">Product Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            minLength="1"
            maxLength="100"
            placeholder="e.g., Organic Apples"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            maxLength="500"
            rows="4"
            placeholder="Describe your product..."
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="price">Price ($) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="image_url">Image URL (Optional)</label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
          <small>Add a link to your product image</small>
        </div>

        <div className={styles.buttonGroup}>
          <button 
            type="submit" 
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Processing...' : (productId ? 'Update Product' : 'Add Product')}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/products')}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
};

export default ProductForm;