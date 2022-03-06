import Vue from 'vue'
import App from '../views/popup.vue'

Vue.config.productionTip = false

new Vue({
  render: (h) => h(App)
}).$mount('#app')
