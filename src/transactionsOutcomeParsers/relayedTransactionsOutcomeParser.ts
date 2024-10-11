import { IContractResultItem, ITransactionOnNetwork } from "../interfaceOfNetwork";

export class RelayedTransactionsOutcomeParser {
    constructor() {}

    parseRelayedV3Transaction(parentTransaction: ITransactionOnNetwork): {
        innerTransactionsHashes: string[];
        innerTransactions: ITransactionOnNetwork[];
    } {
        const innerTransactions = this.transactionOnNetworkToInnerTransactionsOnNetwork(parentTransaction);
        const hashes = innerTransactions.map((item) => item.hash);

        return {
            innerTransactionsHashes: hashes,
            innerTransactions: innerTransactions,
        };
    }

    protected transactionOnNetworkToInnerTransactionsOnNetwork(
        transactionOnNetwork: ITransactionOnNetwork,
    ): ITransactionOnNetwork[] {
        const innerTransactions = transactionOnNetwork.innerTransactions || [];
        const innerTransactionsOnNetwork: ITransactionOnNetwork[] = innerTransactions.map((_, index) =>
            this.convertInnerTransactionToTransactionOnNetwork(transactionOnNetwork, index),
        );

        return innerTransactionsOnNetwork;
    }

    /**
     * Recovers the structure of an inner transaction from the parent transaction,
     * by matching the inner transaction with its corresponding smart contract results (and logs).
     */
    protected convertInnerTransactionToTransactionOnNetwork(
        parentTransactionOnNetwork: ITransactionOnNetwork,
        innerTransactionIndex: number,
    ): ITransactionOnNetwork {
        if (
            !parentTransactionOnNetwork.innerTransactions ||
            parentTransactionOnNetwork.innerTransactions.length <= innerTransactionIndex
        ) {
            throw new Error("Inner transaction index is out of bounds");
        }

        const innerTransaction = structuredClone(parentTransactionOnNetwork.innerTransactions[innerTransactionIndex]);
        const innerTransactionHash = innerTransaction.hash;

        function isResultOfInnerTransaction(result: IContractResultItem): boolean {
            if (result.previousHash == innerTransactionHash) {
                return true;
            }

            const previous = parentTransactionOnNetwork.contractResults.items.find(
                (item) => item.hash === result.previousHash,
            );

            if (!previous) {
                return false;
            }

            return isResultOfInnerTransaction(previous);
        }

        const resultsOfInner = parentTransactionOnNetwork.contractResults.items.filter(isResultOfInnerTransaction);
        innerTransaction.contractResults = { items: resultsOfInner };

        return innerTransaction;
    }
}
