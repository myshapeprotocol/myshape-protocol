/**
 * SIWE Message Parser — EIP-4361 lightweight parser
 *
 * Parses the simplified SIWE message format used by MyShape:
 *   {domain} wants you to sign in:
 *   {address}
 *
 *   {statement}
 *
 *   URI: {uri}
 *   Version: 1
 *   Chain ID: {chainId}
 *   Nonce: {nonce}
 *   Issued At: {issuedAt}
 *   Expiration Time: {expirationTime}
 */

export interface SiweMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
}

export interface SiweParseOk {
  ok: true;
  message: SiweMessage;
}

export interface SiweParseErr {
  ok: false;
  error: string;
}

export type SiweParseResult = SiweParseOk | SiweParseErr;

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseSiweMessage(message: string): SiweParseResult {
  if (!message || typeof message !== 'string') {
    return { ok: false, error: 'SIWE_MESSAGE_EMPTY' };
  }

  try {
    const headerMatch = message.match(/^(.+?)\s+wants you to sign in:\s*\n([^\n]+)/);
    if (!headerMatch) {
      return { ok: false, error: 'SIWE_MESSAGE_MALFORMED_HEADER' };
    }
    const domain = headerMatch[1].trim();
    const address = headerMatch[2].trim();

    if (!DOMAIN_REGEX.test(domain)) {
      return { ok: false, error: 'SIWE_MESSAGE_INVALID_DOMAIN' };
    }
    if (!ADDRESS_REGEX.test(address)) {
      return { ok: false, error: 'SIWE_MESSAGE_INVALID_ADDRESS' };
    }

    const body = message.substring(headerMatch[0].length);

    const uriMatch = body.match(/URI:\s*(.+)/i);
    if (!uriMatch) {
      return { ok: false, error: 'SIWE_MESSAGE_MISSING_URI' };
    }

    const statementSection = body.substring(0, body.indexOf('URI:')).trim();
    const statement = statementSection.replace(/^\n+/, '').replace(/\n+$/, '').trim();
    const uri = uriMatch[1].trim();

    const versionMatch = body.match(/Version:\s*(\S+)/i);
    const version = versionMatch ? versionMatch[1].trim() : '1';

    const chainMatch = body.match(/Chain ID:\s*(\d+)/i);
    if (!chainMatch) {
      return { ok: false, error: 'SIWE_MESSAGE_MISSING_CHAIN_ID' };
    }
    const chainId = parseInt(chainMatch[1], 10);

    const nonceMatch = body.match(/Nonce:\s*(\S+)/i);
    if (!nonceMatch) {
      return { ok: false, error: 'SIWE_MESSAGE_MISSING_NONCE' };
    }
    const nonce = nonceMatch[1].trim();
    if (!UUID_REGEX.test(nonce)) {
      return { ok: false, error: 'SIWE_MESSAGE_INVALID_NONCE_FORMAT' };
    }

    const issuedAtMatch = body.match(/Issued At:\s*(\S+)/i);
    if (!issuedAtMatch) {
      return { ok: false, error: 'SIWE_MESSAGE_MISSING_ISSUED_AT' };
    }
    const issuedAt = issuedAtMatch[1].trim();
    const issuedAtDate = new Date(issuedAt);
    if (isNaN(issuedAtDate.getTime())) {
      return { ok: false, error: 'SIWE_MESSAGE_INVALID_ISSUED_AT' };
    }

    const expirationMatch = body.match(/Expiration Time:\s*(\S+)/i);
    let expirationTime: string | undefined;
    if (expirationMatch) {
      expirationTime = expirationMatch[1].trim();
      const expDate = new Date(expirationTime);
      if (isNaN(expDate.getTime())) {
        return { ok: false, error: 'SIWE_MESSAGE_INVALID_EXPIRATION' };
      }
    }

    const notBeforeMatch = body.match(/Not Before:\s*(\S+)/i);
    let notBefore: string | undefined;
    if (notBeforeMatch) {
      notBefore = notBeforeMatch[1].trim();
      const nbfDate = new Date(notBefore);
      if (isNaN(nbfDate.getTime())) {
        return { ok: false, error: 'SIWE_MESSAGE_INVALID_NOT_BEFORE' };
      }
    }

    return {
      ok: true,
      message: {
        domain, address, statement, uri, version, chainId, nonce, issuedAt, expirationTime, notBefore,
      },
    };
  } catch {
    return { ok: false, error: 'SIWE_MESSAGE_PARSE_ERROR' };
  }
}

export function validateSiweTimestamps(message: SiweMessage, now: number = Date.now()): string | null {
  if (message.expirationTime) {
    const expMs = new Date(message.expirationTime).getTime();
    if (!isNaN(expMs) && now >= expMs) {
      return 'SIWE_MESSAGE_EXPIRED';
    }
  }
  if (message.notBefore) {
    const nbfMs = new Date(message.notBefore).getTime();
    if (!isNaN(nbfMs) && now < nbfMs) {
      return 'SIWE_MESSAGE_NOT_YET_VALID';
    }
  }
  const issuedAtMs = new Date(message.issuedAt).getTime();
  if (!isNaN(issuedAtMs) && issuedAtMs > now + 2 * 60 * 1000) {
    return 'SIWE_MESSAGE_ISSUED_IN_FUTURE';
  }
  return null;
}

export function validateSiweDomain(message: SiweMessage, allowedDomains: string[]): boolean {
  return allowedDomains.some(d => d.toLowerCase() === message.domain.toLowerCase());
}

export function validateSiweUri(message: SiweMessage, allowedDomains: string[]): boolean {
  try {
    const uri = new URL(message.uri);
    return allowedDomains.some(d => uri.hostname.toLowerCase() === d.toLowerCase());
  } catch {
    return false;
  }
}

export function validateSiweChainId(message: SiweMessage, allowedChainIds: number[]): boolean {
  return allowedChainIds.includes(message.chainId);
}