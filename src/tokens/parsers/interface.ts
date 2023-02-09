


export interface ISetSpecialRoleOutcome {
    userAddress: IAddress;
    tokenIdentifier: string;
    roles: string[];
}

export interface IMintOutcome {
    userAddress: IAddress;
    tokenIdentifier: string;
    nonce: INonce;
    mintedSupply: string;
}

export interface IBurnOutcome {
    userAddress: IAddress;
    tokenIdentifier: string;
    nonce: INonce;
    burntSupply: string;
}

export interface IPausingOutcome {
    tokenIdentifier: string;
    paused: boolean;
}

export interface IFreezingOutcome {
    userAddress: IAddress;
    tokenIdentifier: string;
    nonce: INonce;
    balance: string;
}

export interface IEmptyOutcome {
}
