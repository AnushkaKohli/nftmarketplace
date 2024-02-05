"use client";

import { ethers } from "ethers";
import { useState, useEffect } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import { contractAddress, INFURA_URL } from "@/config";
import NFTMarketplace from "@/abi/NFTMarketplace.json";
import Image from "next/image";
import Naviagtion from "@/components/Naviagtion";

export default function Home() {
  return (
    <div>
      <Naviagtion />
      Hello World!
    </div>
  );
}
