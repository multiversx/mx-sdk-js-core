import {Transaction} from "./transaction";
import {TransactionPayload} from "./transactionPayload";
import {AddressValue, BytesValue, ContractFunction, U64Value} from "./smartcontracts";
import {IAddress, IChainID, IGasLimit, INonce, ITransactionPayload} from "./interface";
import {ISigner} from "@elrondnetwork/erdjs-walletcore/out/interface";
import {INetworkConfig} from "./interfaceOfNetwork";

export class RelayedTransactionV2Builder {

    /**
     * Generate a relay v2 transaction to pay the gas for our users.
     *
     * @param {ISigner} innerTransactionSenderAccount The signer of the inner transaction
     * @param {IAddress} innerTransactionReceiver The recipient address of the inner transaction
     * @param {INonce} innerTransactionNonce The nonce of the inner transaction
     * @param {ITransactionPayload} innerTransactionData The data field of the inner transaction
     * @param {IGasLimit} innerTransactionGasLimit The gas limit of the inner transaction. It will be used for the big transaction
     * @param {IChainID} chainID The Chain ID of the inner transaction
     * @param {INetworkConfig} networkConfig The network config to be used for computing the gas units
     * @returns {Transaction} Transaction containing the relayed transaction
     */
    public async buildRelayedTransactionV2(
        innerTransactionSenderAccount: ISigner,
        innerTransactionReceiver: IAddress,
        innerTransactionNonce: INonce,
        innerTransactionData: ITransactionPayload,
        innerTransactionGasLimit: IGasLimit,
        chainID: IChainID,
        networkConfig: INetworkConfig): Promise<Transaction> {
        let innerTransaction = new Transaction({
            nonce: innerTransactionNonce,
            receiver: innerTransactionReceiver,
            gasLimit: 0,
            data: innerTransactionData,
            chainID: chainID,
        });

        await innerTransactionSenderAccount.sign(innerTransaction);

        const payload = TransactionPayload.contractCall()
            .setFunction(new ContractFunction("relayedTxV2"))
            .setArgs([
                new AddressValue(innerTransactionReceiver),
                new U64Value(innerTransactionNonce.valueOf()),
                new BytesValue(innerTransactionData.valueOf()),
                BytesValue.fromHex(innerTransaction.getSignature().hex()),
            ])
            .build();

        return new Transaction({
            receiver: innerTransaction.getSender(),
            value: 0,
            gasLimit:
                innerTransactionGasLimit.valueOf() + networkConfig.MinGasLimit + networkConfig.GasPerDataByte * payload.length(),
            data: payload,
            chainID: chainID,
        });
    }
}
