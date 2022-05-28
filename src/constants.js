import { PublicKey } from "@solana/web3.js";

export const CANDY_MACHINE_PROGRAM = new PublicKey(
  "cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ"
);
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const CIVIC = new PublicKey(
  "gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs"
);

export const SOLANA_NETWORK = import.meta.env.VITE_SOLANA_NETWORK.toString();
export const RPC_URL = import.meta.env.VITE_SOLANA_RPC_HOST.toString();
export const CANDY_MACHINE_ID =
  import.meta.env.VITE_CANDY_MACHINE_ID.toString();
