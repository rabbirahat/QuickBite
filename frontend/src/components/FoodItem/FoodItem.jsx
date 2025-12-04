import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'

const FoodItem = ({ id, name, price, description, image }) => {

  const navigate = useNavigate()
  const {cartItems, addToCart, removeFromCart} = useContext(StoreContext)

  const handleViewDetails = () => {
    navigate(`/food/${id}`)
  }

  return (
    <div className='food-item' onClick={handleViewDetails}>
      <div className="food-item-img-container">
        <img src={image} alt="" className="food-item-image" />

        {!cartItems[id] ? (
          <img
            className="add"
            onClick={(e) => {
              e.stopPropagation()
              addToCart(id)
            }}
            src={assets.add_icon_white}
            alt=""
          />
        ) : (
          <div className='food-item-counter'>
            <img
              onClick={(e) => {
                e.stopPropagation()
                removeFromCart(id)
              }}
              src={assets.remove_icon_red}
              alt=""
            />
            <p>{cartItems[id]}</p>
            <img
              onClick={(e) => {
                e.stopPropagation()
                addToCart(id)
              }}
              src={assets.add_icon_green}
              alt=""
            />
          </div>
        )}
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name}</p>
          {/* <img src={assets.rating_starts} alt="rating" /> */}
        </div>
        <p className="food-tem-desc">{description}</p>
        <p className="food-item-price">BDT. {price}</p>
      </div>
    </div>
  )
}

export default FoodItem
