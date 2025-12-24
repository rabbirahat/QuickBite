import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import { assets } from '../../assets/assets'
import { reviewAPI } from '../../utils/api'
import Recommendations from '../Recommendations/Recommendations'
import './FoodDetail.css'

const FoodDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { food_list, cartItems, setItemQuantity } = useContext(StoreContext)
  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Review state
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [qualityRating, setQualityRating] = useState('')
  const [categoryRating, setCategoryRating] = useState('')
  const [priceSatisfaction, setPriceSatisfaction] = useState('')
  const [showReviewSuccess, setShowReviewSuccess] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewError, setReviewError] = useState('')
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const currentUser = useMemo(() => {
    const stored = localStorage.getItem('user')
    if (!stored) return null
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }, [])

  const isAuthenticated = !!currentUser && !!localStorage.getItem('token')

  // Find food item by _id
  const food = food_list.find((item) => item._id === id)

  if (!food) {
    return (
      <div className="product-detail-container">
        <p className="product-not-found">Product not found</p>
      </div>
    )
  }

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true)
    setReviewError('')
    try {
      const response = await reviewAPI.listForFood(id)
      let reviewsList = response.data || []
      
      // If user is logged in, move their review to the top
      if (currentUser && currentUser.id) {
        const userReviewIndex = reviewsList.findIndex(
          (review) => review.user?._id === currentUser.id || review.user?.id === currentUser.id
        )
        
        if (userReviewIndex !== -1) {
          // Remove user's review from its current position
          const userReview = reviewsList.splice(userReviewIndex, 1)[0]
          // Place it at the beginning
          reviewsList = [userReview, ...reviewsList]
        }
      }
      
      setReviews(reviewsList)
    } catch (error) {
      setReviewError(error.message || 'Unable to load reviews')
    } finally {
      setReviewsLoading(false)
    }
  }, [id, currentUser])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleAddToCart = () => {
    setItemQuantity(food._id, quantity)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault() // Prevents page reload

    if (!isAuthenticated) {
      setReviewError('Please login to leave a review.')
      return
    }

    if (!reviewComment.trim() || !qualityRating || !categoryRating || !priceSatisfaction) {
      setReviewError('Please fill in all fields, including all ratings.')
      return
    }

    setIsSubmittingReview(true)
    setReviewError('')

    try {
      if (editingReviewId) {
        const response = await reviewAPI.update(editingReviewId, {
          rating: reviewRating,
          comment: reviewComment,
          qualityRating: qualityRating ? Number(qualityRating) : undefined,
          categoryRating: categoryRating ? Number(categoryRating) : undefined,
          priceSatisfaction: priceSatisfaction ? Number(priceSatisfaction) : undefined,
        })

        // Update the review and ensure user's review stays at the top
        setReviews((prev) => {
          const updated = prev.map((review) =>
            review._id === editingReviewId ? response.data : review
          )
          
          // If user is logged in, ensure their review is at the top
          if (currentUser && currentUser.id) {
            const userReviewIndex = updated.findIndex(
              (review) => review.user?._id === currentUser.id || review.user?.id === currentUser.id
            )
            
            if (userReviewIndex > 0) {
              // Remove user's review from its current position
              const userReview = updated.splice(userReviewIndex, 1)[0]
              // Place it at the beginning
              return [userReview, ...updated]
            }
          }
          
          return updated
        })
        setEditingReviewId(null)
      } else {
        const response = await reviewAPI.create(id, {
          rating: reviewRating,
          comment: reviewComment,
          qualityRating: qualityRating ? Number(qualityRating) : undefined,
          categoryRating: categoryRating ? Number(categoryRating) : undefined,
          priceSatisfaction: priceSatisfaction ? Number(priceSatisfaction) : undefined,
        })
        // ensure list is up to date from server for all users (no local prepend to avoid duplicates)
        await fetchReviews()
      }

      setReviewRating(5)
      setReviewComment('')
      setQualityRating('')
      setCategoryRating('')
      setPriceSatisfaction('')
      setShowReviewSuccess(true)
      setTimeout(() => setShowReviewSuccess(false), 3000)
    } catch (error) {
      setReviewError(error.message || 'Could not submit review')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleStartEdit = (review) => {
    setEditingReviewId(review._id)
    setReviewRating(review.rating)
    setReviewComment(review.comment)
    setQualityRating(review.qualityRating ? String(review.qualityRating) : '')
    setCategoryRating(review.categoryRating ? String(review.categoryRating) : '')
    setPriceSatisfaction(review.priceSatisfaction ? String(review.priceSatisfaction) : '')
    setReviewError('')
  }

  const handleDeleteReview = async (reviewId) => {
    const confirmDelete = window.confirm('Delete this review?')
    if (!confirmDelete) return

    try {
      await reviewAPI.remove(reviewId)
      await fetchReviews()
    } catch (error) {
      setReviewError(error.message || 'Could not delete review')
    }
  }

  useEffect(() => {
    if (!food) return
    const current = cartItems?.[food._id]
    if (typeof current === 'number' && current > 0) setQuantity(current)
    else setQuantity(1)
  }, [cartItems, food])

  const handleIncreaseQuantity = () => {
    const current = cartItems?.[food._id] || 0
    setItemQuantity(food._id, current + 1)
  }

  const handleDecreaseQuantity = () => {
    const current = cartItems?.[food._id] || 0
    if (current > 1) {
      setItemQuantity(food._id, current - 1)
    }
  }

  return (
    <div className="product-detail-wrapper">
      <div className="product-detail-container">
        <button
          onClick={() => navigate('/')}
          className="back-button"
        >
          ← Back to Menu
        </button>

        <div className="product-detail-content">
          <div className="product-image-section">
            <img src={food.image} alt={food.name} className="product-detail-image" />
          </div>

          <div className="product-info-section">
            <div className="product-category-badge">
              {food.category}
            </div>

            <h1 className="product-name">{food.name}</h1>
            <p className="product-description">{food.description}</p>

            <div className="product-price-section">
              <span className="product-price">BDT. {food.price}</span>
            </div>

            <div className="quantity-selector-section">
              <label className="quantity-label">Quantity</label>
              <div className="quantity-controls">
                <button
                  onClick={handleDecreaseQuantity}
                  className="quantity-btn decrease-btn"
                >
                  <img src={assets.remove_icon_red} alt="decrease" />
                </button>
                <span className="quantity-value">{quantity}</span>
                <button
                  onClick={handleIncreaseQuantity}
                  className="quantity-btn increase-btn"
                >
                  <img src={assets.add_icon_green} alt="increase" />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="add-to-cart-btn"
            >
              <img src={assets.shopping_cart_icon} alt="cart" />
              Add to Cart - BDT. {(food.price * quantity).toFixed(2)}
            </button>

            {showSuccess && (
              <div className="success-message">
                ✓ Added to cart successfully!
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <h2 className="reviews-title">Customer Reviews ({reviews.length})</h2>
          {reviewError && <div className="error-message review-error">{reviewError}</div>}
          
          {/* Review Form */}
          <div className="review-form-container">
            <h3 className="review-form-title">
              {editingReviewId ? 'Edit your review' : 'Write a Review'}
            </h3>
            {!isAuthenticated ? (
              <p className="login-to-review">
                Please login to leave a review.
              </p>
            ) : (
              <form onSubmit={handleSubmitReview} className="review-form">
                <div className="form-group">
                  <label htmlFor="reviewerName">Name</label>
                  <input
                    id="reviewerName"
                    type="text"
                    value={currentUser?.name || ''}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reviewRating">Rating</label>
                  <select
                    id="reviewRating"
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 stars)</option>
                    <option value={3}>⭐⭐⭐ (3 stars)</option>
                    <option value={2}>⭐⭐ (2 stars)</option>
                    <option value={1}>⭐ (1 star)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="qualityRating">Quality Rating (1-5)</label>
                  <select
                    id="qualityRating"
                    value={qualityRating}
                    onChange={(e) => setQualityRating(e.target.value)}
                    required
                  >
                    <option value="">Select quality rating</option>
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Below Average</option>
                    <option value="3">3 - Average</option>
                    <option value="4">4 - Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="categoryRating">Category Rating (1-5)</label>
                  <select
                    id="categoryRating"
                    value={categoryRating}
                    onChange={(e) => setCategoryRating(e.target.value)}
                    required
                  >
                    <option value="">Select category rating</option>
                    <option value="1">1 - Very Bad</option>
                    <option value="2">2 - Bad</option>
                    <option value="3">3 - Average</option>
                    <option value="4">4 - Good</option>
                    <option value="5">5 - Very Good</option>
                  </select>
                  <small className="form-hint">1-2: Bad, 3: Average, 4-5: Good</small>
                </div>

                <div className="form-group">
                  <label htmlFor="priceSatisfaction">Price Satisfaction (1-5)</label>
                  <select
                    id="priceSatisfaction"
                    value={priceSatisfaction}
                    onChange={(e) => setPriceSatisfaction(e.target.value)}
                    required
                  >
                    <option value="">Select price satisfaction</option>
                    <option value="1">1 - Very Unsatisfied</option>
                    <option value="2">2 - Unsatisfied</option>
                    <option value="3">3 - Neutral</option>
                    <option value="4">4 - Satisfied</option>
                    <option value="5">5 - Very Satisfied</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="reviewComment">Your Review</label>
                  <textarea
                    id="reviewComment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this dish..."
                    rows="4"
                    required
                  />
                </div>

                <div className="review-form-actions">
                  {editingReviewId && (
                    <button
                      type="button"
                      className="cancel-edit-btn"
                      onClick={() => {
                        setEditingReviewId(null)
                        setReviewRating(5)
                        setReviewComment('')
                        setQualityRating('')
                        setCategoryRating('')
                        setPriceSatisfaction('')
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="submit-review-btn" disabled={isSubmittingReview}>
                    {isSubmittingReview
                      ? 'Saving...'
                      : editingReviewId
                        ? 'Update Review'
                        : 'Submit Review'}
                  </button>
                </div>

                {showReviewSuccess && (
                  <div className="success-message">
                    ✓ Review saved successfully!
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Reviews List */}
          <div className="reviews-list">
            {reviewsLoading ? (
              <p className="no-reviews">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="no-reviews">No reviews yet. Be the first to review this dish!</p>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <div className="review-author">
                      <div className="author-avatar">
                        {(review.user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="author-name">{review.user?.name || 'User'}</p>
                        <p className="review-date">
                          {new Date(review.updatedAt || review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="review-rating">
                      {'⭐'.repeat(review.rating)}
                    </div>
                    {currentUser && review.user?._id === currentUser.id && (
                      <div className="review-actions">
                        <button
                          type="button"
                          className="edit-review-btn"
                          onClick={() => handleStartEdit(review)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="delete-review-btn"
                          onClick={() => handleDeleteReview(review._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  <div className="review-extra-ratings">
                    <div className="extra-rating-pill">
                      <span className="pill-label">Quality</span>
                      <span className="pill-value">
                        {review.qualityRating ?? '-'} / 5
                      </span>
                    </div>
                    <div className="extra-rating-pill">
                      <span className="pill-label">Category</span>
                      <span className="pill-value">
                        {review.categoryRating ?? '-'} / 5
                      </span>
                    </div>
                    <div className="extra-rating-pill">
                      <span className="pill-label">Price</span>
                      <span className="pill-value">
                        {review.priceSatisfaction ?? '-'} / 5
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommendations Section */}
        <Recommendations topN={6} />
      </div>
    </div>
  )
}

export default FoodDetail