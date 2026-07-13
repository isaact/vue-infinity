import { createApp } from "vue";
import App from "./App.vue";

// No registerElements() here — elements demo is separate

const app = createApp(App);
app.mount("#app");
