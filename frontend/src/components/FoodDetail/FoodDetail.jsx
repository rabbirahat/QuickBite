import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import { assets } from '../../assets/assets'
import './FoodDetail.css'

const FoodDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { food_list, addToCart, removeFromCart, cartItems, setItemQuantity, addReview, getReviewsForFood } = useContext(StoreContext)
  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Review state
  const [reviewName, setReviewName] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [showReviewSuccess, setShowReviewSuccess] = useState(false)

  // Find food item by _id
  const food = food_list.find((item) => item._id === id)

  if (!food) {
    return (
      <div className="product-detail-container">
        <p className="product-not-found">Product not found</p>
      </div>
    )
  }

  const reviews = getReviewsForFood(id)

  const handleAddToCart = () => {
    setItemQuantity(food._id, quantity)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const handleSubmitReview = (e) => {
    e.preventDefault() // Prevents page reload
    
    if (!reviewName.trim() || !reviewComment.trim()) {
      alert('Please fill in all fields')
      return
    }

    // Add review with current date
    addReview(id, {
      name: reviewName,
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toLocaleDateString()
    })

    // Reset form and show success
    setReviewName('')
    setReviewRating(5)
    setReviewComment('')
    setShowReviewSuccess(true)
    setTimeout(() => setShowReviewSuccess(false), 3000)
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
          
          {/* Review Form */}
          <div className="review-form-container">
            <h3 className="review-form-title">Write a Review</h3>
            <form onSubmit={handleSubmitReview} className="review-form">
              <div className="form-group">
                <label htmlFor="reviewName">Your Name</label>
                <input
                  type="text"
                  id="reviewName"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="Enter your name"
                  required
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

              <button type="submit" className="submit-review-btn">
                Submit Review
              </button>

              {showReviewSuccess && (
                <div className="success-message">
                  ✓ Review submitted successfully!
                </div>
              )}
            </form>
          </div>

          {/* Reviews List */}
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p className="no-reviews">No reviews yet. Be the first to review this dish!</p>
            ) : (
              reviews.map((review, index) => (
                <div key={index} className="review-card">
                  <div className="review-header">
                    <div className="review-author">
                      <div className="author-avatar">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="author-name">{review.name}</p>
                        <p className="review-date">{review.date}</p>
                      </div>
                    </div>
                    <div className="review-rating">
                      {'⭐'.repeat(review.rating)}
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FoodDetail