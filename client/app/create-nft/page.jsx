"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
const ethers = require("ethers");
import axios from "axios";
import { NEXT_PUBLIC_GATEWAY_URL, NEXT_PUBLIC_PINATA_JWT } from "@/config";
import { address, ABI } from "@/abi/NFTMarketplace";
import Navigation from "@/components/Navigation";

const page = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [cid, setCid] = useState("");
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });
  const [walletAddress, setWalletAddress] = useState("");
  const inputFileRef = useRef(null);
  const router = useRouter();
  const uploadFile = async (fileToUpload) => {
    try {
      setUploading(true);
      const data = new FormData();
      data.set("file", fileToUpload);
      const response = await axios("/api/files", {
        method: "POST",
        data: data,
      });
      setCid(response.data.IpfsHash);
      setUploading(false);
      const imageUrl = `${NEXT_PUBLIC_GATEWAY_URL}/${response.data.IpfsHash}`;
      setFileUrl(imageUrl);
      return imageUrl;
    } catch (error) {
      console.log("Error uploading file", error);
      setUploading(false);
      alert("Trouble uploading file");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    uploadFile(file);
  };

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

  async function uploadMetadata() {
    try {
      const { name, description, price } = formInput;
      if (!name || !description || !price) {
        alert("Please fill out all the fields");
        return;
      }
      setLoading(true);
      const jsonData = {
        pinataMetadata: {
          name: `${name}.json`,
        },
        pinataContent: {
          name: name,
          description: description,
          image: fileUrl,
          price: price,
        },
      };
      const jsonResponse = await axios(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${NEXT_PUBLIC_PINATA_JWT}`,
          },
          data: jsonData,
        }
      );
      const tokenUri = `${NEXT_PUBLIC_GATEWAY_URL}/${jsonResponse.data.IpfsHash}`;
      setLoading(false);
      return tokenUri;
    } catch (error) {
      console.log("Error uploading metadata", error.message);
    }
  }

  async function listNFTForSale() {
    try {
      const url = await uploadMetadata();
      connect();
      const sepoliaChainId = 11155111;
      let chainIdInt = parseInt(JSON.parse(localStorage.getItem("chainId")));
      if (chainIdInt !== parseInt(sepoliaChainId)) {
        alert("Please connect to Sepolia Network");
        return;
      }

      // Sign the transaction
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(address, ABI, signer);
      const price = ethers.parseUnits(formInput.price, "ether");
      let listingPrice = await contract.getListingPrice();
      listingPrice = listingPrice.toString();
      const transaction = await contract.createToken(url, price, {
        value: listingPrice,
      });
      await transaction.wait();
      router.push("/");
    } catch (error) {
      console.log("Error listing NFT for sale", error.message);
    }
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
