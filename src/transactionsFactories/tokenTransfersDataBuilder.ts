import { IAddress } from "../interface";
import { TokenTransfer, TokenComputer } from "../tokens";
import { numberToPaddedHex, utf8ToHex, addressToHex } from "../utils.codec";

export class TokenTransfersDataBuilder {
    private tokenComputer: TokenComputer;

    constructor() {
        this.tokenComputer = new TokenComputer();
    }

    buildArgsForESDTTransfer(transfer: TokenTransfer): string[] {
        let args = ["ESDTTransfer"];
        args.push(...[utf8ToHex(transfer.token.identifier), numberToPaddedHex(transfer.amount)]);
        return args;
    }

    buildArgsForSingleESDTNFTTransfer(transfer: TokenTransfer, receiver: IAddress) {
        let args = ["ESDTNFTTransfer"];

        const token = transfer.token;
        const identifier = this.tokenComputer.ensureIdentifierHasCorrectStructure(token.identifier);

        args.push(...[utf8ToHex(identifier), numberToPaddedHex(token.nonce), numberToPaddedHex(transfer.amount), addressToHex(receiver)]);
        return args;
    }

    buildArgsForMultiESDTNFTTransfer(receiver: IAddress, transfers: TokenTransfer[]) {
        let args = ["MultiESDTNFTTransfer", addressToHex(receiver), numberToPaddedHex(transfers.length)];

        for (let transfer of transfers) {
            const identifier = this.tokenComputer.ensureIdentifierHasCorrectStructure(transfer.token.identifier);
            args.push(...[utf8ToHex(identifier), numberToPaddedHex(transfer.token.nonce), numberToPaddedHex(transfer.amount)]);
        }

        return args;
    }
}
