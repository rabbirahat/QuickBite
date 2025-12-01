import React, { useContext, useState } from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'

const FoodDisplay = ({ category }) => {

  const { food_list } = useContext(StoreContext)
  const [sortOption, setSortOption] = useState('default')

  const filteredFoods = food_list.filter((item) => {
    return category === 'All' || item.category === category
  })

  const sortedFoods = [...filteredFoods].sort((a, b) => {
    if (sortOption === 'priceLowHigh') {
      return a.price - b.price
    }
    if (sortOption === 'priceHighLow') {
      return b.price - a.price
    }
    return 0
  })

  return (
    <div className='food-display' id='food-display'>
      <div className="food-display-header">
        <h2>
          {category === "All"
            ? "Top dishes for you"
            : `${category} for you`}
        </h2>
        <div className="food-display-filters">
          <label htmlFor="food-sort">Sort by:</label>
          <select
            id="food-sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="priceLowHigh">Price: Low to High</option>
            <option value="priceHighLow">Price: High to Low</option>
          </select>
        </div>
      </div>
      <div className="food-display-list">
        {sortedFoods.map((item,index) => (
          <FoodItem
            key={index}
            id={item._id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
          />
        ))}
      </div>
    </div>
  )
}

export default FoodDisplay
