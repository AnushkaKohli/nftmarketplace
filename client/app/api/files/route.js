import { NextResponse, NextRequest } from "next/server";
import axios from "axios";
import { PINATA_API_KEY, PINATA_API_SECRET, PINATA_JWT } from "@/config";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  try {
    const data = await request.formData();
    console.log("Data: ", data);
    const file = data.get("file");
    data.append("file", file);
    const name = data.get("name");
    const description = data.get("description");
    const price = data.get("price");
    console.log("File back in the API", file);
    data.append("pinataMetadata", JSON.stringify({ name: `${name}.json` }));
    data.append(
      "pinataContent",
      JSON.stringify({ name, description, image: file, price })
    );
    console.log("Data after appending", data);
    const res = await axios("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
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
