import * as web3 from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  MintLayout,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { sendTransactions } from "@/lib/connection";
import {
  CANDY_MACHINE_PROGRAM,
  CIVIC,
  TOKEN_METADATA_PROGRAM_ID,
} from "@/constants";

const getMetadata = async (mint) => {
  const result = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return result[0];
};

const getMasterEdition = async (mint) => {
  const result = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return result[0];
};

const getCandyMachineCreator = async (candyMachine) => {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from("candy_machine"), candyMachine.toBuffer()],
    CANDY_MACHINE_PROGRAM
  );
};

const getCollectionPDA = async (candyMachineAddress) => {
  const result = await web3.PublicKey.findProgramAddress(
    [Buffer.from("collection"), candyMachineAddress.toBuffer()],
    CANDY_MACHINE_PROGRAM
  );
  return result[0];
};

const getCollectionAuthorityRecordPDA = async (mint, newAuthority) => {
  const result = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("collection_authority"),
      newAuthority.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return result[0];
};

export const getGatekeeperNetworkExpire = async (gatekeeperNetwork) => {
  const [account] = await web3.PublicKey.findProgramAddress(
    [gatekeeperNetwork.toBuffer(), Buffer.from("expire")],
    CIVIC
  );
  return account;
};

export const getGatekeeperNetworkToken = async (wallet, gatekeeperNetwork) => {
  const [account] = await web3.PublicKey.findProgramAddress(
    [
      wallet.toBuffer(),
      Buffer.from("gateway"),
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
      gatekeeperNetwork.toBuffer(),
    ],
    CIVIC
  );
  return account;
};

export const doMint = async (candyMachine, wallet, amount, progress, fail) => {
  const connection = candyMachine.program.provider.connection;
  const instructionsMatrix = [];
  const signersMatrix = [];
  for (let i = 0; i < amount; i++) {
    const { transactions, signers } = await getMintTransaction(
      candyMachine,
      wallet
    );
    instructionsMatrix.push(...transactions);
    signersMatrix.push(...signers);
  }
  return await sendTransactions(
    connection,
    wallet,
    instructionsMatrix,
    signersMatrix,
    "singleGossip",
    progress,
    fail
  );
};

