import { createApp } from 'vue'
import App from './App.vue'
import { registerElements } from '../src/elements'

// Register custom elements
registerElements()

const app = createApp(App)
app.mount('#app')