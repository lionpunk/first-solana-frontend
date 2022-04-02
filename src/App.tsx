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
  const [dataList, setDataList] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");

  async function getProvider() {
    const network = "http:127.0.0.1:8899";
    const connection = new Connection(network, opts);
    const confirmOption: web3.ConfirmOptions = {
      commitment: "processed",
    };

    const provider = new Provider(connection, wallet as Wallet, confirmOption);
    return provider;
  }

  async function initialize() {
    const provider = await getProvider();
    const program = new Program(idl as Idl, programID, provider);
    console.log("provid==>", provider);

    try {
      if (provider) {
        await program.rpc.initialize("Hello World", {
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
      setValue(account.data.toString());
      setDataList(account.dataList);
    } catch (err) {
      console.log("Transaction error:", err);
    }
  }

  async function update() {
    const provider = await getProvider();
    const program = new Program(idl as Idl, programID, provider);
    await program.rpc.update(input, {
      accounts: {
        baseAccount: baseAccount.publicKey,
      },
    });

    const account = await program.account.baseAccount.fetch(
      baseAccount.publicKey
    );
    console.log("account:", account);
    setValue(account.data.toString());
    setDataList(account.dataList);
    setInput("");
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
        {!value && <button onClick={initialize}>Initialize</button>}
        {value ? (
          <div>
            <h2>Current value: {value}</h2>
            <input
              type="text"
              placeholder="Add new data"
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
            <button onClick={update}>Add data</button>
          </div>
        ) : (
          <h3>Please Initialize.</h3>
        )}
        {dataList.map((data, index) => (
          <h4 key={index}>{data}</h4>
        ))}
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
