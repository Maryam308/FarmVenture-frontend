// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import NavBar from "./components/NavBar/NavBar";
import Landing from "./components/Landing/Landing";
import Dashboard from "./components/Dashboard/Dashboard";
import SignupForm from "./components/SignupForm/SignupForm";
import SigninForm from "./components/SigninForm/SigninForm";
import ProductList from "./components/ProductList/ProductList";
import ProductDetails from "./components/ProductDetails/ProductDetails";
import ProductForm from "./components/ProductForm/ProductForm";
import Profile from "./components/Profile/Profile";
import * as authService from "../src/services/authService";
import * as productService from "./services/productService";
import * as activityService from "./services/activitiesService";
import Loading from "./components/Loading/Loading";
import ActivityList from "./components/ActivityList/ActivityList";
import ActivityDetails from "./components/ActivityDetails/ActivityDetails";
import ActivityForm from "./components/ActivityForm/ActivityForm";
import BookingForm from "./components/BookingForm/BookingForm";
import BookingDetails from "./components/BookingDetails/BookingDetails";

const App = () => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
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
    setActivities([]);
    navigate("/");
  };

  const handleAddProduct = async (productFormData) => {
    try {
      const newProduct = await productService.createProduct(productFormData);
      setProducts([newProduct, ...products]);
      navigate("/products");
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await productService.deleteProduct(productId);
      setProducts(products.filter((product) => product.id !== productId));
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  };

  const handleUpdateProduct = async (productId, productFormData) => {
    try {
      const updatedProduct = await productService.updateProduct(
        productId,
        productFormData
      );
      console.log("Updated product received:", updatedProduct);

      setProducts(
        products.map((product) =>
          product.id === productId ? updatedProduct : product
        )
      );

      return updatedProduct;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  };

  const handleAddActivity = async (activityFormData) => {
    try {
      const newActivity = await activityService.create(activityFormData);
      setActivities([newActivity, ...activities]);
      navigate("/activities");
    } catch (error) {
      console.error("Error adding activity:", error);
      throw error;
    }
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      await activityService.remove(activityId);
      setActivities(
        activities.filter((activity) => activity.id !== activityId)
      );
    } catch (error) {
      console.error("Error deleting activity:", error);
      throw error;
    }
  };

  const handleUpdateActivity = async (activityId, activityFormData) => {
    try {
      const updatedActivity = await activityService.update(
        activityId,
        activityFormData
      );
      setActivities(
        activities.map((activity) =>
          activity.id === activityId ? updatedActivity : activity
        )
      );
      return updatedActivity;
    } catch (error) {
      console.error("Error updating activity:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        // If user is admin, fetch all products including inactive
        if (user?.role === "admin") {
          const productData = await productService.getAllProductsAdmin(true);
          console.log("Fetched admin products:", productData);
          setProducts(productData);
        } else {
          // Regular users only see active products
          const productData = await productService.getAllProducts();
          console.log("Fetched public products:", productData);
          setProducts(productData);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (!loadingUser) {
      fetchProducts();
    }
  }, [user, loadingUser]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        // If user is admin, fetch all activities
        if (user?.role === "admin") {
          const activityData = await activityService.getAllActivitiesAdmin();
          console.log("Fetched admin activities:", activityData);
          setActivities(activityData);
        } else {
          // Regular users only see active activities
          const activityData = await activityService.index(false);
          console.log("Fetched public activities:", activityData);
          setActivities(activityData);
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoadingActivities(false);
      }
    };

    if (!loadingUser) {
      fetchActivities();
    }
  }, [user, loadingUser]);

  if (loadingUser) {
    return <Loading />;
  }

  return (
    <>
      <NavBar user={user} handleSignout={handleSignout} />
      <Routes>
        {user ? (
          <>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route
              path="/activities/:activityId/book"
              element={<BookingForm user={user} />}
            />
            <Route
              path="/bookings/:bookingId"
              element={<BookingDetails user={user} />}
            />
            <Route
              path="/activities"
              element={
                <ActivityList
                  user={user}
                  activities={activities}
                  setActivities={setActivities}
                />
              }
            />
            <Route
              path="/activities/:activityId"
              element={
                <ActivityDetails
                  user={user}
                  handleDeleteActivity={handleDeleteActivity}
                />
              }
            />
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
            <Route
              path="/products/:productId"
              element={
                <ProductDetails
                  user={user}
                  handleDeleteProduct={handleDeleteProduct}
                />
              }
            />
            {/* Only show product creation form for admins */}
            {user?.role === "admin" && (
              <>
                <Route
                  path="/products/new"
                  element={<ProductForm handleAddProduct={handleAddProduct} />}
                />
                <Route
                  path="/products/:productId/edit"
                  element={
                    <ProductForm handleUpdateProduct={handleUpdateProduct} />
                  }
                />

                <Route
                  path="/activities/new"
                  element={
                    <ActivityForm handleAddActivity={handleAddActivity} />
                  }
                />
                <Route
                  path="/activities/:activityId/edit"
                  element={
                    <ActivityForm handleUpdateActivity={handleUpdateActivity} />
                  }
                />
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

            <Route
              path="/activities"
              element={
                <ActivityList
                  user={null}
                  activities={activities}
                  setActivities={setActivities}
                />
              }
            />
            <Route
              path="/activities/:activityId"
              element={<ActivityDetails />}
            />
          </>
        )}
        <Route path="/signup" element={<SignupForm setUser={setUser} />} />
        <Route path="/signin" element={<SigninForm setUser={setUser} />} />
      </Routes>
    </>
  );
};

export default App;
