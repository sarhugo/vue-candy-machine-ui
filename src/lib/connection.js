import { Transaction, sendAndConfirmRawTransaction } from "@solana/web3.js";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";

export const sendTransactions = async (
  connection,
  wallet,
  instructionSet,
  signersSet,
  commitment,
  progressCallback,
  failCallback
) => {
  if (!wallet.publicKey) throw new WalletNotConnectedError();

  const unsignedTxns = [];

  const block = await connection.getRecentBlockhash();

  instructionSet.forEach((instructions, i) => {
    if (!instructions.length) {
      return;
    }
    const signers = signersSet[i];
    let transaction = new Transaction({
      recentBlockhash: block.blockhash,
      feePayer: wallet.publicKey,
    });
    instructions.forEach((instruction) => transaction.add(instruction));

    if (signers.length) {
      transaction.partialSign(...signers);
    }
    progressCallback && progressCallback(i, transaction, null);
    unsignedTxns.push(transaction);
  });

  const signedTxns = await wallet.signAllTransactions(unsignedTxns);
  const pendingTxns = [];

  for (let i = 0; i < signedTxns.length; i++) {
    const signedTxnPromise = sendAndConfirmRawTransaction(
      connection,
      signedTxns[i].serialize(),
      { commitment }
    );
    try {
      await signedTxnPromise.then((response) => {
        progressCallback && progressCallback(i, signedTxns[i], response);
        return response;
      });
      pendingTxns.push(signedTxnPromise);
    } catch (e) {
      failCallback && failCallback(i, signedTxns[i], e);
    }
  }

  return await Promise.all(pendingTxns);
};
