import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import Landing from './components/Landing/Landing';
import Dashboard from './components/Dashboard/Dashboard';
import SignupForm from './components/SignupForm/SignupForm';
import SigninForm from './components/SigninForm/SigninForm';
import ProductList from './components/ProductList/ProductList';
import ProductDetails from './components/ProductDetails/ProductDetails';
import ProductForm from './components/ProductForm/ProductForm';
import Profile from './components/Profile/Profile';
import * as authService from '../src/services/authService';
import * as productService from './services/productService';

const App = () => {
  const [user, setUser] = useState(authService.getUser());
  const [products, setProducts] = useState([]);

  const navigate = useNavigate();

  const handleSignout = () => {
    authService.signout();
    setUser(null);
    navigate('/');
  };

  const handleAddProduct = async (productFormData) => {
    try {
      const newProduct = await productService.createProduct(productFormData);
      setProducts([newProduct, ...products]);
      navigate('/products');
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await productService.deleteProduct(productId);
      setProducts(products.filter((product) => product.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleUpdateProduct = async (productId, productFormData) => {
    try {
      const updatedProduct = await productService.updateProduct(productId, productFormData);
      setProducts(products.map((product) => 
        product.id === productId ? updatedProduct : product
      ));
      navigate(`/products/${productId}`);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productData = await productService.getAllProducts();
        setProducts(productData);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    fetchProducts();
  }, []);

  return (
    <>
      <NavBar user={user} handleSignout={handleSignout} />
      <Routes>
        { user ? (
          <>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/products" element={<ProductList products={products} />} />
            <Route path="/products/:productId" element={
              <ProductDetails 
                user={user} 
                handleDeleteProduct={handleDeleteProduct} 
              />
            } />
            <Route path="/products/new" element={
              <ProductForm handleAddProduct={handleAddProduct} />
            } />
            <Route path="/products/:productId/edit" element={
              <ProductForm handleUpdateProduct={handleUpdateProduct} />
            } />
            <Route path="/profile" element={<Profile user={user} />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Landing />} />
            <Route path="/products" element={<ProductList products={products} />} />
            <Route path="/products/:productId" element={<ProductDetails />} />
          </>
        )}
        <Route path='/signup' element={<SignupForm setUser={setUser} />} />
        <Route path='/signin' element={<SigninForm setUser={setUser} />} />
      </Routes>
    </>
  );
};

export default App;