import { IAddress } from "../interface";
import { TokenComputer, TokenTransfer } from "../tokens";
import { addressToHex, numberToPaddedHex, numberToPaddedHexWithZeroAsEmptyString, utf8ToHex } from "../utils.codec";

export class TokenTransfersDataBuilder {
    private tokenComputer: TokenComputer;

    constructor() {
        this.tokenComputer = new TokenComputer();
    }

    buildArgsForESDTTransfer(transfer: TokenTransfer): string[] {
        let args = ["ESDTTransfer"];
        args.push(...[utf8ToHex(transfer.token.identifier), numberToPaddedHexWithZeroAsEmptyString(transfer.amount)]);
        return args;
    }

    buildArgsForSingleESDTNFTTransfer(transfer: TokenTransfer, receiver: IAddress) {
        let args = ["ESDTNFTTransfer"];

        const token = transfer.token;
        const identifier = this.tokenComputer.extractIdentifierFromExtendedIdentifier(token.identifier);

        args.push(
            ...[
                utf8ToHex(identifier),
                numberToPaddedHexWithZeroAsEmptyString(token.nonce),
                numberToPaddedHexWithZeroAsEmptyString(transfer.amount),
                addressToHex(receiver),
            ],
        );
        return args;
    }

    buildArgsForMultiESDTNFTTransfer(receiver: IAddress, transfers: TokenTransfer[]) {
        let args = ["MultiESDTNFTTransfer", addressToHex(receiver), numberToPaddedHex(transfers.length)];

        for (let transfer of transfers) {
            const identifier = this.tokenComputer.extractIdentifierFromExtendedIdentifier(transfer.token.identifier);
            args.push(
                ...[
                    utf8ToHex(identifier),
                    numberToPaddedHexWithZeroAsEmptyString(transfer.token.nonce),
                    numberToPaddedHexWithZeroAsEmptyString(transfer.amount),
                ],
            );
        }

        return args;
    }
}
