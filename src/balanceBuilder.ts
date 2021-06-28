import BigNumber from "bignumber.js";
import { Balance, ErrInvalidArgument, ErrInvariantFailed } from ".";
import { ESDTToken, TokenType } from "./esdtToken";

/**
 * Creates balances for ESDTs (Fungible, Semi-Fungible (SFT) or Non-Fungible Tokens).
 */
export interface BalanceBuilder {

    /**
     * Creates a balance. Identical to {@link BalanceBuilder.denominated}
     */
    (value: BigNumber.Value): Balance;

    /**
     * Creates a denominated balance.
     * Note: For SFTs and NFTs this is equivalent to the raw balance, since SFTs and NFTs have 0 decimals.
     */
    value(value: BigNumber.Value): Balance;

    /**
     * Creates a balance. Does not apply denomination.
     */
    raw(value: BigNumber.Value): Balance;

    /**
     * Creates a new balance builder with the given nonce.
     */
    nonce(nonce: BigNumber.Value): BalanceBuilder;

    /**
     * Sets the nonce. Modifies the current instance.
     */
    setNonce(nonce: BigNumber.Value): void;

    /*
     * Get the nonce for an SFT or NFT builder.
     */
    getNonce(): BigNumber;

    /*
     * Returns true if the nonce was specified.
     */
    hasNonce(): boolean;

    /*
     * Get the token.
     */
    getToken(): ESDTToken;

    /*
     * Get the token identifier.
     */
    getTokenIdentifier(): string;

    /**
     * Creates a balance of value 1. Useful after specifying the nonce of an NFT.
     */
    one(): Balance;
}

class BalanceBuilderImpl {
    readonly token: ESDTToken;
    nonce_: BigNumber | null;
    constructor(token: ESDTToken) {
        this.token = token;
        this.nonce_ = null;
        if (token.isFungible()) {
            this.setNonce(0);
        }
    }

    value(value: BigNumber.Value): Balance {
        value = applyDenomination(value, this.token.decimals);
        return new Balance(this.token, this.getNonce(), value);
    }

    raw(value: BigNumber.Value): Balance {
        return new Balance(this.token, this.getNonce(), value);
    }

    nonce(nonce: BigNumber.Value): BalanceBuilder {
        let builder = createBalanceBuilder(this.token);
        builder.setNonce(nonce);
        return builder;
    }

    setNonce(nonce: BigNumber.Value): void {
        this.nonce_ = new BigNumber(nonce);
    }

    one(): Balance {
        return this.value(1);
    }

    hasNonce(): boolean {
        return this.token.isFungible() || this.nonce_ != null;
    }

    getNonce(): BigNumber.Value {
        if (this.nonce_ == null) {
            throw new ErrInvariantFailed("Nonce was not provided");
        }
        return new BigNumber(this.nonce_);
    }

    getToken(): ESDTToken {
        return this.token;
    }

    getTokenIdentifier(): string {
        return this.getToken().getTokenIdentifier();
    }
}

export function createBalanceBuilder(token: ESDTToken): BalanceBuilder {
    let impl = new BalanceBuilderImpl(token);
    let denominated = <BalanceBuilder>impl.value.bind(impl);
    let others = {
        value: impl.value.bind(impl),
        raw: impl.raw.bind(impl),
        nonce: impl.nonce.bind(impl),
        setNonce: impl.setNonce.bind(impl),
        one: impl.one.bind(impl),
        hasNonce: impl.hasNonce.bind(impl),
        getNonce: impl.getNonce.bind(impl),
        getToken: impl.getToken.bind(impl),
        getTokenIdentifier: impl.getTokenIdentifier.bind(impl)
    };
    return Object.assign(denominated, others);
}

/**
 * Builder for an EGLD value.
 */
export const Egld = createBalanceBuilder(new ESDTToken({ token: "EGLD", name: "eGold", decimals: 18, type: TokenType.FungibleESDT }));

function applyDenomination(value: BigNumber.Value, decimals: number): BigNumber {
    return new BigNumber(value).shiftedBy(decimals).decimalPlaces(0);
}
