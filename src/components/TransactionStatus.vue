<script setup>
import { SOLANA_NETWORK } from "@/constants";
const props = defineProps(["transaction"]);
</script>
<template>
  <div class="flex items-center space-x-4">
    <div class="flex-shrink-0">
      <font-awesome-icon
        icon="xmark"
        class="text-red-500"
        v-if="props.transaction.error"
      ></font-awesome-icon>
      <font-awesome-icon
        icon="check"
        class="text-green-600"
        v-else-if="props.transaction.status"
      ></font-awesome-icon>
      <font-awesome-icon icon="circle-notch" spin v-else></font-awesome-icon>
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-red-500" v-if="props.transaction.error">
        {{ props.transaction.error }}
      </p>
      <p v-else-if="props.transaction.status" class="truncate ...">
        <a
          :href="`https://explorer.solana.com/tx/${props.transaction.status}?cluster=${SOLANA_NETWORK}`"
          target="_blank"
        >
          {{ props.transaction.status }}
        </a>
      </p>
      <p v-else><i>Loading...</i></p>
    </div>
  </div>
</template>
