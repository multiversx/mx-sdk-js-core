
export class NFTToken {
    token: string = '';
    name: string = '';
    type: string = '';
    owner: string = '';
    minted: string = '';
    burnt: string = '';
    decimals: number = 0;
    isPaused: boolean = false;
    canUpgrade: boolean = false;
    canMint: boolean = false;
    canBurn: boolean = false;
    canChangeOwner: boolean = false;
    canPause: boolean = false;
    canFreeze: boolean = false;
    canWipe: boolean = false;
    canAddSpecialRoles: boolean = false;
    canTransferNFTCreateRole: boolean = false;
    NFTCreateStopped: boolean = false;
    wiped: string = '0';

    constructor(init?: Partial<NFTToken>) {
        Object.assign(this, init);
    }

    static fromHttpResponse(response: {
        token: string,
        name: string,
        type: string,
        owner: string,
        minted: string,
        burnt: string,
        decimals: number,
        isPaused: boolean,
        canUpgrade: boolean,
        canMint: boolean,
        canBurn: boolean,
        canChangeOwner: boolean,
        canPause: boolean,
        canFreeze: boolean,
        canWipe: boolean,
        canAddSpecialRoles: boolean,
        canTransferNFTCreateRole: boolean,
        NFTCreateStopped: boolean,
        wiped: string
    }) {
        let nftToken = new NFTToken(response);
        return nftToken;
    }

    getTokenName() {
        return this.name;
    }

    getTokenIdentifier() {
        return this.token;
    }

    getTokenType() {
        return this.type;
    }
}
