import "solana-wallets-vue/styles.css";
import "./index.css";

import { Buffer } from "buffer";
import SolanaWallets from "solana-wallets-vue";
import {
  MathWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleNotch,
  faCheck,
  faChevronDown,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import { SOLANA_NETWORK } from "./constants";
import { createApp } from "vue";
import { createPinia } from "pinia";
import Timer from "./plugins/pinia/timer";
import App from "./App.vue";

window.Buffer = Buffer;
library.add(faCircleNotch, faCheck, faChevronDown, faXmark);

const walletOptions = {
  wallets: [
    new PhantomWalletAdapter({ network: SOLANA_NETWORK }),
    new SolflareWalletAdapter({ network: SOLANA_NETWORK }),
    new MathWalletAdapter({ network: SOLANA_NETWORK }),
  ],
  autoConnect: false,
};

const app = createApp(App);

app.component("font-awesome-icon", FontAwesomeIcon);
app.use(SolanaWallets, walletOptions);
app.use(createPinia().use(Timer));

app.mount("#app");
