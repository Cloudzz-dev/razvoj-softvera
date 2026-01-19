/**
 * Masks an Ethereum address to show only the first 6 and last 4 characters.
 * Example: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F -> 0x71C7...976F
 */
export function maskAddress(address: string | null | undefined): string {
    if (!address) return "";
    if (address.length < 10) return address; // Too short to mask
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
