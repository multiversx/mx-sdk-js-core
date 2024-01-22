import { Transaction } from "./transaction";
import {
    IAddress, IChainID,
    IGasLimit,
    IGasPrice,
    INonce,
    ITokenTransfer,
    ITransactionPayload,
    ITransactionValue
} from "./interface";
import {ArgSerializer, BigUIntValue, BytesValue} from "./smartcontracts";
import {TransactionPayload} from "./transactionPayload";

interface IGasEstimator {

}
export class MultisigTransactionFactory {
    private readonly gasEstimator;

    constructor(gasEstimator: IGasEstimator) {
        this.gasEstimator = gasEstimator;
    }

    createProposeEGLDTransfer(args: {
        nonce?: INonce;
        value: ITransactionValue;
        receiver: IAddress;
        sender: IAddress;
        gasPrice?: IGasPrice;
        gasLimit?: IGasLimit;
        data?: ITransactionPayload;
        chainID: IChainID;
    }): Transaction {
        // const { argumentsString } = new ArgSerializer().valuesToStrings([
        //     new BigUIntValue(args.value.toString())
        // ])
        let transactionData = `proposeTransferExecute@${args.value.toString()}`;
        if (args.data) {
            transactionData += `@${args.data.toString()}`;
        }
        const transactionPayload = new TransactionPayload(transactionData);

        return new Transaction({
            nonce: args.nonce,
            receiver: args.receiver,
            sender: args.sender,
            gasPrice: args.gasPrice,
            gasLimit: args.gasLimit || 1,
            data: transactionPayload,
            chainID: args.chainID
        });
    }

    createProposeESDTTransfer(args: {
        tokenTransfer: ITokenTransfer,
    }) {
        const { argumentsString } = new ArgSerializer().valuesToString([
            // The token identifier
            BytesValue.fromUTF8(args.tokenTransfer.tokenIdentifier),
            // The transferred amount
            new BigUIntValue(args.tokenTransfer.valueOf()),
        ]);

        const data = `ESDTTransfer@${argumentsString}`;
        const transactionPayload = new TransactionPayload(data);
    }
    createProposeMultiESDTTransfer() {

    }
    createProposeContractCall() {

    }
    createSignAction() {

    }
    createPerformAction() {

    }
}