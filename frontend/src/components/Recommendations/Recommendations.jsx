import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { recommendationAPI } from '../../utils/api'
import FoodItem from '../FoodItem/FoodItem'
import { food_list as static_food_list } from '../../assets/assets'
import './Recommendations.css'

const Recommendations = ({ topN = 3 }) => {
  const [nmfRecommendations, setNmfRecommendations] = useState([])
  const [knnRecommendations, setKnnRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

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

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const response = await recommendationAPI.getMyRecommendations(topN)
        console.log('Recommendations API response:', response)

        if (response.success) {
          // Backend now returns both algorithms under data: { nmf: [...], knn: [...] }
          const data = response.data

          // Backward-compatibility: if data is just an array, treat it as NMF only
          if (Array.isArray(data)) {
            setNmfRecommendations(data)
            setKnnRecommendations([])
            console.log(`Loaded ${data.length} NMF recommendations (legacy format)`)
          } else if (data && (Array.isArray(data.nmf) || Array.isArray(data.knn))) {
            const nmfRecs = Array.isArray(data.nmf) ? data.nmf : []
            const knnRecs = Array.isArray(data.knn) ? data.knn : []

            setNmfRecommendations(nmfRecs)
            setKnnRecommendations(knnRecs)

            console.log(`Loaded ${nmfRecs.length} NMF recommendations and ${knnRecs.length} kNN recommendations`)

            if (nmfRecs.length === 0 && knnRecs.length === 0) {
              setError(response.message || 'No recommendations available. Try rating more foods!')
            }
          } else {
            setError(response.message || 'No recommendations available. Try rating more foods!')
            setNmfRecommendations([])
            setKnnRecommendations([])
          }
        } else {
          setError(response.message || 'No recommendations available')
          setNmfRecommendations([])
          setKnnRecommendations([])
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err)
        setError(err.message || 'Failed to load recommendations')
        setNmfRecommendations([])
        setKnnRecommendations([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [isAuthenticated, topN])

  if (!isAuthenticated) {
    return (
      <div className="recommendations-section">
        <h2 className="recommendations-title">Personalized Recommendations</h2>
        <p className="recommendations-message">
          Please <button 
            onClick={() => navigate('/login')} 
            className="login-link-btn"
          >
            login
          </button> to see personalized food recommendations based on your ratings!
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="recommendations-section">
        <h2 className="recommendations-title">Personalized Recommendations</h2>
        <p className="recommendations-loading">Loading recommendations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="recommendations-section">
        <h2 className="recommendations-title">Personalized Recommendations</h2>
        <p className="recommendations-error">{error}</p>
      </div>
    )
  }

  if (nmfRecommendations.length === 0 && knnRecommendations.length === 0) {
    return (
      <div className="recommendations-section">
        <h2 className="recommendations-title">Personalized Recommendations</h2>
        <p className="recommendations-message">
          Rate some foods to get personalized recommendations based on your preferences!
        </p>
      </div>
    )
  }

  return (
    <div className="recommendations-section">
      <h2 className="recommendations-title">
        Recommended for You
        <span className="recommendations-subtitle">
          Based on your ratings using two algorithms: NMF and user-based kNN
        </span>
      </h2>

      <div className="recommendations-algo-container">
        {/* NMF Recommendations */}
        {nmfRecommendations.length > 0 && (
          <div className="recommendations-block">
            <h3 className="recommendations-algo-title">
              NMF-based Recommendations
              <span className="recommendations-algo-subtitle">
                Model-based collaborative filtering (matrix factorization)
              </span>
            </h3>
            <div className="recommendations-list">
              {nmfRecommendations.map((rec, index) => {
                const staticFood = static_food_list.find(f => f._id === rec.food._id);
                const foodImage = staticFood?.image || rec.food.image || '';
                const foodDescription = staticFood?.description || rec.food.description || '';
                const foodPrice = staticFood?.price || rec.food.price || 0;
                
                return (
                  <div key={rec.food._id || `nmf-${index}`} className="recommendation-item-wrapper">
                    <FoodItem
                      id={rec.food._id}
                      name={rec.food.name}
                      description={foodDescription}
                      price={foodPrice}
                      image={foodImage}
                    />
                    <div className="predicted-rating-badge">
                      <span className="predicted-rating-label">Predicted Rating (NMF):</span>
                      <span className="predicted-rating-value">
                        {rec.predictedRating && rec.predictedRating > 0 
                          ? `${rec.predictedRating.toFixed(1)} ⭐` 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="recommendations-note">
              NMF learns hidden patterns from your rating history and uses them to predict foods you may like.
            </p>
          </div>
        )}

        {/* kNN Recommendations */}
        {knnRecommendations.length > 0 && (
          <div className="recommendations-block">
            <h3 className="recommendations-algo-title">
              kNN-based Recommendations
              <span className="recommendations-algo-subtitle">
                User-based collaborative filtering (k-nearest neighbors)
              </span>
            </h3>
            <div className="recommendations-list">
              {knnRecommendations.map((rec, index) => {
                const staticFood = static_food_list.find(f => f._id === rec.food._id);
                const foodImage = staticFood?.image || rec.food.image || '';
                const foodDescription = staticFood?.description || rec.food.description || '';
                const foodPrice = staticFood?.price || rec.food.price || 0;
                
                return (
                  <div key={rec.food._id || `knn-${index}`} className="recommendation-item-wrapper">
                    <FoodItem
                      id={rec.food._id}
                      name={rec.food.name}
                      description={foodDescription}
                      price={foodPrice}
                      image={foodImage}
                    />
                    <div className="predicted-rating-badge">
                      <span className="predicted-rating-label">Predicted Rating (kNN):</span>
                      <span className="predicted-rating-value">
                        {rec.predictedRating && rec.predictedRating > 0 
                          ? `${rec.predictedRating.toFixed(1)} ⭐` 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="recommendations-note">
              kNN looks at users with similar ratings to you and recommends foods they enjoyed.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Recommendations

