import { ref } from "vue";

const now = ref(Date.now() / 1000);

setInterval(function () {
  now.value = Date.now() / 1000;
}, 1000);

export default () => {
  return { currentTime: now };
};
