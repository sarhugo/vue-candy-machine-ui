<script setup>
import { useCandyMachineStore } from "@/stores/candy-machine";
import TimeCountdown from "@/components/TimeCountdown.vue";
const cm = useCandyMachineStore();
</script>
<template>
  <template v-if="cm.isActive">
    <template v-if="cm.endDate">
      <time-countdown :value="cm.endDate"></time-countdown>
      <div class="my-1 text-center uppercase font-bold text-sm">
        To end of mint
      </div>
    </template>
    <template v-else>
      <div class="p-1 rounded-lg shadow-md text-center bg-gray-600">
        <strong class="text-lg uppercase">Live</strong>
      </div>
    </template>
  </template>

  <template v-else-if="cm.isSoldOut || cm.hasEnded">
    <div class="p-1 rounded-lg shadow-md text-center bg-gray-600">
      <strong class="text-lg uppercase">Completed</strong>
    </div>
  </template>

  <template v-else-if="cm.isFuture">
    <time-countdown :value="cm.goLiveDate"></time-countdown>
    <div
      v-if="cm.isPresale"
      class="my-1 text-center uppercase font-bold text-sm"
    >
      Until public mint
    </div>
  </template>

  <template v-else-if="cm.isPresale">
    <div class="p-1 rounded-lg shadow-md text-center bg-gray-600">
      <strong class="text-lg uppercase">Presale</strong>
    </div>
  </template>

  <template v-else-if="cm.whitelistMintSettings">
    <div class="p-1 rounded-lg shadow-md text-center bg-gray-600">
      <strong class="text-lg uppercase">LIVE</strong>
    </div>
  </template>
</template>
