import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './PlaceOrder.css'
import { StoreContext } from '../../context/StoreContext'

const PlaceOrder = () => {
  const { cartItems, food_list, getTotalCartAmount } = useContext(StoreContext)
  const navigate = useNavigate()
  const [orderPlaced, setOrderPlaced] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    country: ''
  })

  // Calculate cart list
  const cartList = food_list.filter((item) => cartItems[item._id] > 0)

  // If cart is empty, redirect to home
  if (cartList.length === 0 && !orderPlaced) {
    navigate('/cart')
    return null
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // After backend setup, send order to backend here
    console.log('Order Details:', {
      customerInfo: formData,
      items: cartList,
      total: getTotalCartAmount() + 50
    })
    setOrderPlaced(true)
  }

  const subtotal = getTotalCartAmount()
  const deliveryFee = 50
  const total = subtotal + deliveryFee

  // Success screen after order placement
  if (orderPlaced) {
    return (
      <div className="order-success-page">
        <div className="order-success-card">
          <div className="success-icon">✓</div>
          <h2 className="success-title">Order Placed Successfully!</h2>
          <p className="success-text">
            Thank you for your order. You'll receive a confirmation email shortly.
          </p>
          <button
            onClick={() => navigate('/')}
            className="success-button"
          >
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="place-order-page">
      <div className="place-order-container">
        <button
          onClick={() => navigate('/cart')}
          className="place-order-back-button"
        >
          <span className="back-arrow">←</span>
          <span>Back to Cart</span>
        </button>

        <h1 className="place-order-title">Checkout</h1>

        <div className="place-order-layout">
          {/* Delivery Information Form */}
          <form onSubmit={handleSubmit} className="delivery-form">
            <div className="form-section">
              <h2 className="form-section-title">Delivery Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter first name"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter last name"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="your@email.com"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+880 1234567890"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your street address"
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter city"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter country"
                    className="form-input"
                  />
                </div>
              </div>

              <button type="submit" className="place-order-submit-button">
                Place Order - BDT. {total.toFixed(2)}
              </button>
            </div>
          </form>

          {/* Order Summary */}
          <div className="order-summary-panel">
            <div className="order-summary-card">
              <h2 className="order-summary-title">Order Summary</h2>

              <div className="order-items-list">
                {cartList.map((item) => (
                  <div key={item._id} className="order-item">
                    <span className="order-item-name">
                      {item.name} x{cartItems[item._id]}
                    </span>
                    <span className="order-item-price">
                      BDT. {(item.price * cartItems[item._id]).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-summary-divider" />

              <div className="order-summary-totals">
                <div className="order-summary-row">
                  <span>Subtotal</span>
                  <span>BDT. {subtotal.toFixed(2)}</span>
                </div>
                <div className="order-summary-row">
                  <span>Delivery Fee</span>
                  <span>BDT. {deliveryFee.toFixed(2)}</span>
                </div>
                <div className="order-summary-divider" />
                <div className="order-summary-row order-summary-total">
                  <span>Total</span>
                  <span>BDT. {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaceOrder