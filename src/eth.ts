import { BrowserProvider, Contract } from 'ethers';
import CarbonCreditAbi from './abi/CarbonCredit.json';
import MarketplaceAbi from './abi/CarbonCreditMarketplace.json';

export async function getProviderAndSigner() {
  if (!(window as any).ethereum) throw new Error('MetaMask not found');
  const provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  return { provider, signer };
}

export async function getContracts() {
  const { signer } = await getProviderAndSigner();
  const tokenAddr = import.meta.env.VITE_CARBONCREDIT_ADDRESS as string;
  const marketAddr = import.meta.env.VITE_MARKETPLACE_ADDRESS as string;
  const token = new Contract(tokenAddr, (CarbonCreditAbi as any).abi ?? CarbonCreditAbi, signer);
  const marketplace = new Contract(marketAddr, (MarketplaceAbi as any).abi ?? MarketplaceAbi, signer);
  return { token, marketplace, signer };
}

export async function addCredit(orgName: string, units: bigint) {
  const { token } = await getContracts();
  const tx = await token.addCredit(orgName, units);
  return await tx.wait();
}

export async function issueCredit(to: string, orgName: string, units: bigint) {
  const { token } = await getContracts();
  const tx = await token.issueCredit(to, orgName, units);
  return await tx.wait();
}

export async function transferCredit(to: string, units: bigint) {
  const { token } = await getContracts();
  const tx = await token.transferCredit(to, units);
  return await tx.wait();
}

export async function addOrganization(name: string, wallet: string) {
  const { token } = await getContracts();
  const tx = await token.addOrganization(name, wallet);
  return await tx.wait();
}

export async function removeOrganization(wallet: string) {
  const { token } = await getContracts();
  const tx = await token.removeOrganization(wallet);
  return await tx.wait();
}

export async function getCurrentTokenPrice(): Promise<bigint> {
  const { marketplace } = await getContracts();
  return await marketplace.getCurrentTokenPrice();
}

export async function buyTokens(units: bigint) {
  const { marketplace } = await getContracts();
  const price: bigint = await marketplace.getCurrentTokenPrice();
  const value: bigint = units * price;
  const tx = await marketplace.buyTokens(units, { value });
  return await tx.wait();
}

export async function sellTokens(units: bigint) {
  const { token, marketplace } = await getContracts();
  const decimals: number = await token.decimals();
  const amt: bigint = units * (10n ** BigInt(decimals));
  await (await token.approve(await marketplace.getAddress(), amt)).wait();
  const tx = await marketplace.sellTokens(units);
  return await tx.wait();
}

export async function depositMarketplaceTokens(units: bigint) {
  const { token, marketplace } = await getContracts();
  const decimals: number = await token.decimals();
  const amt: bigint = units * (10n ** BigInt(decimals));
  await (await token.approve(await marketplace.getAddress(), amt)).wait();
  const tx = await marketplace.depositToken(units);
  return await tx.wait();
}

export async function withdrawMarketplaceETH(amountWei: bigint) {
  const { marketplace } = await getContracts();
  const tx = await marketplace.withdrawETH(amountWei);
  return await tx.wait();
}


