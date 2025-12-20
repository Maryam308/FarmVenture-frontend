import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeroSection from "../HeroSection/HeroSection";
import styles from "./ProductList.module.css";
import * as productService from "../../services/productService";
import * as favoriteService from "../../services/favoriteService";
import { canViewProduct } from "../../services/productService";
import PopupAlert from "../PopupAlert/PopupAlert";

const ProductList = ({ user, products: initialProducts = [], setProducts }) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(!initialProducts.length);
  const [products, setLocalProducts] = useState(initialProducts);
  const [favorites, setFavorites] = useState(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateSort, setDateSort] = useState("newest");
  const [priceSort, setPriceSort] = useState("none");
  const [nameSort, setNameSort] = useState("none");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);

  const navigate = useNavigate();

  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    products.forEach((product) => {
      if (product.category) {
        uniqueCategories.add(product.category);
      }
    });
    return ["all", ...Array.from(uniqueCategories).sort()];
  }, [products]);

  const fetchFavorites = useCallback(async () => {
    if (user && user.role === "customer") {
      try {
        setLoadingFavorites(true);
        const favoriteIds = await favoriteService.getFavoriteIds("product");
        const favoriteSet = new Set(favoriteIds.products || []);
        setFavorites(favoriteSet);
      } catch (error) {
        setFavorites(new Set());
      } finally {
        setLoadingFavorites(false);
      }
    } else {
      setFavorites(new Set());
      setLoadingFavorites(false);
    }
  }, [user]);

  const handleFavoriteToggle = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/signin");
      return;
    }

    if (user.role !== "customer") {
      return;
    }

    const isFavorited = favorites.has(productId);

    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(productId, "product");
        setFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      } else {
        await favoriteService.addFavorite(productId, "product");
        setFavorites((prev) => new Set([...prev, productId]));
      }
    } catch (error) {
      setErrorMessage("Failed to update favorite: " + error.message);
      setShowErrorPopup(true);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (user?.role === "admin") {
        try {
          setLoading(true);
          const allProducts = await productService.getAllProductsAdmin(true);
          setLocalProducts(allProducts);
          if (setProducts) setProducts(allProducts);
        } catch (error) {
          setErrorMessage("Failed to load products");
          setShowErrorPopup(true);
        } finally {
          setLoading(false);
        }
      } else if (!initialProducts.length) {
        try {
          setLoading(true);
          const publicProducts = await productService.getAllProducts();
          setLocalProducts(publicProducts);
          if (setProducts) setProducts(publicProducts);
        } catch (error) {
          setErrorMessage("Failed to load products");
          setShowErrorPopup(true);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProducts();
  }, [user, initialProducts.length, setProducts]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "favorites_updated") {
        fetchFavorites();
      }
    };

    const handleFavoriteUpdate = () => {
      fetchFavorites();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("favoriteUpdated", handleFavoriteUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("favoriteUpdated", handleFavoriteUpdate);
    };
  }, [fetchFavorites]);

  const handleToggleStatus = async (productId, currentStatus, e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const newStatus = !currentStatus;
      const updatedProduct = await productService.toggleProductActive(
        productId,
        newStatus
      );

      setLocalProducts((prev) =>
        prev.map((p) => (p.id === productId ? updatedProduct : p))
      );

      if (setProducts) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? updatedProduct : p))
        );
      }

      setSuccessMessage(
        `Product ${newStatus ? "activated" : "deactivated"} successfully!`
      );
      setShowSuccessPopup(true);
    } catch (error) {
      setErrorMessage("Failed to update product status: " + error.message);
      setShowErrorPopup(true);
    }
  };

  const handleDeleteClick = (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedProductId(productId);
    setShowDeletePopup(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProductId) return;

    try {
      await productService.deleteProduct(selectedProductId);
      setLocalProducts((prev) =>
        prev.filter((p) => p.id !== selectedProductId)
      );
      if (setProducts) {
        setProducts((prev) => prev.filter((p) => p.id !== selectedProductId));
      }
      setSuccessMessage("Product deleted successfully!");
      setShowSuccessPopup(true);
    } catch (error) {
      setErrorMessage("Failed to delete product: " + error.message);
      setShowErrorPopup(true);
    }

    setSelectedProductId(null);
  };

  const handleDateSortChange = (value) => {
    setDateSort(value);
    if (value !== "none") {
      setPriceSort("none");
      setNameSort("none");
    }
  };

  const handlePriceSortChange = (value) => {
    setPriceSort(value);
    if (value !== "none") {
      setDateSort("none");
      setNameSort("none");
    }
  };

  const handleNameSortChange = (value) => {
    setNameSort(value);
    if (value !== "none") {
      setDateSort("none");
      setPriceSort("none");
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (user?.role === "admin") {
      if (statusFilter === "active")
        filtered = filtered.filter((p) => p.is_active);
      if (statusFilter === "inactive")
        filtered = filtered.filter((p) => !p.is_active);
    } else {
      filtered = filtered.filter((p) => p.is_active);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (product) =>
          product.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Apply sorting based on active sort option
    if (dateSort !== "none") {
      if (dateSort === "newest") {
        filtered.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      } else if (dateSort === "oldest") {
        filtered.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
      }
    } else if (priceSort !== "none") {
      if (priceSort === "low-high") {
        filtered.sort((a, b) => a.price - b.price);
      } else if (priceSort === "high-low") {
        filtered.sort((a, b) => b.price - a.price);
      }
    } else if (nameSort !== "none") {
      if (nameSort === "az") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else if (nameSort === "za") {
        filtered.sort((a, b) => b.name.localeCompare(a.name));
      }
    } else {
      // Default sort by newest
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return filtered;
  }, [
    products,
    user,
    statusFilter,
    searchQuery,
    categoryFilter,
    dateSort,
    priceSort,
    nameSort,
  ]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    categoryFilter,
    dateSort,
    priceSort,
    nameSort,
    statusFilter,
  ]);

  const activeCount = products.filter((p) => p.is_active).length;
  const inactiveCount = products.filter((p) => !p.is_active).length;
  const totalCount = products.length;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  const getActiveSortLabel = () => {
    if (dateSort !== "none") {
      return dateSort === "newest"
        ? "Sorted by: Date (Newest First)"
        : "Sorted by: Date (Oldest First)";
    }
    if (priceSort !== "none") {
      return priceSort === "low-high"
        ? "Sorted by: Price (Low to High)"
        : "Sorted by: Price (High to Low)";
    }
    if (nameSort !== "none") {
      return nameSort === "az"
        ? "Sorted by: Name (A-Z)"
        : "Sorted by: Name (Z-A)";
    }
    return "Sorted by: Date (Newest First)";
  };

  if (loading) {
    return (
      <main className={styles.container}>
        <HeroSection title="FarmVenture" height="300px" />
        <div className={styles.contentSection}>
          <div className={styles.emptyState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading products...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <PopupAlert
        isOpen={showDeletePopup}
        onClose={() => setShowDeletePopup(false)}
        title="Delete Product"
        message="Are you sure you want to permanently delete this product? This action cannot be undone."
        type="warning"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        showCancel={true}
        onConfirm={handleDeleteConfirm}
      />

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

      <HeroSection title="FarmVenture" height="300px" />

      <div className={styles.contentSection}>
        <div className={styles.headerSection}>
          <div className={styles.titleRow}>
            <h1>Farm Products</h1>
            {user?.role === "admin" && (
              <Link to="/products/new" className={styles.createButton}>
                + Create Product
              </Link>
            )}
          </div>

          <div className={styles.stats}>
            <span className={styles.statActive}>{activeCount} Active</span>
            {user?.role === "admin" && (
              <span className={styles.statInactive}>
                {inactiveCount} Inactive
              </span>
            )}
            <span className={styles.statTotal}>{totalCount} Total</span>
            {searchQuery && (
              <span className={styles.searchResults}>
                {filteredProducts.length} results for "{searchQuery}"
              </span>
            )}
          </div>

          <div className={styles.searchFilterBar}>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Search products by name, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  className={styles.clearSearch}
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="categoryFilter" className={styles.filterLabel}>
                  Category:
                </label>
                <select
                  id="categoryFilter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Categories</option>
                  {categories
                    .filter((cat) => cat !== "all")
                    .map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="dateSort" className={styles.filterLabel}>
                  Sort by Date:
                </label>
                <select
                  id="dateSort"
                  value={dateSort}
                  onChange={(e) => handleDateSortChange(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="none">No Date Sort</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="priceSort" className={styles.filterLabel}>
                  Sort by Price:
                </label>
                <select
                  id="priceSort"
                  value={priceSort}
                  onChange={(e) => handlePriceSortChange(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="none">No Price Sort</option>
                  <option value="low-high">Low to High</option>
                  <option value="high-low">High to Low</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="nameSort" className={styles.filterLabel}>
                  Sort by Name:
                </label>
                <select
                  id="nameSort"
                  value={nameSort}
                  onChange={(e) => handleNameSortChange(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="none">No Name Sort</option>
                  <option value="az">A-Z</option>
                  <option value="za">Z-A</option>
                </select>
              </div>

              {user?.role === "admin" && (
                <div className={styles.filterGroup}>
                  <label htmlFor="statusFilter" className={styles.filterLabel}>
                    Status:
                  </label>
                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Products</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-search-icon lucide-search"
              >
                <path d="m21 21-4.34-4.34" />
                <circle cx="11" cy="11" r="8" />
              </svg>
            </div>
            <p>
              {searchQuery
                ? `No products found matching "${searchQuery}"`
                : categoryFilter !== "all"
                ? `No products found in the "${categoryFilter}" category`
                : user?.role === "admin" && statusFilter !== "all"
                ? `No ${statusFilter} products found`
                : "No products available."}
            </p>
            <div className={styles.emptyStateButtonGroup}>
              {(searchQuery || categoryFilter !== "all") && (
                <button
                  className={styles.clearFiltersButton}
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                  }}
                >
                  ✕ Clear Filters
                </button>
              )}
              {user?.role === "admin" && (
                <Link to="/products/new" className={styles.addButton}>
                  + Create Your First Product
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className={styles.resultsInfo}>
              <p>
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredProducts.length)} of{" "}
                {filteredProducts.length} products
                {searchQuery && ` for "${searchQuery}"`}
              </p>
              <div className={styles.sortIndicator}>{getActiveSortLabel()}</div>
            </div>

            <div className={styles.grid}>
              {currentProducts.map((product) => (
                <div key={product.id} className={styles.productCardWrapper}>
                  <div className={styles.productCard}>
                    <Link
                      to={`/products/${product.id}`}
                      className={styles.cardLink}
                      onClick={(e) => {
                        if (!canViewProduct(product, user)) {
                          e.preventDefault();
                          setErrorMessage(
                            "This product is currently inactive and cannot be viewed."
                          );
                          setShowErrorPopup(true);
                        }
                      }}
                    >
                      <article>
                        <div className={styles.imageContainer}>
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className={styles.productImage}
                            />
                          ) : (
                            <div className={styles.noImage}>
                              <span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  class="lucide lucide-sprout-icon lucide-sprout"
                                >
                                  <path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" />
                                  <path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" />
                                  <path d="M5 21h14" />
                                </svg>
                              </span>
                              <p>No Image</p>
                            </div>
                          )}

                          {!product.is_active && (
                            <div className={styles.inactiveBadge}>INACTIVE</div>
                          )}

                          {user?.role === "customer" && (
                            <button
                              className={`${styles.favoriteBtn} ${
                                favorites.has(product.id)
                                  ? styles.favorited
                                  : ""
                              }`}
                              onClick={(e) =>
                                handleFavoriteToggle(product.id, e)
                              }
                              aria-label={
                                favorites.has(product.id)
                                  ? "Remove from favorites"
                                  : "Add to favorites"
                              }
                              disabled={loadingFavorites}
                            >
                              {favorites.has(product.id) ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="red"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  class="lucide lucide-heart-icon lucide-heart"
                                >
                                  <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  class="lucide lucide-heart-icon lucide-heart"
                                >
                                  <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>

                        <div className={styles.productContent}>
                          <header>
                            <div className={styles.productHeader}>
                              <h2>{product.name}</h2>
                              <div className={styles.priceTag}>
                                BHD {product.price.toFixed(2)}
                              </div>
                            </div>
                          </header>

                          <div className={styles.categoryInfo}>
                            <span className={styles.category}>
                              {product.category}
                            </span>
                            <span
                              className={`${styles.status} ${
                                product.is_active
                                  ? styles.active
                                  : styles.inactive
                              }`}
                            >
                              {product.is_active ? "✓ Active" : "✗ Inactive"}
                            </span>
                          </div>

                          <p className={styles.description}>
                            {product.description}
                          </p>
                        </div>
                      </article>
                    </Link>

                    {user?.role === "admin" && (
                      <div className={styles.adminActions}>
                        <Link
                          to={`/products/${product.id}/edit`}
                          className={styles.editBtn}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Edit
                        </Link>

                        <button
                          onClick={(e) =>
                            handleToggleStatus(product.id, product.is_active, e)
                          }
                          className={styles.toggleBtn}
                        >
                          {product.is_active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={(e) => handleDeleteClick(product.id, e)}
                          className={styles.deleteBtn}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={`${styles.pageButton} ${
                    currentPage === 1 ? styles.disabled : ""
                  }`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>

                <div className={styles.pageNumbers}>
                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className={styles.ellipsis}
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        className={`${styles.pageButton} ${
                          currentPage === page ? styles.active : ""
                        }`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                <button
                  className={`${styles.pageButton} ${
                    currentPage === totalPages ? styles.disabled : ""
                  }`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default ProductList;
