import { defineStore } from "pinia";
import { useAnchorWallet } from "solana-wallets-vue";

export const useSolanaStore = defineStore("solana", () => {
  const wallet = useAnchorWallet();
  return {
    wallet,
  };
});
