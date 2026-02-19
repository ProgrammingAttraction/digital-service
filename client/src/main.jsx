import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { FileOrderProvider } from './context/FileOrderContext.jsx'
import Textorder from './pages/order/Textorder.jsx'
import { RechargeProvider } from './context/RechargeContext.jsx'
import { OrderProvider } from './context/Ordercontext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { MenuProvider } from './context/MenuContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <NotificationProvider>
        <FileOrderProvider>
          <OrderProvider>
            <RechargeProvider>
              <MenuProvider>
                <ThemeProvider>
                  <App />
                </ThemeProvider>
              </MenuProvider>
            </RechargeProvider>
          </OrderProvider>
        </FileOrderProvider>
      </NotificationProvider>
    </UserProvider>
  </StrictMode>,
)
