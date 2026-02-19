import React from 'react'
import {BrowserRouter, Route, Routes, Navigate} from 'react-router-dom'
import Login from './pages/auth/login/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Register from './pages/auth/register/Register'
import Profile from './pages/profile/Profile'
import Allusers from './pages/users/allusers/Allusers'
import Activeusers from './pages/users/activeusers/Activeusers'
import Inactiveusers from './pages/users/inactiveusers/Inactiveusers'
import Depositmethod from './pages/method/Depositmethod'
import Methodlist from './pages/method/Methodlist'
import Bonushistory from './pages/bonus/Bonushistory'
import CreateBonus from './pages/bonus/Createbonus'
import Alldeposit from './pages/deposit/Alldeposit'
import Pendingdeposit from './pages/deposit/Pendingdeposit'
import Approveddeposit from './pages/deposit/Approveddeposit'
import Rejecteddeposit from './pages/deposit/Rejecteddeposit'
import NewService from './pages/services/Newservice'
import Serviceslist from './pages/services/Serviceslist'
import Allorders from './pages/order/allorders/Allorders'
import OrderDetails from './pages/order/orderdetails.jsx/Orderdetails'
import Updateorder from './pages/order/updateorder/Updateorder'
import Pendingorders from './pages/order/pendingorders/Pendingorders'
import Completeorders from './pages/order/completeorders/Completeorders'
import Cancelledorders from './pages/order/cancelledorders/Cancelledorders'
import Updateservice from './pages/services/Updateservice'
import Userdetails from './pages/users/userdetails/Userdetails'
import Updateuser from './pages/users/updateuser/Updateuser'
import APIlist from './pages/api/APIlist'
import Editmethod from './pages/method/Editmethod'
import Pricelist from './pages/price/Pricelist'
import Transaction from './pages/transaction/Transaction'
import Balancehistory from './pages/transaction/Balancehistory'
import Noticelist from './pages/nortice/Noticelist'
import Socialmedia from './pages/socialmedia/Socialmedia'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const admin = JSON.parse(localStorage.getItem('admin'));
  
  // Check if user is authenticated
  if (!token || !admin) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const admin = JSON.parse(localStorage.getItem('admin'));
  
  // If user is already authenticated, redirect to dashboard
  if (token && admin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - only accessible when NOT logged in */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }/>
        
        <Route path="/registration" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }/>

        {/* Protected routes - only accessible when logged in */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }/>
        
        {/* -----------------users------------------- */}
        <Route path="/admin/users/all" element={
          <ProtectedRoute>
            <Allusers />
          </ProtectedRoute>
        }/>
        <Route path="/admin/users/active" element={
          <ProtectedRoute>
            <Activeusers />
          </ProtectedRoute>
        }/>
        <Route path="/admin/users/inactive" element={
          <ProtectedRoute>
            <Inactiveusers />
          </ProtectedRoute>
        }/>
              <Route path="/admin/user/details/:id" element={
          <ProtectedRoute>
            <Userdetails />
          </ProtectedRoute>
        }/>
         <Route path="/admin/user/edit-details/:id" element={
          <ProtectedRoute>
            <Updateuser />
          </ProtectedRoute>
        }/>
        
       {/* ----------------------------deposit-method--------------------------- */}
       <Route path="/admin/payment-methods/add" element={
          <ProtectedRoute>
            <Depositmethod />
          </ProtectedRoute>
        }/>
        <Route path="/admin/payment-methods/all" element={
          <ProtectedRoute>
            <Methodlist />
          </ProtectedRoute>
        }/>
    <Route path="/admin/payment-methods/edit/:id" element={
          <ProtectedRoute>
            <Editmethod />
          </ProtectedRoute>
        }/>
       {/* ----------------------------deposit-method--------------------------- */}

              {/* ----------------------------bonus-system--------------------------- */}
       <Route path="/admin/bonus/offers" element={
          <ProtectedRoute>
            <CreateBonus />
          </ProtectedRoute>
        }/>
        <Route path="/admin/bonus/history" element={
          <ProtectedRoute>
            <Bonushistory />
          </ProtectedRoute>
        }/>

       {/* ----------------------------bonus-system--------------------------- */}


       
              {/* ----------------------------deposit--------------------------- */}
       <Route path="/admin/deposits/all" element={
          <ProtectedRoute>
            <Alldeposit />
          </ProtectedRoute>
        }/>

          <Route path="/admin/deposits/pending" element={
          <ProtectedRoute>
            <Pendingdeposit />
          </ProtectedRoute>
        }/>

          <Route path="/admin/deposits/approved" element={
          <ProtectedRoute>
            <Approveddeposit />
          </ProtectedRoute>
        }/>

          <Route path="/admin/deposits/rejected" element={
          <ProtectedRoute>
            <Rejecteddeposit />
          </ProtectedRoute>
        }/>


       {/* ----------------------------deposit--------------------------- */}


       {/* ----------------------------services--------------------------- */}
       <Route path="/admin/services/new" element={
          <ProtectedRoute>
            <NewService />
          </ProtectedRoute>
        }/>
     <Route path="/admin/services/all" element={
          <ProtectedRoute>
            <Serviceslist />
          </ProtectedRoute>
        }/>

     <Route path="/admin/service/edit/:id" element={
          <ProtectedRoute>
            <Updateservice />
          </ProtectedRoute>
        }/>


       {/* ----------------------------services--------------------------- */}



       {/* ----------------------------order--------------------------- */}
       <Route path="/admin/orders/all" element={
          <ProtectedRoute>
            <Allorders />
          </ProtectedRoute>
        }/>
   
   <Route path="/admin/orders/view/:id" element={
          <ProtectedRoute>
            <OrderDetails />
          </ProtectedRoute>
        }/>

 <Route path="/admin/orders/update/:id" element={
          <ProtectedRoute>
            <Updateorder />
          </ProtectedRoute>
        }/>
 <Route path="/admin/orders/pending" element={
          <ProtectedRoute>
            <Pendingorders />
          </ProtectedRoute>
        }/>

 <Route path="/admin/orders/completed" element={
          <ProtectedRoute>
            <Completeorders />
          </ProtectedRoute>
        }/>

 <Route path="/admin/orders/cancelled" element={
          <ProtectedRoute>
            <Cancelledorders />
          </ProtectedRoute>
        }/>

       {/* ----------------------------order--------------------------- */}

       {/* ----------------------------API--------------------------- */}

      <Route path="/admin/api-list" element={
          <ProtectedRoute>
            <APIlist />
          </ProtectedRoute>
        }/>

       {/* ----------------------------API--------------------------- */}

       {/* ---------------all-transaction------------------------ */}

       <Route path="/admin/transactions/all" element={
          <ProtectedRoute>
            <Transaction />
          </ProtectedRoute>
        }/>

       <Route path="/admin/transactions/balance-history" element={
          <ProtectedRoute>
            <Balancehistory />
          </ProtectedRoute>
        }/>



       {/* ---------------------all-transaction------------------ */}
     {/* ----------------------------price list--------------------------- */}

      <Route path="/admin/price-list" element={
          <ProtectedRoute>
            <Pricelist />
          </ProtectedRoute>
        }/>

       {/* ----------------------------price list--------------------------- */}

     {/* ----------------------------Notice list--------------------------- */}

      <Route path="/admin/notice-list" element={
          <ProtectedRoute>
            <Noticelist />
          </ProtectedRoute>
        }/>

       {/* ----------------------------Notice list--------------------------- */}

     {/* ----------------------------Notice list--------------------------- */}

      <Route path="/admin/social-media" element={
          <ProtectedRoute>
            <Socialmedia />
          </ProtectedRoute>
        }/>

       {/* ----------------------------Notice list--------------------------- */}

        <Route path="/admin/account/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }/>



        {/* Redirect root path based on authentication status */}
        <Route path="/" element={
          localStorage.getItem('adminToken') ? 
            <Navigate to="/dashboard" replace /> : 
            <Navigate to="/login" replace />
        }/>
        
        {/* Optional: 404 page */}
        <Route path="*" element={
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>404 - Page Not Found</h1>
          </div>
        }/>
      </Routes>
    </BrowserRouter>
  )
}

export default App