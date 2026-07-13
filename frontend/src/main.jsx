import { StrictMode } from 'react' // this wraps the app to enable extra development-time checks and warnings
import { createRoot } from 'react-dom/client' // this is used to attach a React app to a real DOM node
import './index.css' // this loads the global stylesheet
import App from './App.jsx' // this is the root component defined in App.jsx

createRoot(document.getElementById('root')).render( // this finds the <div id="root"> in index.html and mounts React onto it
  <StrictMode> {/* this enables extra checks/warnings during development only, it has no effect in production */}
    <App /> {/* this renders the whole application */}
  </StrictMode>,
)
