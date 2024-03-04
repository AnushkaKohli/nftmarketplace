"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
const ethers = require("ethers");
import axios from "axios";
import Web3 from "web3";
import Web3Modal from "web3modal";
import { ABI, address } from "@/abi/NFTMarketplace";

const HomePage = () => {
  // States
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  let provider = typeof window !== "undefined" && window.ethereum;

  useEffect(() => {
    connect();
    loadNFTs();
  }, []);

  async function connect() {
    try {
      if (!provider) return alert("Please Install MetaMask");

      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length) {
        setWalletAddress(accounts[0]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const getContract = () => {
    const web3 = new Web3(provider);
    return new web3.eth.Contract(ABI, address);
  };

  const loadNFTs = async () => {
    setLoading(true);

    const nftContract = getContract();
    console.log(nftContract);
    // Fetch all the unsold items from the marketplace
    const data = await nftContract.methods.fetchMarketItems().call();
    console.log(data);
    const items = await Promise.all(
      data.map(async (i) => {
        const tokenUri = await nftContract.methods.tokenURI(i.tokenId).call();
        console.log("Token URI: ", tokenUri);
        const meta = await axios.get(tokenUri);
        console.log("Meta: ", meta);
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
    console.log("Items: ", items);

    setNfts(items);
    setLoading(false);
  };

  async function buyNft(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const getNetwork = await provider.getNetwork();
    const sepoliaChainId = 11155111;
    if (getNetwork.chainId !== sepoliaChainId) {
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
                  height="auto"
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
                    Buy /now
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
