import React, { useContext, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import { assets } from '../../assets/assets'
import './FoodDetail.css'

const FoodDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { food_list, addToCart } = useContext(StoreContext)
  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)

  // Find food item by _id
  const food = food_list.find((item) => item._id === id)

  if (!food) {
    return (
      <div className="product-detail-container">
        <p className="product-not-found">Product not found</p>
      </div>
    )
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(food._id)
    }
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const handleIncreaseQuantity = () => {
    setQuantity(quantity + 1)
  }

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  return (
    <div className="product-detail-wrapper">
      <div className="product-detail-container">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="back-button"
        >
          ← Back to Menu
        </button>

        <div className="product-detail-content">
          {/* Image Section */}
          <div className="product-image-section">
            <img src={food.image} alt={food.name} className="product-detail-image" />
          </div>

          {/* Details Section */}
          <div className="product-info-section">
            {/* Category Badge */}
            <div className="product-category-badge">
              {food.category}
            </div>

            {/* Product Name */}
            <h1 className="product-name">{food.name}</h1>

            {/* Description */}
            <p className="product-description">{food.description}</p>

            {/* Price */}
            <div className="product-price-section">
              <span className="product-price">BDT. {food.price}</span>
            </div>

            {/* Quantity Selector */}
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

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="add-to-cart-btn"
            >
              <img src={assets.shopping_cart_icon} alt="cart" />
              Add to Cart - BDT. {(food.price * quantity).toFixed(2)}
            </button>

            {/* Success Message */}
            {showSuccess && (
              <div className="success-message">
                ✓ Added to cart successfully!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FoodDetail
