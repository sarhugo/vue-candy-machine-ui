<script setup>
import { computed, ref } from "vue";
import { useCandyMachineStore } from "@/stores/candy-machine";
import { useSolanaStore } from "@/stores/solana";

const candyMachine = useCandyMachineStore();
const wallet = useSolanaStore();

const minting = ref(false);
const showOptions = ref(false);

const enabled = computed(() => {
  return (
    !minting.value &&
    wallet.wallet &&
    candyMachine.loaded &&
    candyMachine.maxAvailable &&
    (candyMachine.isActive ||
      (candyMachine.isPresale && candyMachine.isWhiteListed))
  );
});

const mintOptions = computed(() => {
  if (candyMachine.maxAvailable > 1) {
    const total = Math.min(candyMachine.maxAvailable, 5);
    return [...Array(total).keys()].map((i) => i + 1);
  }
  return false;
});
const label = computed(() => {
  if (!candyMachine.loaded) {
    return "...";
  }
  if (minting.value) {
    return "Minting...";
  }
  if (candyMachine.isSoldOut) {
    return "Sold Out";
  }
  if (!wallet.wallet) {
    return "Connect wallet to mint";
  }
  if (!candyMachine.maxAvailable) {
    return "Insufficient funds";
  }
  if (candyMachine.isPresale || candyMachine.isWhitelistOnly) {
    return "Whitelist mint";
  }
  return "Mint";
});
const emit = defineEmits(["mint", "progress", "error", "fail"]);

const mint = async (amount) => {
  minting.value = true;
  showOptions.value = false;
  emit("mint");
  try {
    await candyMachine.mint(
      wallet.wallet,
      amount,
      (tx, i, response) => {
        emit("progress", tx, i, response);
      },
      (tx, i, err) => {
        emit("fail", tx, i, err);
      }
    );
  } catch (e) {
    emit("error", e);
  }
  minting.value = false;
};
</script>
<template>
  <div v-if="candyMachine.loaded">
    <div class="relative flex flex-row my-5">
      <button
        class="p-5 grow rounded-sm bg-gradient-to-b from-blue-400 to-blue-900 text-white shadow font-bold uppercase inline-flex items-center justify-center disabled:text-gray-600 disabled:cursor-not-allowed rounded-tr-none rounded-br-none"
        :disabled="!enabled"
        @click="mint(1)"
      >
        <font-awesome-icon
          icon="circle-notch"
          spin
          v-if="minting"
        ></font-awesome-icon>
        {{ label }}
      </button>
      <button
        class="p-5 rounded-sm bg-gradient-to-b from-blue-400 to-blue-900 text-white shadow items-center justify-center disabled:text-gray-600 disabled:cursor-not-allowed rounded-tl-none rounded-bl-none"
        :disabled="!enabled"
        v-if="enabled && mintOptions"
        @click="showOptions = !showOptions"
      >
        <font-awesome-icon icon="chevron-down"></font-awesome-icon>
      </button>
      <ul
        v-show="showOptions && mintOptions"
        class="absolute top-full z-50 left-0 w-full bg-gradient-to-b from-blue-400 to-blue-900 text-white shadow font-bold uppercase cursor-pointer"
        role="menu"
      >
        <li class="p-5" v-for="i in mintOptions" @click="mint(i)" :key="i">
          Mint {{ i }} items
        </li>
      </ul>
    </div>
  </div>
</template>
