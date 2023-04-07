import { IAddress, IChainID, IGasLimit, IGasPrice, INonce, ITokenTransfer, ITransactionPayload, ITransactionValue } from "./interface";
import { ArgSerializer } from "./smartcontracts/argSerializer";
import { AddressValue, BigUIntValue, BytesValue, TypedValue, U16Value, U64Value } from "./smartcontracts/typesystem";
import { Transaction } from "./transaction";
import { TransactionPayload } from "./transactionPayload";

interface IGasEstimator {
    forEGLDTransfer(dataLength: number): number;
    forESDTTransfer(dataLength: number): number;
    forESDTNFTTransfer(dataLength: number): number;
    forMultiESDTNFTTransfer(dataLength: number, numTransfers: number): number;
}

export class TransferTransactionsFactory {
    private readonly gasEstimator;

    constructor(gasEstimator: IGasEstimator) {
        this.gasEstimator = gasEstimator;
    }

    createEGLDTransfer(args: {
        nonce?: INonce;
        value: ITransactionValue;
        receiver: IAddress;
        sender: IAddress;
        gasPrice?: IGasPrice;
        gasLimit?: IGasLimit;
        data?: ITransactionPayload;
        chainID: IChainID;
    }) {
        const dataLength = args.data?.length() || 0;
        const estimatedGasLimit = this.gasEstimator.forEGLDTransfer(dataLength);

        return new Transaction({
            nonce: args.nonce,
            value: args.value,
            receiver: args.receiver,
            sender: args.sender,
            gasPrice: args.gasPrice,
            gasLimit: args.gasLimit || estimatedGasLimit,
            data: args.data,
            chainID: args.chainID
        });
    }

    createESDTTransfer(args: {
        tokenTransfer: ITokenTransfer,
        nonce?: INonce;
        receiver: IAddress;
        sender: IAddress;
        gasPrice?: IGasPrice;
        gasLimit?: IGasLimit;
        chainID: IChainID;
    }) {
        const { argumentsString } = new ArgSerializer().valuesToString([
            // The token identifier
            BytesValue.fromUTF8(args.tokenTransfer.tokenIdentifier),
            // The transfered amount
            new BigUIntValue(args.tokenTransfer.valueOf()),
        ]);

        const data = `ESDTTransfer@${argumentsString}`;
        const transactionPayload = new TransactionPayload(data);
        const dataLength = transactionPayload.length() || 0;
        const estimatedGasLimit = this.gasEstimator.forESDTTransfer(dataLength);

        return new Transaction({
            nonce: args.nonce,
            receiver: args.receiver,
            sender: args.sender,
            gasPrice: args.gasPrice,
            gasLimit: args.gasLimit || estimatedGasLimit,
            data: transactionPayload,
            chainID: args.chainID
        });
    }

    createESDTNFTTransfer(args: {
        tokenTransfer: ITokenTransfer,
        nonce?: INonce;
        destination: IAddress;
        sender: IAddress;
        gasPrice?: IGasPrice;
        gasLimit?: IGasLimit;
        chainID: IChainID;
    }) {
        const { argumentsString } = new ArgSerializer().valuesToString([
            // The token identifier
            BytesValue.fromUTF8(args.tokenTransfer.tokenIdentifier),
            // The nonce of the token
            new U64Value(args.tokenTransfer.nonce),
            // The transferred quantity
            new BigUIntValue(args.tokenTransfer.valueOf()),
            // The destination address
            new AddressValue(args.destination)
        ]);

        const data = `ESDTNFTTransfer@${argumentsString}`;
        const transactionPayload = new TransactionPayload(data);
        const dataLength = transactionPayload.length() || 0;
        const estimatedGasLimit = this.gasEstimator.forESDTNFTTransfer(dataLength);

        return new Transaction({
            nonce: args.nonce,
            receiver: args.sender,
            sender: args.sender,
            gasPrice: args.gasPrice,
            gasLimit: args.gasLimit || estimatedGasLimit,
            data: transactionPayload,
            chainID: args.chainID
        });
    }

    createMultiESDTNFTTransfer(args: {
        tokenTransfers: ITokenTransfer[],
        nonce?: INonce;
        destination: IAddress;
        sender: IAddress;
        gasPrice?: IGasPrice;
        gasLimit?: IGasLimit;
        chainID: IChainID;
    }) {
        const parts: TypedValue[] = [
            // The destination address
            new AddressValue(args.destination),
            // Number of tokens
            new U16Value(args.tokenTransfers.length)
        ];

        for (const payment of args.tokenTransfers) {
            parts.push(...[
                // The token identifier
                BytesValue.fromUTF8(payment.tokenIdentifier),
                // The nonce of the token
                new U64Value(payment.nonce),
                // The transfered quantity
                new BigUIntValue(payment.valueOf())
            ]);
        }

        const { argumentsString } = new ArgSerializer().valuesToString(parts);
        const data = `MultiESDTNFTTransfer@${argumentsString}`;
        const transactionPayload = new TransactionPayload(data);
        const dataLength = transactionPayload.length() || 0;
        const estimatedGasLimit = this.gasEstimator.forMultiESDTNFTTransfer(dataLength, args.tokenTransfers.length);

        return new Transaction({
            nonce: args.nonce,
            receiver: args.sender,
            sender: args.sender,
            gasPrice: args.gasPrice,
            gasLimit: args.gasLimit || estimatedGasLimit,
            data: transactionPayload,
            chainID: args.chainID
        });
    }
}
