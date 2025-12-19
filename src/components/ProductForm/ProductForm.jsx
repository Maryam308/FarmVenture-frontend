import { useState, useEffect } from 'react';  
import { useParams, useNavigate } from 'react-router-dom';
import * as productService from '../../services/productService';
import styles from './ProductForm.module.css';
import PopupAlert from '../PopupAlert/PopupAlert';

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
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const categories = ['fruits', 'vegetables', 'dairy', 'meat', 'grains', 'other'];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || '' : value
    }));
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file (JPG, PNG, GIF)');
      setShowErrorPopup(true);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image must be less than 5MB');
      setShowErrorPopup(true);
      return;
    }
    
    setUploading(true);
    
    try {
      const imageUrl = await productService.uploadImage(file);
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      setImageFile(file);
    } catch (err) {
      setErrorMessage('Failed to upload image: ' + err.message);
      setShowErrorPopup(true);
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

    // Validate image FIRST (before loading state)
    if (!formData.image_url && !productId) {
      setErrorMessage('Product image is required. Please upload an image before submitting.');
      setShowErrorPopup(true);
      return;
    }

    setLoading(true);

    // Validate other required fields
    if (!formData.name.trim()) {
      setErrorMessage('Product name is required');
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setErrorMessage('Description is required');
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setErrorMessage('Valid price is required');
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setErrorMessage('Category is required');
      setShowErrorPopup(true);
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        image_url: formData.image_url,
        is_active: formData.is_active
      };

      if (productId) {
        await handleUpdateProduct(productId, submitData);
        setSuccessMessage('Product updated successfully!');
        setShowSuccessPopup(true);
        setTimeout(() => {
          navigate('/products');
        }, 2000);
      } else {
        const { is_active, ...createData } = submitData;
        await handleAddProduct(createData);
        setSuccessMessage('Product created successfully!');
        setShowSuccessPopup(true);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save product. Please try again.');
      setShowErrorPopup(true);
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
          setErrorMessage('Failed to load product');
          setShowErrorPopup(true);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchProduct();
  }, [productId]);

  return (
    <main className={styles.container}>
      <PopupAlert
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        title="Error"
        message={errorMessage}
        type="error"
        confirmText="OK"
        showCancel={false}
      />

      <PopupAlert
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Success"
        message={successMessage}
        type="success"
        confirmText="OK"
        showCancel={false}
        autoClose={true}
        autoCloseTime={2000}
      />

      <div className={styles.heroSection}>
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>FarmVenture</h1>
        </div>
      </div>

      <div className={styles.contentSection}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h1>{productId ? 'Edit Product' : 'Add New Product'}</h1>
          
          <div className={styles.formGroup}>
            <label htmlFor="image">
              Product Image
              <span className={styles.required}>*</span>
            </label>
            
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
                    <span className={styles.imageStatus}>
                      ✓ Image uploaded successfully
                    </span>
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
                    JPG, PNG, GIF • Max 5MB • Required
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name">
              Product Name
              <span className={styles.required}>*</span>
            </label>
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
            <label htmlFor="description">
              Description
              <span className={styles.required}>*</span>
            </label>
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
              <label htmlFor="price">
                Price (BHD)
                <span className={styles.required}>*</span>
              </label>
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
              <label htmlFor="category">
                Category
                <span className={styles.required}>*</span>
              </label>
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

          {productId && (
            <div className={styles.formGroup}>
              <label>
                Product Status
                <span className={styles.required}>*</span>
              </label>
              <div className={styles.radioGroup}>
                <label className={`${styles.radioLabel} ${formData.is_active ? styles.active : ''}`}>
                  <input
                    type="radio"
                    name="is_active"
                    value="true"
                    checked={formData.is_active === true}
                    onChange={() => setFormData(prev => ({ ...prev, is_active: true }))}
                  />
                  <span className={styles.radioText}>
                    <span className={styles.statusDot}></span>
                    Active (Visible to customers)
                  </span>
                </label>
                <label className={`${styles.radioLabel} ${formData.is_active === false ? styles.inactive : ''}`}>
                  <input
                    type="radio"
                    name="is_active"
                    value="false"
                    checked={formData.is_active === false}
                    onChange={() => setFormData(prev => ({ ...prev, is_active: false }))}
                  />
                  <span className={styles.radioText}>
                    <span className={styles.statusDot}></span>
                    Inactive (Hidden from customers)
                  </span>
                </label>
              </div>
              <p className={styles.radioHelp}>
                Note: Inactive products are hidden by default but can be shown using the filter.
              </p>
            </div>
          )}

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
      </div>
    </main>
  );
};

export default ProductForm;