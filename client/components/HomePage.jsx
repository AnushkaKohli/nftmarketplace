"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
const ethers = require("ethers");
import axios from "axios";
import Web3 from "web3";
import { ABI, address } from "@/abi/NFTMarketplace";

const HomePage = () => {
  // States
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    connect();
    loadNFTs();
  }, []);

  let provider2 = typeof window !== "undefined" && window.ethereum;
  let provider = new ethers.BrowserProvider(provider2);

  async function connect() {
    try {
      if (!provider) return alert("Please Install MetaMask");

      const accounts = await provider2.request({
        method: "eth_requestAccounts",
      });

      let chainIdHex = await provider2.request({ method: "eth_chainId" });
      let chainIdInt = parseInt(chainIdHex, 16);
      localStorage.setItem("chainId", chainIdInt);

      if (accounts.length) {
        setWalletAddress(accounts[0]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const getContract = () => {
    const web3 = new Web3(provider2);
    return new web3.eth.Contract(ABI, address);
  };

  const loadNFTs = async () => {
    setLoading(true);
    const nftContract = getContract();

    // Fetch all the unsold items from the marketplace
    const data = await nftContract.methods.fetchMarketItems().call();

    const items = await Promise.all(
      data.map(async (i) => {
        const tokenUri = await nftContract.methods.tokenURI(i.tokenId).call();
        const meta = await axios.get(tokenUri);
        let price = ethers.formatUnits(i.price.toString(), "ether");

        let item = {
          price: price,
          tokenId: parseInt(i.tokenId),
          seller: i.seller,
          owner: i.owner,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
        };

        return item;
      })
    );
    setNfts(items);
    setLoading(false);
  };

  async function buyNft(nft) {
    // const web3Modal = new Web3Modal();
    // const connection = await web3Modal.connect();
    // const provider = new ethers.providers.Web3Provider(connection);
    // const getNetwork = await provider.getNetwork();
    connect();
    const sepoliaChainId = 11155111;
    let chainIdInt = parseInt(JSON.parse(localStorage.getItem("chainId")));
    if (chainIdInt !== sepoliaChainId) {
      alert("Please connect to Sepolia Network");
      return;
    }

    // Sign the transaction
    const signer = provider.getSigner();
    // const contract = getContract();
    const contract = new ethers.Contract(address, ABI, signer);
    const price = ethers.formatUnits(nft.price.toString(), "ether");
    const transaction = await contract.createMarketSale(nft.tokenId, {
      value: price,
    });
    await transaction.wait();
    loadNFTs();
  }

  if (loading)
    return (
      <div>
        <p className="text-3xl px-20 py-10">Loading...</p>
      </div>
    );
  if (!loading && !nfts.length)
    return (
      <div>
        <p className="text-3xl px-20 py-10">No items in marketplace</p>
      </div>
    );
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {nfts.map((nft, i) => {
            return (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <Image
                  src={nft.image}
                  alt={nft.name || "NFT Image"}
                  width={300}
                  height={200}
                  placeholder="blur"
                  blurDataURL="/placeholder.jpg"
                  layout="responsive"
                />
                <div className="p-4">
                  <p
                    style={{ height: "64px" }}
                    className="text-2xl font-semibold"
                  >
                    {nft.name}
                  </p>
                  <div style={{ height: "70px", overflow: "hidden" }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">
                    {nft.price} ETH
                  </p>
                  <button
                    className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                    onClick={() => buyNft(nft)}
                  >
                    Buy now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
