<script setup>
import VueCountdown from "@chenfengyuan/vue-countdown";

const props = defineProps(["value"]);

const time = new Date(props.value * 1000) - new Date();
const fixDigits = (props) => {
  const formattedProps = {};

  Object.entries(props).forEach(([key, value]) => {
    formattedProps[key] = value < 10 ? `0${value}` : String(value);
  });

  return formattedProps;
};
</script>
<template>
  <div v-if="props.value">
    <vue-countdown
      :time="time"
      :transform="fixDigits"
      v-slot="{ days, hours, minutes, seconds }"
      class="flex flex-row flex-nowrap justify-between"
    >
      <div class="p-1 rounded-lg shadow-md text-center bg-gray-600 w-12">
        <strong>{{ days }}</strong>
        <label class="text-xs block">days</label>
      </div>
      <div class="p-1 rounded-lg shadow-md text-center bg-gray-600 w-12">
        <strong>{{ hours }}</strong>
        <label class="text-xs block">hrs</label>
      </div>
      <div class="p-1 rounded-lg shadow-md text-center bg-gray-600 w-12">
        <strong>{{ minutes }}</strong>
        <label class="text-xs block">mins</label>
      </div>
      <div class="p-1 rounded-lg shadow-md text-center bg-gray-600 w-12">
        <strong>{{ seconds }}</strong>
        <label class="text-xs block">secs</label>
      </div>
    </vue-countdown>
  </div>
</template>
