import { NextResponse } from "next/server";
import axios from "axios";
import { NEXT_PUBLIC_PINATA_JWT } from "@/config";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  try {
    const data = await request.formData();
    console.log("Data: ", data);
    const res = await axios("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NEXT_PUBLIC_PINATA_JWT}`,
      },
      data: data,
    });
    const { IpfsHash } = await res.data;
    console.log("Ipfs hash:", IpfsHash);
    return NextResponse.json({ IpfsHash }, { status: 200 });
  } catch (e) {
    console.log("Error from backend:", e.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
