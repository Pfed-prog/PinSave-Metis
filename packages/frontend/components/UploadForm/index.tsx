import {
  Text,
  Paper,
  Title,
  TextInput,
  Textarea,
  Group,
  Button,
  Image,
  Center,
  MediaQuery,
  NativeSelect,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { Upload, Replace } from "tabler-icons-react";
import {
  useAccount,
  useWriteContract,
  useEnsAddress,
  createConfig,
  http,
} from "wagmi";
import { mainnet } from "wagmi/chains";

import { UploadData } from "@/services/upload";
import { getContractInfo } from "@/utils/contracts";

export const dropzoneChildren = (image: File | undefined) => {
  if (image) {
    let link = URL.createObjectURL(image);
    return (
      <Group
        position="center"
        spacing="xl"
        style={{ minHeight: 220, pointerEvents: "none" }}
      >
        {image.type[0] === "i" ? (
          <Image
            src={link}
            alt="uploaded image"
            my="md"
            radius="lg"
            sx={{ maxWidth: "240px" }}
          />
        ) : (
          <ReactPlayer url={link} />
        )}
        <Group sx={{ color: "#3a3a3a79" }}>
          <MediaQuery
            query="(max-width:500px)"
            styles={{
              marginLeft: "auto",
              marginRight: "auto",
              maxHeight: "30px",
            }}
          >
            <Replace size={40} />
          </MediaQuery>
          <Text size="md" inline align="center">
            Click/Drag here to replace image
          </Text>
        </Group>
      </Group>
    );
  }
  return (
    <Group
      position="center"
      spacing="xl"
      style={{ minHeight: 220, pointerEvents: "none" }}
    >
      <Upload size={80} />
      <div>
        <Text size="xl" inline>
          Drag image here or click to select an image
        </Text>
        <Text size="sm" color="dimmed" inline mt={7}>
          Image should not exceed 5mb
        </Text>
      </div>
    </Group>
  );
};

const UploadForm = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const [fetchedAccount, setFetchedAccount] = useState(false);
  const { address: senderAddress } = useAccount();

  const { address: contractAddress, abi } = getContractInfo();
  const { data: hash, writeContract: writeMintPost } = useWriteContract();

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [image, setImage] = useState<File | undefined>();
  const [postReceiver, setPostReceiver] = useState<`0x${string}` | undefined>(
    senderAddress
  );

  const [isPostUpdated, setIsPostUpdated] = useState<boolean>(false);
  const [isPostLoading, setIsPostLoading] = useState<boolean>(false);

  const [cid, setCid] = useState<string>("");

  const [provider, setProvider] = useState<"Pinata">("Pinata");

  const [lastHash, setLastHash] = useState<string>("");

  const [ensName, setEnsName] = useState<string>("");

  const config = createConfig({
    chains: [mainnet],
    transports: {
      [mainnet.id]: http(process.env.NEXT_PUBLIC_ALCHEMY),
    },
  });

  const { data: receiverAddress } = useEnsAddress({
    name: ensName,
    chainId: 1,
    config,
  });

  async function saveIPFSPostAndUpload(
    name: string,
    description: string,
    image?: File
  ) {
    if (description !== "" && name !== "" && image && postReceiver) {
      const cid: string | undefined = await UploadData({
        data: { name: name, description: description, image: image },
        provider: provider,
      });

      if (!cid) {
        throw new Error("no cid");
      }

      setCid(cid);

      setImage(undefined);
      setName("");
      setDescription("");

      setIsPostLoading(true);
    }
  }

  useEffect(() => {
    if (!postReceiver && senderAddress && !fetchedAccount) {
      setPostReceiver(senderAddress);
      setFetchedAccount(true);
    }

    setHasMounted(true);

    if (ensName !== "" && receiverAddress) {
      setPostReceiver(receiverAddress);
    }

    if (isPostLoading) {
      setIsPostUpdated(true);
      console.log("Updated response:" + cid);
    }

    if (hash && hash !== lastHash && isPostUpdated) {
      setLastHash(hash);
      setIsPostUpdated(false);
      setIsPostLoading(false);
    }
  }, [
    isPostLoading,
    postReceiver,
    receiverAddress,
    lastHash,
    cid,
    isPostUpdated,
    senderAddress,
    ensName,
    hash,
  ]);

  return (
    <div>
      {hasMounted && (
        <div>
          <Paper
            withBorder
            shadow="xl"
            p="xl"
            radius="lg"
            sx={{ maxWidth: "900px" }}
            mx="auto"
          >
            <Title
              order={1}
              my="sm"
              align="center"
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              sx={(theme) => ({
                background: theme.fn.radialGradient("green", "lime"),
              })}
            >
              Upload a new Post
            </Title>
            {!senderAddress && (
              <Title order={2} align="center">
                Connect your wallet to upload a post
              </Title>
            )}

            {!isPostUpdated ? (
              <div>
                <TextInput
                  required
                  label="Title"
                  placeholder="Post Title"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Textarea
                  my="md"
                  required
                  onChange={(e) => setDescription(e.target.value)}
                  value={description}
                  label="Description"
                  placeholder="Provide description to your post"
                />
                <TextInput
                  onChange={(event) => {
                    event.preventDefault();
                    setEnsName(event.target.value as string);
                  }}
                  value={ensName}
                  label="ENS name"
                  placeholder="Optional: enter receiver ENS name"
                />
                <TextInput
                  required
                  onChange={(e) =>
                    setPostReceiver(e.target.value as `0x${string}` | undefined)
                  }
                  value={postReceiver}
                  label="Post Receiver"
                  placeholder="Enter Address You Want To Receive The NFT"
                />
                <Dropzone
                  mt="md"
                  onReject={(files) => console.log("rejected files", files)}
                  onDrop={(files) => setImage(files[0])}
                  maxSize={25000000}
                  multiple={false}
                  accept={[
                    MIME_TYPES.png,
                    MIME_TYPES.jpeg,
                    MIME_TYPES.webp,
                    MIME_TYPES.svg,
                    MIME_TYPES.gif,
                  ]}
                >
                  {() => dropzoneChildren(image)}
                </Dropzone>
                <Group position="center" sx={{ padding: 10 }}>
                  {senderAddress && (
                    <Button
                      component="a"
                      radius="lg"
                      mt="md"
                      onClick={async () =>
                        await saveIPFSPostAndUpload(name, description, image)
                      }
                    >
                      Save Post Before Upload
                    </Button>
                  )}
                </Group>
                <Center>
                  <NativeSelect
                    placeholder="Pick IPFS Provider"
                    value={provider}
                    onChange={(event) =>
                      setProvider(event.currentTarget.value as "Pinata")
                    }
                    size="sm"
                    data={["Pinata"]}
                  />
                </Center>
              </div>
            ) : (
              <Center>
                <Button
                  component="a"
                  radius="lg"
                  mt="md"
                  onClick={() => {
                    writeMintPost({
                      address: contractAddress,
                      abi: abi,
                      functionName: "createPost",
                      args: [postReceiver, cid],
                    });
                  }}
                >
                  Upload Post
                </Button>
              </Center>
            )}
          </Paper>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
