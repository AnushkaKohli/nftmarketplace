"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
const ethers = require("ethers");
import axios from "axios";
import { NEXT_PUBLIC_GATEWAY_URL, NEXT_PUBLIC_PINATA_JWT } from "@/config";
import { address, ABI } from "@/abi/NFTMarketplace";
import Navigation from "@/components/Navigation";
const page = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    connect();
    loadMyNFTs();
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
  const loadMyNFTs = async () => {
    try {
      connect();
      const sepoliaChainId = 11155111;
      let chainIdInt = parseInt(JSON.parse(localStorage.getItem("chainId")));
      if (chainIdInt !== sepoliaChainId) {
        alert("Please connect to Sepolia Network");
        return;
      }

      // Sign the transaction
      setLoading(true);
      const contract = new ethers.Contract(address, ABI, provider);
      console.log("Contract: ", contract);
      const data = await contract.fetchMyNFTs();
      const items = await Promise.all(
        data.map(async (i) => {
          console.log("i: ", i);
          const tokenUri = await contract.tokenURI(i.tokenId);
          const meta = await axios.get(tokenUri);
          let price = ethers.formatUnits(i.price.toString(), "ether");
          let item = {
            price,
            tokenId: i.tokenId.toNumber(),
            seller: i.seller,
            owner: i.owner,
            image: meta.data.image,
            name: meta.data.name,
            tokenUri,
          };
          return item;
        })
      );

      setNfts(items);
      setLoading(false);
    } catch (error) {
      console.log("Error loading my NFTs", error.message);
    }
  };

  if (loading)
    return (
      <div>
        <Navigation />
        <p className="text-3xl px-20 py-10">Loading...</p>
      </div>
    );
  if (!loading && !nfts.length)
    return (
      <div>
        <Navigation />
        <p className="text-3xl px-20 py-10">No NFTs is owned by you</p>
      </div>
    );
  return (
    <div>
      <Navigation />
      <div className="flex justify-center">
        <div className="px-4" style={{ maxWidth: "1600px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {nfts.map((nft, i) => {
              return (
                <div
                  key={i}
                  className="border shadow rounded-xl overflow-hidden m-5"
                >
                  <Image
                    src={nft.image}
                    alt={nft.name || "NFT Image"}
                    width={400}
                    height={300}
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
                  </div>
                  <div className="p-4 bg-black">
                    <p className="text-2xl mb-4 font-bold text-white">
                      {nft.price} ETH
                    </p>
                    <button
                      className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                      onClick={() => null}
                    >
                      Resell NFT
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
