
const app = Vue.createApp({
    data() {
        return {
            ans:"_____"
        };
    },

    methods: {
        change(text){
          this.ans=text;
        }
    }
});
      

app.mount("#app");

