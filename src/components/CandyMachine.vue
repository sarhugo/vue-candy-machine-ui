<script setup>
import { ref, computed } from "vue";
import { useCandyMachineStore } from "@/stores/candy-machine";
import CandyMachineStatus from "@/components/CandyMachineStatus.vue";
import MintButton from "@/components/MintButton.vue";
import SolanaPrice from "@/components/SolanaPrice.vue";
import TransactionStatus from "@/components/TransactionStatus.vue";

const candyMachine = useCandyMachineStore();
const transactions = ref({});

const mintInit = () => {
  transactions.value = {};
};
const mintProgress = (i, tx, response) => {
  transactions.value[i] = { tx, status: response };
};
const mintFail = (i, tx, error) => {
  let message = error.msg;
  switch (error.code) {
    case 311:
      message = "SOLD OUT!";
      break;
    case 312:
      message = "Minting period hasn't started yet.";
      break;
  }
  if (!message) {
    if (error.message.indexOf("0x137") > -1) {
      message = "SOLD OUT!";
    } else if (
      error.message.indexOf("0x135") > -1 ||
      error.message.indexOf("0x1778") > -1
    ) {
      message = "Insufficient funds to mint. Please fund your wallet.";
    } else {
      message = error.message;
    }
  }
  transactions.value[i].error = message;
};
const mintError = (err) => {
  transactions.value = {
    global: { error: err.message },
  };
};
const isMinting = computed(() => {
  return !!Object.keys(transactions.value).length;
});
</script>
<template>
  <div
    class="p-6 w-full max-w-lg rounded-lg border shadow-md bg-gray-800 border-gray-700 my-6"
  >
    <div
      v-if="candyMachine.loaded"
      class="flex flex-row justify-center flex-nowrap"
    >
      <div class="w-1/4">
        <p class="text-sm">Remaining</p>
        <h6 class="text-lg font-bold">{{ candyMachine.itemsRemaining }}</h6>
      </div>
      <div class="w-1/4">
        <p class="text-sm">
          {{ candyMachine.discount ? "Discount Price" : "Price" }}
        </p>
        <h6 class="text-lg font-bold whitespace-nowrap">
          <solana-price
            :value="candyMachine.discount || candyMachine.price"
          ></solana-price>
        </h6>
      </div>
      <div class="w-1/2">
        <candy-machine-status></candy-machine-status>
      </div>
    </div>

    <mint-button
      @mint="mintInit"
      @progress="mintProgress"
      @fail="mintFail"
      @error="mintError"
    ></mint-button>
  </div>
  <div
    v-if="isMinting"
    class="p-6 w-full max-w-lg rounded-lg border shadow-md bg-gray-800 border-gray-700 my-6"
  >
    <h5 class="mb-5 text-xl font-bold leading-none text-white">
      Running transactions
    </h5>
    <div class="flow-root">
      <ul role="list" class="divide-y divide-gray-700">
        <li class="py-3 sm:py-4" v-for="(tx, i) in transactions" :key="i">
          <transaction-status :transaction="tx"></transaction-status>
        </li>
      </ul>
    </div>
  </div>
</template>
