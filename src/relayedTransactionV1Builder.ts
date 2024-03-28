import { Address } from "./address";
import { ErrInvalidRelayedV1BuilderArguments } from "./errors";
import { IAddress, INonce } from "./interface";
import { INetworkConfig } from "./interfaceOfNetwork";
import { TransactionOptions, TransactionVersion } from "./networkParams";
import { Transaction } from "./transaction";
import { TransactionPayload } from "./transactionPayload";

const JSONbig = require("json-bigint");

/**
 * @deprecated Use {@link RelayedTransactionsFactory} instead.
 */
export class RelayedTransactionV1Builder {
    innerTransaction: Transaction | undefined;
    relayerAddress: IAddress | undefined;
    relayerNonce: INonce | undefined;
    netConfig: INetworkConfig | undefined;
    relayedTransactionOptions: TransactionOptions | undefined;
    relayedTransactionVersion: TransactionVersion | undefined;
    relayedTransactionGuardian: IAddress | undefined;

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
    setRelayerNonce(relayerNonce: INonce): RelayedTransactionV1Builder {
        this.relayerNonce = relayerNonce;
        return this;
    }

    /**
     * (optional) Sets the version of the relayed transaction
     *
     * @param relayedTxVersion
    */
    setRelayedTransactionVersion(relayedTxVersion: TransactionVersion): RelayedTransactionV1Builder {
        this.relayedTransactionVersion = relayedTxVersion;
        return this;
    }

    /**
     * (optional) Sets the options of the relayed transaction
     *
     * @param relayedTxOptions
    */
    setRelayedTransactionOptions(relayedTxOptions: TransactionOptions): RelayedTransactionV1Builder {
        this.relayedTransactionOptions = relayedTxOptions;
        return this;
    }

    /**
     * (optional) Sets the guardian of the relayed transaction
     *
     * @param relayedTxGuardian
     */
    setRelayedTransactionGuardian(relayedTxGuardian: IAddress): RelayedTransactionV1Builder {
        this.relayedTransactionGuardian = relayedTxGuardian;
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
        const data = `relayedTx@${Buffer.from(serializedTransaction).toString("hex")}`;
        const payload = new TransactionPayload(data);

        const gasLimit = this.netConfig.MinGasLimit + this.netConfig.GasPerDataByte * payload.length() + this.innerTransaction.getGasLimit().valueOf();
        let relayedTransaction = new Transaction({
            nonce: this.relayerNonce,
            sender: this.relayerAddress,
            receiver: this.innerTransaction.getSender(),
            value: 0,
            gasLimit: gasLimit,
            data: payload,
            chainID: this.netConfig.ChainID,
            version: this.relayedTransactionVersion,
            options: this.relayedTransactionOptions,
            guardian: this.relayedTransactionGuardian,
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
            "value": BigInt(this.innerTransaction.getValue().toString()),
            "gasPrice": this.innerTransaction.getGasPrice().valueOf(),
            "gasLimit": this.innerTransaction.getGasLimit().valueOf(),
            "data": this.innerTransaction.getData().valueOf().toString("base64"),
            "signature": this.innerTransaction.getSignature().toString("base64"),
            "chainID": Buffer.from(this.innerTransaction.getChainID().valueOf()).toString("base64"),
            "version": this.innerTransaction.getVersion().valueOf(),
            "options": this.innerTransaction.getOptions().valueOf() == 0 ? undefined : this.innerTransaction.getOptions().valueOf(),
            "guardian": this.innerTransaction.getGuardian().bech32() ? new Address(this.innerTransaction.getGuardian().bech32()).pubkey().toString("base64") : undefined,
            "guardianSignature": this.innerTransaction.getGuardianSignature().toString("hex") ? this.innerTransaction.getGuardianSignature().toString("base64") : undefined,
            "sndUserName": this.innerTransaction.getSenderUsername() ? Buffer.from(this.innerTransaction.getSenderUsername()).toString("base64") : undefined,
            "rcvUserName": this.innerTransaction.getReceiverUsername() ? Buffer.from(this.innerTransaction.getReceiverUsername()).toString("base64") : undefined,
        };

        return JSONbig.stringify(txObject);
    }
}
