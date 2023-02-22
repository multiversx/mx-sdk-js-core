import { Address } from "./address";
import { IAddress, IChainID, IGasLimit, IGasPrice, INonce, ITokenPayment, ITransactionPayload, ITransactionValue } from "./interface";
import { Transaction } from "./transaction";
import { AddressValue, BigUIntValue, BytesValue, TypedValue, U16Value, U64Value } from "./smartcontracts/typesystem";
import { ArgSerializer } from "./smartcontracts/argSerializer";
import { TransactionPayload } from "./transactionPayload";

interface IGasEstimator {
    forEGLDTransfer(dataLength: number): number;
    forESDTTransfer(dataLength: number): number;
    forESDTNFTTransfer(dataLength: number): number;
    forMultiESDTNFTTransfer(dataLength: number, numTransfers: number): number;
}

export class TransfersFactory {
    private readonly gasEstimator;

    constructor(gasEstimator: IGasEstimator) {
        this.gasEstimator = gasEstimator;
    }

    createEGLDTransfer(args: {
        nonce?: INonce;
        value: ITransactionValue;
        receiver: IAddress;
        sender?: IAddress;
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
            sender: args.sender || Address.Zero(),
            gasPrice: args.gasPrice,
            gasLimit: args.gasLimit || estimatedGasLimit,
            data: args.data,
            chainID: args.chainID
        });
    }

    createESDTTransfer(args: {
        payment: ITokenPayment,
        nonce?: INonce;
        receiver: IAddress;
        sender?: IAddress;
        gasPrice?: IGasPrice;
        gasLimit?: IGasLimit;
        chainID: IChainID;
    }) {
        const { argumentsString } = new ArgSerializer().valuesToString([
            // The token identifier
            BytesValue.fromUTF8(args.payment.tokenIdentifier),
            // The transfered amount
            new BigUIntValue(args.payment.valueOf()),
        ]);

        const data = `ESDTTransfer@${argumentsString}`;
        const transactionPayload = new TransactionPayload(data);
        const dataLength = transactionPayload.length() || 0;
        const estimatedGasLimit = this.gasEstimator.forESDTTransfer(dataLength);

        return new Transaction({
            nonce: args.nonce,
            receiver: args.receiver,
            sender: args.sender || Address.Zero(),
            gasPrice: args.gasPrice,
            gasLimit: args.gasLimit || estimatedGasLimit,
            data: transactionPayload,
            chainID: args.chainID
        });
    }

    createESDTNFTTransfer(args: {
        payment: ITokenPayment,
        nonce?: INonce;
        destination: IAddress;
        sender: IAddress;
        gasPrice?: IGasPrice;
        gasLimit?: IGasLimit;
        chainID: IChainID;
    }) {
        const { argumentsString } = new ArgSerializer().valuesToString([
            // The token identifier
            BytesValue.fromUTF8(args.payment.tokenIdentifier),
            // The nonce of the token
            new U64Value(args.payment.nonce),
            // The transferred quantity
            new BigUIntValue(args.payment.valueOf()),
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
        payments: ITokenPayment[],
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
            new U16Value(args.payments.length)
        ];

        for (const payment of args.payments) {
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
        const estimatedGasLimit = this.gasEstimator.forMultiESDTNFTTransfer(dataLength, args.payments.length);

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
