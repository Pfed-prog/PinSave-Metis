import { parseCid } from "@/services/parseCid";

import { PinataSDK } from "pinata";

export type ObjectJsonMetadata = {
  name: string;
  description: string;
  image: string;
};

export type PinataObject = {
  data: ObjectJsonMetadata;
  contentType: string;
};

export type PinataObjectImage = {
  data: Blob;
  contentType: string;
};

export async function fetchMetadataPinata(cidMetadata: string) {
  const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
    pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
  });

  const file: unknown = await pinata.gateways.get(cidMetadata);
  const pinataObject = file as PinataObject;
  return pinataObject.data as ObjectJsonMetadata;
}

export async function fetchImagePinata(cidImage: string) {
  const cid = parseCid(cidImage);
  const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
    pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
  });

  const url = await pinata.gateways.createSignedURL({
    cid: cid,
    expires: 1800,
  });
  return url;
}

export async function fetchDecodedPost(cidMetadata: string) {
  try {
    const objectJsonMetadata: ObjectJsonMetadata =
      await fetchMetadataPinata(cidMetadata);
    try {
      const decodedImage: string = await fetchImagePinata(
        objectJsonMetadata.image
      );
      const output = {
        ...objectJsonMetadata,
        image: decodedImage,
      };
      return output;
    } catch (e) {
      return {
        ...objectJsonMetadata,
        image: "/fail.webp",
      };
    }
  } catch (e) {
    return {
      name: "Failed",
      description: "F for Failure",
      image: "/fail.webp",
    };
  }
}
