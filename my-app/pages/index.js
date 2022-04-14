import { BigNumber, Contract, providers, utils } from "ethers";
import Image from "next/image";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { LAUCOIN_CONTRACT_ABI, LAUCOIN_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // Create a BigNumber `0`
  const zero = BigNumber.from(0);
  // walletConnected keeps track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // balanceOfLaucoins keeps track of number of LauCoin owned by an address
  const [balanceOfLauCoin, setBalanceOfLauCoin] = useState(zero);
  // amount of the tokens that the user wants to mint
  const [tokenAmount, setTokenAmount] = useState(zero);
  // tokensMinted is the total number of tokens that have been minted till now out of 10000(max total supply)
  const [tokensMinted, setTokensMinted] = useState(zero);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();

  /**
   * getBalanceOfLauCoin: checks the balance of Crypto Dev Tokens's held by an address
   */
  const getBalanceOfLauCoin = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // Create an instace of token contract
      const tokenContract = new Contract(
        LAUCOIN_CONTRACT_ADDRESS,
        LAUCOIN_CONTRACT_ABI,
        provider
      );
      // We will get the signer now to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSigner(true);
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      // call the balanceOf from the token contract to get the number of tokens held by the user
      const balance = await tokenContract.balanceOf(address);
      // balance is already a big number, so we dont need to convert it before setting it
      setBalanceOfLauCoin(balance);
    } catch (err) {
      console.error(err);
      setBalanceOfLauCoin(zero);
    }
  };

  /**
   * mintLauCoin: mints `amount` number of tokens to a given address
   */
  const mintLauCoin = async (amount) => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      // Create an instance of tokenContract
      const signer = await getProviderOrSigner(true);
      // Create an instance of tokenContract
      const tokenContract = new Contract(
        LAUCOIN_CONTRACT_ADDRESS,
        LAUCOIN_CONTRACT_ABI,
        signer
      );
      // Each token is of `0.001 ether`. The value we need to send is `0.001 * amount`
      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        // value signifies the cost of one crypto dev token which is "0.001" eth.
        // We are parsing `0.001` string to ether using the utils library from ethers.js
        value: utils.parseEther(value.toString()),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("Sucessfully minted LauCoin 💁🏼‍♀️");
      await getBalanceOfLauCoin();
      await getTotalTokensMinted();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * getTotalTokensMinted: Retrieves how many tokens have been minted till now
   * out of the total supply
   */
  const getTotalTokensMinted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // Create an instance of token contract
      const tokenContract = new Contract(
        LAUCOIN_CONTRACT_ADDRESS,
        LAUCOIN_CONTRACT_ABI,
        provider
      );
      // Get all the tokens that have been minted
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (err) {
      console.error(err);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby 💁🏼‍♀️");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  /*
        connectWallet: Connects the MetaMask wallet
      */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfLauCoin();
    }
  }, [walletConnected]);

  /*
        renderButton: Returns a button based on the state of the dapp
      */
  const renderButton = () => {
    // If we are currently waiting for something, return a loading button
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading... 🟠 👱🏿‍♂️ 🟧</button>
        </div>
      );
    }

    // If user doesn't have any tokens to claim, show the mint button
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintLauCoin(tokenAmount)}
        >
          Mint coins 🐕
        </button>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>Lauren Coin </title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Lauren Coin's ICO!</h1>
          <div className={styles.description}>
            Lauren is an amazing girl! She loves dogs, Frank Ocean and plays the
            Ukulele
          </div>
          <div className={styles.description}>
            She wants to save all the puppies in the world and you can join the
            cause by minting a LauCoin 🐕
          </div>
          <div className={styles.description}>
            You can mint your LauCoin tokens here 💁🏼‍♀️
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfLauCoin)} LauCoin
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/7300 have been
                minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet 🤑
            </button>
          )}
        </div>
        <div>
          <Image
            className={styles.image}
            src="/0.jpeg"
            alt="Landscape picture"
            width={500}
            height={500}
          />
        </div>
      </div>

      <footer className={styles.footer}>Made with &#10084; by Bright</footer>
    </div>
  );
}
