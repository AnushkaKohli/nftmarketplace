"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
const ethers = require("ethers");
import Web3 from "web3";
import axios from "axios";
import { NEXT_PUBLIC_GATEWAY_URL } from "@/config";
import { address, ABI } from "@/abi/NFTMarketplace";
import Navigation from "@/components/Navigation";

const page = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [cid, setCid] = useState("");
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });
  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState();
  const inputFileRef = useRef(null);
  const router = useRouter();
  const uploadFile = async (fileToUpload) => {
    try {
      setUploading(true);
      const data = new FormData();
      data.set("file", fileToUpload);
      // console.log("File to upload", fileToUpload);
      setLoading(true);
      const { name, description, price } = formInput;
      if (!name || !description || !price) return;
      // console.log("name, description, price", name, description, price);
      data.set("name", name);
      data.set("description", description);
      data.set("price", price);
      const response = await axios("/api/files", {
        method: "POST",
        data: data,
      });
      console.log("Response: ", response);
      setCid(response.data.IpfsHash);
      setUploading(false);
      const imageUrl = `${NEXT_PUBLIC_GATEWAY_URL}/${response.data.IpfsHash}`;
      setFileUrl(imageUrl);
      setLoading(false);
      return imageUrl;
    } catch (error) {
      console.log("Error uploading file", error);
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
    uploadFile(file);
  };

  // let provider = typeof window !== "undefined" && window.ethereum;
  let provider = new ethers.BrowserProvider(window.ethereum);
  async function connect() {
    try {
      if (!provider) return alert("Please Install MetaMask");

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      let chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      let chainIdInt = parseInt(chainIdHex, 16);
      localStorage.setItem("chainId", chainIdInt);

      if (accounts.length) {
        setWalletAddress(accounts[0]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // const getContract = (signer) => {
  //   const web3 = new Web3(provider);
  //   return new web3.eth.Contract(ABI, address, signer);
  // };

  async function listNFTForSale() {
    const url = fileUrl;
    connect();
    console.log("Provider: ", provider);
    const sepoliaChainId = 11155111;
    let chainIdInt = parseInt(JSON.parse(localStorage.getItem("chainId")));
    if (chainIdInt !== parseInt(sepoliaChainId)) {
      alert("Please connect to Sepolia Network");
      return;
    }

    // Sign the transaction
    const signer = await provider.getSigner();
    console.log("Signer: ", signer);
    const contract = new ethers.Contract(address, ABI, signer);
    console.log("Contract: ", contract);
    // const contract = getContract(signer);
    const price = ethers.parseUnits(formInput.price, "ether");
    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();
    console.log("Listing Price: ", listingPrice);
    const transaction = await contract.createToken(url, price, {
      value: listingPrice,
    });
    await transaction.wait();
    router.push("/");
  }
  return (
    <div>
      <Navigation />
      <div className="flex justify-center mt-10">
        <div className="w-1/8 flec-col mr-10">
          {!fileUrl && (
            <Image
              className="rounded mt-4"
              src="/placeholder.jpg"
              alt="Placeholder Image"
              width={300}
              height={200}
            />
          )}
          {fileUrl && (
            <Image
              className="rounded mt-4"
              src={fileUrl}
              alt="Image uploaded successfully"
              width={300}
              height={200}
              placeholder="blur"
              blurDataURL="/placeholder.jpg"
            />
          )}
        </div>
        <div className="w-1/2 flex flex-col">
          <input
            placeholder="Asset Name"
            className="mt-8 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, name: e.target.value })
            }
          />
          <textarea
            placeholder="Asset Description"
            className="mt-2 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, description: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Asset Price in Eth"
            className="mt-2 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, price: e.target.value })
            }
          />
          <input
            type="file"
            name="Asset"
            className="my-4"
            ref={inputFileRef}
            onChange={handleFileChange}
          />
          <button
            disabled={loading}
            onClick={() => inputFileRef.current?.click()}
          >
            {uploading ? "Uploading..." : ""}
          </button>

          {cid && (
            <button
              onClick={listNFTForSale}
              className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
            >
              {loading ? "Wait uploading..." : "Create NFT"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default page;
