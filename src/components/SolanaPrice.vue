<script setup>
import { computed } from "vue";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const numberFormater = new Intl.NumberFormat("en-US", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const props = defineProps(["value"]);
const price = computed(() => {
  if (typeof props.value === "undefined") {
    return "--";
  }
  return numberFormater.format(props.value.toNumber() / LAMPORTS_PER_SOL);
});
</script>
<template>
  <span>&#x25ce; {{ price }}</span>
</template>
