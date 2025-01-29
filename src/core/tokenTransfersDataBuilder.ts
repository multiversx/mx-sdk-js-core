import { AddressValue, ArgSerializer, BigUIntValue, TokenIdentifierValue, TypedValue, U32Value } from "../abi";
import { Address } from "./address";
import { TokenComputer, TokenTransfer } from "./tokens";

export class TokenTransfersDataBuilder {
    private tokenComputer: TokenComputer;
    private argsSerializer: ArgSerializer;

    constructor() {
        this.tokenComputer = new TokenComputer();
        this.argsSerializer = new ArgSerializer();
    }

    buildDataPartsForESDTTransfer(transfer: TokenTransfer): string[] {
        const args = this.argsSerializer.valuesToStrings([
            new TokenIdentifierValue(transfer.token.identifier),
            new BigUIntValue(transfer.amount),
        ]);

        return ["ESDTTransfer", ...args];
    }

    buildDataPartsForSingleESDTNFTTransfer(transfer: TokenTransfer, receiver: Address) {
        const token = transfer.token;
        const identifier = this.tokenComputer.extractIdentifierFromExtendedIdentifier(token.identifier);

        const args = this.argsSerializer.valuesToStrings([
            new TokenIdentifierValue(identifier),
            new BigUIntValue(token.nonce),
            new BigUIntValue(transfer.amount),
            new AddressValue(receiver),
        ]);

        return ["ESDTNFTTransfer", ...args];
    }

    buildDataPartsForMultiESDTNFTTransfer(receiver: Address, transfers: TokenTransfer[]) {
        const argsTyped: TypedValue[] = [new AddressValue(receiver), new U32Value(transfers.length)];

        for (const transfer of transfers) {
            const identifier = this.tokenComputer.extractIdentifierFromExtendedIdentifier(transfer.token.identifier);

            argsTyped.push(
                ...[
                    new TokenIdentifierValue(identifier),
                    new BigUIntValue(transfer.token.nonce),
                    new BigUIntValue(transfer.amount),
                ],
            );
        }

        const args = this.argsSerializer.valuesToStrings(argsTyped);
        return ["MultiESDTNFTTransfer", ...args];
    }
}
