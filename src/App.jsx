// src/App.jsx
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
import Loading from './components/Loading/Loading';

const App = () => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const navigate = useNavigate();

  // Initialize user on component mount
  useEffect(() => {
    const checkUser = () => {
      const userData = authService.getUser();
      setUser(userData);
      setLoadingUser(false);
    };
    
    checkUser();
  }, []);

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
      throw error;
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await productService.deleteProduct(productId);
      setProducts(products.filter((product) => product.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const handleUpdateProduct = async (productId, productFormData) => {
    try {
      const updatedProduct = await productService.updateProduct(productId, productFormData);
      console.log('Updated product received:', updatedProduct);
      
      setProducts(products.map((product) => 
        product.id === productId ? updatedProduct : product
      ));
      
      return updatedProduct;
      
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        // If user is admin, fetch all products including inactive
        if (user?.role === 'admin') {
          const productData = await productService.getAllProductsAdmin(true);
          console.log('Fetched admin products:', productData);
          setProducts(productData);
        } else {
          // Regular users only see active products
          const productData = await productService.getAllProducts();
          console.log('Fetched public products:', productData);
          setProducts(productData);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    if (!loadingUser) {
      fetchProducts();
    }
  }, [user, loadingUser]);

  if (loadingUser) {
    return <Loading />;
  }

  return (
    <>
      <NavBar user={user} handleSignout={handleSignout} />
      <Routes>
        { user ? (
          <>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route 
              path="/products" 
              element={
                <ProductList 
                  user={user}
                  products={products}
                  setProducts={setProducts}
                />
              } 
            />
            <Route path="/products/:productId" element={
              <ProductDetails 
                user={user} 
                handleDeleteProduct={handleDeleteProduct} 
              />
            } />
            {/* Only show product creation form for admins */}
            {user?.role === 'admin' && (
              <>
                <Route path="/products/new" element={
                  <ProductForm handleAddProduct={handleAddProduct} />
                } />
                <Route path="/products/:productId/edit" element={
                  <ProductForm handleUpdateProduct={handleUpdateProduct} />
                } />
              </>
            )}
            <Route path="/profile" element={<Profile user={user} />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Landing />} />
            <Route 
              path="/products" 
              element={
                <ProductList 
                  user={null}
                  products={products}
                  setProducts={setProducts}
                />
              } 
            />
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