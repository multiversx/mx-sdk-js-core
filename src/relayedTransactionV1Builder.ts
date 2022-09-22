import { Transaction } from "./transaction";
import { IAddress, INonce } from "./interface";
import { INetworkConfig } from "./interfaceOfNetwork";
import { ErrInvalidRelayedV1BuilderArguments } from "./errors";
import { TransactionPayload } from "./transactionPayload";
import { ContractFunction, StringValue } from "./smartcontracts";
import { Address } from "./address";
import BigNumber from "bignumber.js";

export class RelayedTransactionV1Builder {
    innerTransaction: Transaction | undefined;
    relayerAddress: IAddress | undefined;
    relayerNonce: INonce | undefined;
    netConfig: INetworkConfig | undefined;

    /**
     * Sets the inner transaction to be used. It has to be already signed.
     *
     * @param {Transaction} transaction The inner transaction to be used
     */
    setInnerTransaction(transaction: Transaction): RelayedTransactionV1Builder {
        this.innerTransaction = transaction;
        return this;
    }

    /**
     * Sets the network config to be used for building the relayed v1 transaction
     *
     * @param {INetworkConfig} netConfig The network configuration to be used
     */
    setNetworkConfig(netConfig: INetworkConfig): RelayedTransactionV1Builder {
        this.netConfig = netConfig;
        return this;
    }

    /**
     * Sets the address of the relayer (the one that will actually pay the fee)
     *
     * @param relayerAddress
     */
    setRelayerAddress(relayerAddress: IAddress): RelayedTransactionV1Builder {
        this.relayerAddress = relayerAddress;
        return this;
    }

    /**
     * (optional) Sets the nonce of the relayer
     *
     * @param relayerNonce
     */
    setRelayerNonce(relayerNonce: INonce) : RelayedTransactionV1Builder {
        this.relayerNonce = relayerNonce;
        return this;
    }

    /**
     * Tries to build the relayed v1 transaction based on the previously set fields
     *
     * @throws ErrInvalidRelayedV1BuilderArguments
     * @return Transaction
     */
    build(): Transaction {
        if (!this.innerTransaction || !this.netConfig || !this.relayerAddress || !this.innerTransaction.getSignature()) {
            throw new ErrInvalidRelayedV1BuilderArguments();
        }

        const serializedTransaction = this.prepareInnerTransaction();
        const payload = TransactionPayload.contractCall()
            .setFunction(new ContractFunction("relayedTx"))
            .setArgs([
                new StringValue(serializedTransaction),
            ])
            .build();

        const gasLimit = this.netConfig.MinGasLimit + this.netConfig.GasPerDataByte * payload.length() + this.innerTransaction.getGasLimit().valueOf();
        let relayedTransaction = new Transaction({
            nonce: this.relayerNonce,
            sender: this.relayerAddress,
            receiver: this.innerTransaction.getSender(),
            value: 0,
            gasLimit: gasLimit,
            data: payload,
            chainID: this.netConfig.ChainID,
        });

        if (this.relayerNonce) {
            relayedTransaction.setNonce(this.relayerNonce);
        }

        return relayedTransaction;
    }

    private prepareInnerTransaction(): string {
        if (!this.innerTransaction) {
            return "";
        }

        const txObject = {
            "nonce": this.innerTransaction.getNonce().valueOf(),
            "sender": new Address(this.innerTransaction.getSender().bech32()).pubkey().toString("base64"),
            "receiver": new Address(this.innerTransaction.getReceiver().bech32()).pubkey().toString("base64"),
            "value": new BigNumber(this.innerTransaction.getValue().toString(), 10).toNumber(),
            "gasPrice": this.innerTransaction.getGasPrice().valueOf(),
            "gasLimit": this.innerTransaction.getGasLimit().valueOf(),
            "data": this.innerTransaction.getData().valueOf().toString("base64"),
            "signature": Buffer.from(this.innerTransaction.getSignature().hex(), 'hex').toString("base64"),
            "chainID": Buffer.from(this.innerTransaction.getChainID().valueOf()).toString("base64"),
            "version": this.innerTransaction.getVersion().valueOf(),
        };

        return JSON.stringify(txObject);
    }
}
