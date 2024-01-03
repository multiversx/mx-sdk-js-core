import BigNumber from "bignumber.js";
import { TransactionNext } from "../transaction";
import { IAddress } from "../interface";
import { ErrInvalidInnerTransaction } from "../errors";
import { Address } from "../address";

interface IConfig {
    chainID: string;
    minGasLimit: BigNumber.Value;
    gasLimitPerByte: BigNumber.Value;
}

export class RelayedTransactionsFactory {
    private readonly config: IConfig;

    constructor(config: IConfig) {
        this.config = config;
    }

    createRelayedV1Transaction(options: {
        innerTransaction: TransactionNext;
        relayerAddress: IAddress;
    }): TransactionNext {
        if (!options.innerTransaction.gasLimit) {
            throw new ErrInvalidInnerTransaction("The gas limit is not set for the inner transaction");
        }

        if (!options.innerTransaction.signature.length) {
            throw new ErrInvalidInnerTransaction("The inner transaction is not signed");
        }

        const serializedTransaction = this.prepareInnerTransactionForRelayedV1(options.innerTransaction);
        const data = `relayedTx@${Buffer.from(serializedTransaction).toString("hex")}`;

        const gasForDataLength = new BigNumber(this.config.gasLimitPerByte).multipliedBy(new BigNumber(data.length));
        const gasLimit = new BigNumber(this.config.minGasLimit)
            .plus(gasForDataLength)
            .plus(new BigNumber(options.innerTransaction.gasLimit));

        return new TransactionNext({
            chainID: this.config.chainID,
            sender: options.relayerAddress.bech32(),
            receiver: options.innerTransaction.sender,
            gasLimit: gasLimit,
            data: Buffer.from(data),
        });
    }

    private prepareInnerTransactionForRelayedV1(innerTransaction: TransactionNext): string {
        const txObject = {
            nonce: new BigNumber(innerTransaction.nonce.toString(), 10).toNumber(),
            sender: Address.fromBech32(innerTransaction.sender).pubkey().toString("base64"),
            receiver: Address.fromBech32(innerTransaction.receiver).pubkey().toString("base64"),
            value: new BigNumber(innerTransaction.value.toString(), 10).toNumber(),
            gasPrice: new BigNumber(innerTransaction.gasPrice.toString(), 10).toNumber(),
            gasLimit: new BigNumber(innerTransaction.gasLimit.toString(), 10).toNumber(),
            data: Buffer.from(innerTransaction.data).toString("base64"),
            signature: Buffer.from(innerTransaction.signature).toString("base64"),
            chainID: Buffer.from(innerTransaction.chainID).toString("base64"),
            version: innerTransaction.version,
            options: innerTransaction.options.valueOf() == 0 ? undefined : innerTransaction.options,
            guardian: innerTransaction.guardian
                ? Address.fromBech32(innerTransaction.guardian).pubkey().toString("base64")
                : undefined,
            guardianSignature: innerTransaction.guardianSignature.length
                ? Buffer.from(innerTransaction.guardianSignature).toString("base64")
                : undefined,
            sndUserName: innerTransaction.senderUsername
                ? Buffer.from(innerTransaction.senderUsername).toString("base64")
                : undefined,
            rcvUserName: innerTransaction.receiverUsername
                ? Buffer.from(innerTransaction.receiverUsername).toString("base64")
                : undefined,
        };

        return JSON.stringify(txObject);
    }
}
