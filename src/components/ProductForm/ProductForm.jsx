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
    image_url: '',
    is_active: true
  });

  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = ['fruits', 'vegetables', 'dairy', 'meat', 'grains', 'other'];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || '' : value
    }));
    setError('');
  };

  const handleRadioChange = (event) => {
    setFormData(prev => ({
      ...prev,
      is_active: event.target.value === 'true'
    }));
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      // Upload image first
      const imageUrl = await productService.uploadImage(file);
      
      // Update form with image URL
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      setImageFile(file);
      
    } catch (err) {
      setError('Failed to upload image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
    setImageFile(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare data
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        is_active: formData.is_active
      };

      if (productId) {
        // For editing, send is_active field
        await handleUpdateProduct(productId, submitData);
      } else {
        // For creating new product, don't send is_active (backend sets to true by default)
        const { is_active, ...createData } = submitData;
        await handleAddProduct(createData);
      }
      
      navigate('/products');
      
    } catch (err) {
      setError(err.message || 'Failed to save product');
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
            image_url: productData.image_url || '',
            is_active: productData.is_active
          });
        } catch (err) {
          setError('Failed to load product');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchProduct();
  }, [productId]);

  return (
    <main className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1>{productId ? 'Edit Product' : 'Add New Product'}</h1>
        
        {error && <div className={styles.error}>{error}</div>}
        
        {/* Image Upload Section */}
        <div className={styles.formGroup}>
          <label htmlFor="image">Product Image (Optional)</label>
          
          <div className={styles.imageSection}>
            {formData.image_url ? (
              <div className={styles.imagePreview}>
                <img src={formData.image_url} alt="Preview" />
                <div className={styles.imageActions}>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className={styles.removeImage}
                  >
                    Remove Image
                  </button>
                  <p className={styles.imageUrl}>
                    Image URL: {formData.image_url.substring(0, 50)}...
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.imageUpload}>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className={styles.fileInput}
                  disabled={uploading}
                />
                <label htmlFor="image" className={styles.uploadButton}>
                  {uploading ? 'Uploading...' : 'Choose Image'}
                </label>
                <p className={styles.uploadHint}>
                  JPG, PNG, GIF • Max 5MB • Optional
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Name */}
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

        {/* Description */}
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

        {/* Price and Category */}
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
              placeholder="4.99"
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

        {/* Active/Inactive Radio Buttons (Only for editing) */}
        {productId && (
          <div className={styles.formGroup}>
            <label>Product Status</label>
            <div className={styles.radioGroup}>
              <label className={`${styles.radioLabel} ${formData.is_active ? styles.active : ''}`}>
                <input
                  type="radio"
                  name="is_active"
                  value="true"
                  checked={formData.is_active === true}
                  onChange={handleRadioChange}
                />
                <span className={styles.radioText}>
                  <span className={styles.statusDot}></span>
                  Active (Visible to customers)
                </span>
              </label>
              <label className={`${styles.radioLabel} ${!formData.is_active ? styles.inactive : ''}`}>
                <input
                  type="radio"
                  name="is_active"
                  value="false"
                  checked={formData.is_active === false}
                  onChange={handleRadioChange}
                />
                <span className={styles.radioText}>
                  <span className={styles.statusDot}></span>
                  Inactive (Hidden from customers)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <button 
            type="submit" 
            disabled={loading || uploading}
            className={styles.submitButton}
          >
            {loading ? 'Saving...' : (productId ? 'Update Product' : 'Add Product')}
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