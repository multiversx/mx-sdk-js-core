import BigNumber from "bignumber.js";
import { AddressValue, ArgSerializer, BytesValue, U64Value } from "../abi";
import { Address } from "../address";
import { ErrInvalidInnerTransaction } from "../errors";
import { Transaction } from "../transaction";

const JSONbig = require("json-bigint");

interface IConfig {
    chainID: string;
    minGasLimit: bigint;
    gasLimitPerByte: bigint;
}

/**
 * Use this class to create both RelayedV1 and RelayedV2 transactions.
 */
export class RelayedTransactionsFactory {
    private readonly config: IConfig;

    constructor(options: { config: IConfig }) {
        this.config = options.config;
    }

    createRelayedV1Transaction(relayerAddress: Address, options: { innerTransaction: Transaction }): Transaction {
        if (!options.innerTransaction.gasLimit) {
            throw new ErrInvalidInnerTransaction("The gas limit is not set for the inner transaction");
        }

        if (!options.innerTransaction.signature.length) {
            throw new ErrInvalidInnerTransaction("The inner transaction is not signed");
        }

        const serializedTransaction = this.prepareInnerTransactionForRelayedV1(options.innerTransaction);
        const data = `relayedTx@${Buffer.from(serializedTransaction).toString("hex")}`;

        const additionalGasForDataLength = this.config.gasLimitPerByte * BigInt(data.length);
        const gasLimit = this.config.minGasLimit + additionalGasForDataLength + options.innerTransaction.gasLimit;

        return new Transaction({
            chainID: this.config.chainID,
            sender: relayerAddress,
            receiver: options.innerTransaction.sender,
            gasLimit: gasLimit,
            data: Buffer.from(data),
        });
    }

    createRelayedV2Transaction(
        relayerAddress: Address,
        options: {
            innerTransaction: Transaction;
            innerTransactionGasLimit: bigint;
        },
    ): Transaction {
        if (options.innerTransaction.gasLimit) {
            throw new ErrInvalidInnerTransaction("The gas limit should not be set for the inner transaction");
        }

        if (!options.innerTransaction.signature.length) {
            throw new ErrInvalidInnerTransaction("The inner transaction is not signed");
        }

        const { argumentsString } = new ArgSerializer().valuesToString([
            new AddressValue(options.innerTransaction.receiver),
            new U64Value(new BigNumber(options.innerTransaction.nonce.toString())),
            new BytesValue(Buffer.from(options.innerTransaction.data)),
            new BytesValue(Buffer.from(options.innerTransaction.signature)),
        ]);

        const data = `relayedTxV2@${argumentsString}`;

        const additionalGasForDataLength = this.config.gasLimitPerByte * BigInt(data.length);
        const gasLimit = options.innerTransactionGasLimit + this.config.minGasLimit + additionalGasForDataLength;

        return new Transaction({
            sender: relayerAddress,
            receiver: options.innerTransaction.sender,
            value: 0n,
            gasLimit: gasLimit,
            chainID: this.config.chainID,
            data: Buffer.from(data),
            version: options.innerTransaction.version,
            options: options.innerTransaction.options,
        });
    }

    private prepareInnerTransactionForRelayedV1(innerTransaction: Transaction): string {
        const txObject = {
            nonce: innerTransaction.nonce,
            sender: innerTransaction.sender.getPublicKey().toString("base64"),
            receiver: innerTransaction.receiver.getPublicKey().toString("base64"),
            value: innerTransaction.value,
            gasPrice: innerTransaction.gasPrice,
            gasLimit: innerTransaction.gasLimit,
            data: Buffer.from(innerTransaction.data).toString("base64"),
            signature: Buffer.from(innerTransaction.signature).toString("base64"),
            chainID: Buffer.from(innerTransaction.chainID).toString("base64"),
            version: innerTransaction.version,
            options: innerTransaction.options == 0 ? undefined : innerTransaction.options,
            guardian: innerTransaction.guardian.isEmpty()
                ? undefined
                : innerTransaction.guardian.getPublicKey().toString("base64"),
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
        return JSONbig.stringify(txObject);
    }
}