export const getMintTransaction = async (candyMachine, wallet) => {
  const payer = wallet.publicKey;
  const connection = candyMachine.program.provider.connection;
  const mint = web3.Keypair.generate();
  const candyMachineAddress = new web3.PublicKey(candyMachine.id);
  const userTokenAccountAddress = await getAssociatedTokenAddress(
    mint.publicKey,
    payer
  );

  const userPayingAccountAddress = candyMachine.tokenMint
    ? await getAssociatedTokenAddress(candyMachine.tokenMint, payer)
    : payer;

  const remainingAccounts = [];
  const signers = [mint];

  const instructions = [
    web3.SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mint.publicKey,
      space: MintLayout.span,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(mint.publicKey, 0, payer, payer),
    createAssociatedTokenAccountInstruction(
      payer,
      userTokenAccountAddress,
      payer,
      mint.publicKey
    ),
    createMintToInstruction(mint.publicKey, userTokenAccountAddress, payer, 1),
  ];

  if (candyMachine.gatekeeper) {
    remainingAccounts.push({
      pubkey: await getGatekeeperNetworkToken(
        payer,
        candyMachine.gatekeeper.gatekeeperNetwork
      ),
      isWritable: true,
      isSigner: false,
    });

    if (candyMachine.gatekeeper.expireOnUse) {
      remainingAccounts.push({
        pubkey: CIVIC,
        isWritable: false,
        isSigner: false,
      });
      remainingAccounts.push({
        pubkey: await getGatekeeperNetworkExpire(
          payer,
          candyMachine.gatekeeper.gatekeeperNetwork
        ),
        isWritable: false,
        isSigner: false,
      });
    }
  }

  if (candyMachine.whitelistMintSettings) {
    const whitelistMint = new web3.PublicKey(
      candyMachine.whitelistMintSettings.mint
    );

    const whitelistToken = await getAssociatedTokenAddress(
      whitelistMint,
      payer
    );
    remainingAccounts.push({
      pubkey: whitelistToken,
      isWritable: true,
      isSigner: false,
    });

    if (candyMachine.whitelistMintSettings.mode.burnEveryTime) {
      remainingAccounts.push({
        pubkey: whitelistMint,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts.push({
        pubkey: payer,
        isWritable: false,
        isSigner: true,
      });
    }
  }

  if (candyMachine.tokenMint) {
    remainingAccounts.push({
      pubkey: userPayingAccountAddress,
      isWritable: true,
      isSigner: false,
    });
    remainingAccounts.push({
      pubkey: payer,
      isWritable: false,
      isSigner: true,
    });
  }

  const metadataAddress = await getMetadata(mint.publicKey);
  const masterEdition = await getMasterEdition(mint.publicKey);

  const [candyMachineCreator, creatorBump] = await getCandyMachineCreator(
    candyMachineAddress
  );

  instructions.push(
    await candyMachine.program.instruction.mintNft(creatorBump, {
      accounts: {
        candyMachine: candyMachineAddress,
        candyMachineCreator,
        payer: payer,
        wallet: candyMachine.treasury,
        mint: mint.publicKey,
        metadata: metadataAddress,
        masterEdition,
        mintAuthority: payer,
        updateAuthority: payer,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
        clock: web3.SYSVAR_CLOCK_PUBKEY,
        recentBlockhashes: web3.SYSVAR_SLOT_HASHES_PUBKEY,
        instructionSysvarAccount: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      },
      remainingAccounts:
        remainingAccounts.length > 0 ? remainingAccounts : undefined,
    })
  );

  const collectionPDA = await getCollectionPDA(candyMachineAddress);
  const collectionPDAAccount = await connection.getAccountInfo(collectionPDA);

  if (collectionPDAAccount && candyMachine.retainAuthority) {
    try {
      const collectionData =
        await candyMachine.program.account.collectionPda.fetch(collectionPDA);
      const collectionMint = collectionData.mint;
      const collectionAuthorityRecord = await getCollectionAuthorityRecordPDA(
        collectionMint,
        collectionPDA
      );
      if (collectionMint) {
        const collectionMetadata = await getMetadata(collectionMint);
        const collectionMasterEdition = await getMasterEdition(collectionMint);
        instructions.push(
          await candyMachine.program.instruction.setCollectionDuringMint({
            accounts: {
              candyMachine: candyMachine.id,
              metadata: metadataAddress,
              payer: payer,
              collectionPda: collectionPDA,
              tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
              instructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
              collectionMint,
              collectionMetadata,
              collectionMasterEdition,
              authority: candyMachine.authority,
              collectionAuthorityRecord,
            },
          })
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  const instructionsMatrix = [];
  const signersMatrix = [];

  const txnEstimate =
    892 +
    (collectionPDAAccount && candyMachine.retainAuthority ? 182 : 0) +
    (candyMachine.tokenMint ? 66 : 0) +
    (candyMachine.whitelistMintSettings ? 34 : 0) +
    (candyMachine.whitelistMintSettings?.mode?.burnEveryTime ? 34 : 0) +
    (candyMachine.gatekeeper ? 33 : 0) +
    (candyMachine.gatekeeper?.expireOnUse ? 66 : 0);

  const INIT_INSTRUCTIONS_LENGTH = 4;
  const INIT_SIGNERS_LENGTH = 1;

  if (txnEstimate > 1230) {
    const initInstructions = instructions.splice(0, INIT_INSTRUCTIONS_LENGTH);
    instructionsMatrix.push(initInstructions);
    const initSigners = signers.splice(0, INIT_SIGNERS_LENGTH);
    signersMatrix.push(initSigners);
  }

  instructionsMatrix.push(instructions);
  signersMatrix.push(signers);

  return {
    transactions: instructionsMatrix,
    signers: signersMatrix,
  };
};
