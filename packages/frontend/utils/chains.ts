import type { Chain } from "wagmi";

import { CHAINS, type ChainName } from "@/constants/chains";

export const getCurrentChain = (chainId: number) => {
  return Object.keys(CHAINS).find(
    (key) => CHAINS[key as keyof typeof CHAINS] === chainId
  ) as ChainName;
};

export function getChainApiRouteName(chain: Chain): ChainName {
  const chainName = getCurrentChain(chain?.id);
  if (chainName) return chainName;
  return "optimism";
}
