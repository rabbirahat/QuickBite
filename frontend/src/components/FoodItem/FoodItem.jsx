import React, { useState } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'

const FoodItem = ({ id, name, price, description, image }) => {
  const [itemCount, setItemCount] = useState(0)

  return (
    <div className='food-item'>
      <div className="food-item-img-container">
        <img src={image} alt={name} className="food-item-image" />

        {!itemCount ? (
          <img
            className="add"
            onClick={() => setItemCount(prev => prev + 1)}
            src={assets.add_icon_white}
            alt="add"
          />
        ) : (
          <div className='food-item-counter'>
            <img
              onClick={() => setItemCount(prev => Math.max(prev - 1, 0))}
              src={assets.remove_icon_red}
              alt="remove"
            />
            <p>{itemCount}</p>
            <img
              onClick={() => setItemCount(prev => prev + 1)}
              src={assets.add_icon_green}
              alt="add"
            />
          </div>
        )}
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name}</p>
          <img src={assets.rating_starts} alt="rating" />
        </div>
        <p className="food-tem-desc">{description}</p>
        <p className="food-item-price">BDT. {price}</p>
      </div>
    </div>
  )
}

export default FoodItem
