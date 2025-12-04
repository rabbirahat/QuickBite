import { createContext, useEffect, useState } from "react";
import { food_list } from "../assets/assets";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {

    const [cartItems, setCartItems] = useState({});
    const [reviews, setReviews] = useState({});

    const addToCart = (itemId) => {
        if (!cartItems[itemId]) {
            setCartItems((prev) => ({ ...prev, [itemId]: 1 }))
        }
        else {
            setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }))
        }
    }

    const removeFromCart = (itemId) => {
        setCartItems((prev) => {
            const current = prev[itemId] || 0
            const next = Math.max(0, current - 1)
            return { ...prev, [itemId]: next }
        })
    }

    const setItemQuantity = (itemId, quantity) => {
        const qty = Math.max(0, Number(quantity) || 0)
        setCartItems((prev) => ({ ...prev, [itemId]: qty }))
    }

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = food_list.find((product) => product._id === item)
                totalAmount += itemInfo.price * cartItems[item];
            }
        }
        return totalAmount;
    }

    // Review functions
    const addReview = (foodId, review) => {
        setReviews((prev) => {
            const existingReviews = prev[foodId] || [];
            return {
                ...prev,
                [foodId]: [...existingReviews, review]
            };
        });
    }

    const getReviewsForFood = (foodId) => {
        return reviews[foodId] || [];
    }

    // Load reviews from localStorage on mount
    useEffect(() => {
        const savedReviews = localStorage.getItem('foodReviews');
        if (savedReviews) {
            setReviews(JSON.parse(savedReviews));
        }
    }, []);

    // Save reviews to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('foodReviews', JSON.stringify(reviews));
    }, [reviews]);

    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        setItemQuantity,
        getTotalCartAmount,
        addReview,
        getReviewsForFood
    }

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider;