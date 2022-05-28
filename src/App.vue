<script setup>
import { onMounted, watch } from "vue";
import { WalletMultiButton } from "solana-wallets-vue";
import CandyMachine from "@/components/CandyMachine.vue";
import { CANDY_MACHINE_ID, RPC_URL } from "@/constants";
import { useCandyMachineStore } from "@/stores/candy-machine";
import { useSolanaStore } from "@/stores/solana";

const cm = useCandyMachineStore();
const wallet = useSolanaStore();

watch(
  () => cm.loaded && wallet.wallet,
  () => {
    cm.checkWallet(wallet.wallet);
  },
  { immediate: true }
);

onMounted(async () => {
  await cm.load(RPC_URL, CANDY_MACHINE_ID);
});
</script>

<template>
  <main class="h-screen flex flex-col justify-center items-center">
    <wallet-multi-button dark></wallet-multi-button>
    <candy-machine></candy-machine>
  </main>
</template>
