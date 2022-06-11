import { defineStore } from "pinia";
import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Program, Provider } from "@project-serum/anchor";
import { RPC_URL, CANDY_MACHINE_ID, CANDY_MACHINE_PROGRAM } from "@/constants";
import { doMint } from "@/lib/utils";

const connection = new Connection(RPC_URL);

export const useCandyMachineStore = defineStore({
  id: "candyMachine",
  state: () => ({
    id: CANDY_MACHINE_ID,
    checkingWallet: false,
    program: null,
    itemsAvailable: 0,
    itemsRedeemed: 0,
    goLiveDate: null,
    treasury: null,
    tokenMint: null,
    gatekeeper: null,
    endDate: null,
    endMinted: null,
    whitelistMintSettings: null,
    isWhiteListed: 0,
    authority: null,
    retainAuthority: false,
    hiddenSettings: null,
    price: 0,
    balance: new BN(0),
    loaded: false,
  }),
  getters: {
    isActive: (state) =>
      state.loaded &&
      state.goLiveDate &&
      !state.isFuture &&
      !state.hasEnded &&
      !state.isSoldOut,
    itemsRemaining: (state) =>
      Math.min(
        state.endMinted || Number.POSITIVE_INFINITY,
        state.itemsAvailable
      ) - state.itemsRedeemed,
    isSoldOut: (state) => state.itemsRemaining === 0,
    isFuture: (state) =>
      state.loaded && state.goLiveDate && state.goLiveDate > state.currentTime,
    isPresale: (state) =>
      (!state.goLiveDate || state.isFuture) &&
      state.whitelistMintSettings.presale,
    isWhitelistOnly: (state) =>
      !state.goLiveDate && state.whitelistMintSettings,
    hasEnded: (state) =>
      state.loaded &&
      ((state.endDate && state.endDate <= state.currentTime) ||
        (state.endMinted && state.itemsRedeemed >= state.endMinted)),
    discount: (state) =>
      state.isWhiteListed && state.whitelistMintSettings.discountPrice,
    maxAvailable: (state) => {
      if (!state.loaded) {
        return 0;
      }
      if (state.discount) {
        return Math.min(
          state.itemsRemaining,
          state.isWhiteListed,
          state.discount.isZero()
            ? Number.POSITIVE_INFINITY
            : state.balance.div(state.discount)
        );
      }
      if (state.isWhiteListed) {
        return Math.min(
          state.itemsRemaining,
          state.isWhiteListed,
          state.price.isZero()
            ? Number.POSITIVE_INFINITY
            : state.balance.div(state.price)
        );
      }
      return Math.min(
        state.itemsRemaining,
        state.price.isZero()
          ? Number.POSITIVE_INFINITY
          : state.balance.div(state.price)
      );
    },
  },
  actions: {
    async load() {
      try {
        if (!this.program) {
          const provider = new Provider(connection);
          const idl = await Program.fetchIdl(CANDY_MACHINE_PROGRAM, provider);
          this.program = new Program(idl, CANDY_MACHINE_PROGRAM, provider);
        }
        const state = await this.program.account.candyMachine.fetch(
          CANDY_MACHINE_ID
        );
        this.$patch({
          itemsAvailable: state.data.itemsAvailable.toNumber(),
          itemsRedeemed: state.itemsRedeemed.toNumber(),
          goLiveDate: state.data.goLiveDate?.toNumber(),
          treasury: state.wallet,
          tokenMint: state.tokenMint,
          gatekeeper: state.data.gatekeeper,
          endMinted:
            state.data.endSettings &&
            state.data.endSettings.endSettingType.amount
              ? state.data.endSettings.number.toNumber()
              : null,
          endDate:
            state.data.endSettings && state.data.endSettings.endSettingType.date
              ? state.data.endSettings.number.toNumber()
              : null,
          whitelistMintSettings: state.data.whitelistMintSettings,
          authority: state.authority,
          retainAuthority: state.data.retainAuthority,
          hiddenSettings: state.data.hiddenSettings,
          price: state.data.price,
          loaded: true,
        });
      } catch (error) {
        console.error(error);
      }
    },
    async checkWallet(wallet) {
      let isWhiteListed = false;
      this.checkingWallet = true;
      if (wallet) {
        try {
          let balance;
          if (this.tokenMint) {
            const mint = new PublicKey(this.tokenMint);
            const token = await getAssociatedTokenAddress(
              mint,
              wallet.publicKey
            );
            balance = await connection.getTokenAccountBalance(token);
          } else {
            balance = await connection.getBalance(wallet.publicKey);
          }
          this.balance = new BN(balance);
          if (this.whitelistMintSettings) {
            const mint = new PublicKey(this.whitelistMintSettings.mint);
            const token = await getAssociatedTokenAddress(
              mint,
              wallet.publicKey
            );
            const balance = await connection.getTokenAccountBalance(token);
            isWhiteListed = parseInt(balance.value.amount);
          }
        } catch (e) {
          console.log("There was a problem fetching wallet balances");
          console.error(e);
        }
      }
      this.checkingWallet = false;
      this.isWhiteListed = isWhiteListed;
    },
    async mint(wallet, amount, progress, error) {
      const result = await doMint(this, wallet, amount, progress, error);
      this.itemsRedeemed += result.length;
      await this.checkWallet(wallet);
      return result;
    },
  },
});
