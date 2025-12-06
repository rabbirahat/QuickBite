import React, { useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Cart.css';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';

const Cart = () => {
  const { cartItems, food_list, addToCart, removeFromCart, getTotalCartAmount } = useContext(StoreContext);
  const navigate = useNavigate();

  const cartList = useMemo(
    () =>
      food_list
        .filter((item) => cartItems[item._id] > 0)
        .map((item) => ({
          id: item._id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: cartItems[item._id],
        })),
    [food_list, cartItems]
  );

  const subtotal = getTotalCartAmount();
  const deliveryFee = cartList.length > 0 ? 50 : 0;
  const total = subtotal + deliveryFee;

  // Empty state
  if (cartList.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty-card">
          <div className="cart-empty-icon">
            <img src={assets.cart_empty_icon} alt="Empty cart" />
          </div>
          <h2 className="cart-empty-title">Your cart is empty</h2>
          <p className="cart-empty-text">Add some delicious food to get started!</p>
          <Link to="/" className="cart-empty-button">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <button className="cart-back-button" onClick={() => navigate('/')}>
        <span className="cart-back-icon">←</span>
        <span>Continue Shopping</span>
      </button>

      <h1 className="cart-title">Shopping Cart</h1>

      <div className="cart-layout">
        {/* Cart items list */}
        <div className="cart-items-panel">
          <div className="cart-items-card">
            {cartList.map((item) => (
              <div 
                className="cart-item-row" 
                key={item.id}
                onClick={() => navigate(`/food/${item.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <img src={item.image} alt={item.name} className="cart-item-image" />

                <div className="cart-item-main">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <p className="cart-item-price">BDT. {item.price}</p>
                  <div className="cart-item-qty-controls">
                    <button
                      className="cart-qty-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromCart(item.id)
                      }}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="cart-qty-value">{item.quantity}</span>
                    <button
                      className="cart-qty-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        addToCart(item.id)
                      }}
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-item-meta">
                  <button
                    className="cart-remove-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Remove all quantity for this item
                      for (let i = 0; i < item.quantity; i++) {
                        removeFromCart(item.id)
                      }
                    }}
                  >
                    <img src={assets.cart_remove_icon} alt="Remove" />
                  </button>
                  <span className="cart-item-total">BDT. {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="cart-summary-panel">
          <div className="cart-summary-card">
            <h2 className="cart-summary-title">Order Summary</h2>

            <div className="cart-summary-lines">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>BDT. {subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Delivery Fee</span>
                <span>BDT. {deliveryFee.toFixed(2)}</span>
              </div>
              <div className="cart-summary-divider" />
              <div className="cart-summary-row cart-summary-row-total">
                <span>Total</span>
                <span>BDT. {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="cart-promo-card">
              <p className="cart-promo-text">If you have any promo code enter here</p>
              <div className="cart-promo-input">
                <input type="text" placeholder="Promo code" />
                <button>Submit</button>
              </div>
            </div>

            <button
              className="cart-summary-button"
              onClick={() => navigate('/placeorder')}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
