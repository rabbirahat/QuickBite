import React from 'react'
import Navbar from './components/Navbar/Navbar'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import Footer from './components/Footer/Footer'
import { LoginPage } from './pages/Login/LoginPage'
import { SignupPage } from './pages/Signup/SignupPage'
import ForgotPasswordPage from './pages/Login/ForgotPasswordPage'

const App = () => {
  return (
    <>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/placeorder' element={<PlaceOrder />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />
          <Route path='/signup' element={<SignupPage />} />
        </Routes>
      </div>
      <Footer />
    </>

  )
}

export default App
