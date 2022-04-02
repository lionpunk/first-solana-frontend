import { Program, Provider, Wallet, web3 } from "@project-serum/anchor";
import { Idl } from "@project-serum/anchor/dist/cjs/idl";
import {
  ConnectionProvider,
  useAnchorWallet,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { Commitment, Connection, PublicKey } from "@solana/web3.js";
import React, { useState } from "react";
import "./App.css";
import idl from "./idl.json";
require("@solana/wallet-adapter-react-ui/styles.css");

const wallets = [new PhantomWalletAdapter()];
const { SystemProgram, Keypair } = web3;
const baseAccount = Keypair.generate();
const opts: Commitment = "processed";

const programID = new PublicKey(idl.metadata.address);

function App() {
  const wallet = useAnchorWallet();
  const [value, setValue] = useState(null);

  async function getProvider() {
    const network = "http:127.0.0.1:8899";
    const connection = new Connection(network, opts);
    const confirmOption: web3.ConfirmOptions = {
      commitment: "processed",
    };

    const provider = new Provider(connection, wallet as Wallet, confirmOption);
    return provider;
  }

  async function createCounter() {
    const provider = await getProvider();
    const program = new Program(idl as Idl, programID, provider);
    console.log("provid==>", provider);

    try {
      if (provider) {
        await program.rpc.create({
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          },
          signers: [baseAccount],
        });
      }
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );
      console.log("account:", account);
      setValue(account.count.toString());
    } catch (err) {
      console.log("Transaction error:", err);
    }
  }

  async function increment() {
    const provider = await getProvider();
    const program = new Program(idl as Idl, programID, provider);
    await program.rpc.increment({
      accounts: {
        baseAccount: baseAccount.publicKey,
      },
    });

    const account = await program.account.baseAccount.fetch(
      baseAccount.publicKey
    );
    console.log("account:", account);
    setValue(account.count.toString());
  }

  console.log("wallet ==>", wallet);
  if (!wallet) {
    return (
      <div>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="App">
      <div>
        {!value ? (
          <button onClick={createCounter}>Create counter</button>
        ) : (
          <button onClick={increment}>Increment counter</button>
        )}
        {value && value >= Number(0) ? (
          <h2>{value}</h2>
        ) : (
          <h3>Please create the counter.</h3>
        )}
      </div>
    </div>
  );
}

const AppWithProvider = (): JSX.Element => (
  <ConnectionProvider endpoint="http://127.0.0.1:8899">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);
export default AppWithProvider;
