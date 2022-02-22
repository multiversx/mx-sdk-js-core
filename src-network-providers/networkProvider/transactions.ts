import { Address } from "../address";
import { Balance } from "../balance";
import { Hash } from "../hash";
import { ITransactionOnNetwork } from "../interface.networkProvider";
import { GasLimit, GasPrice } from "../networkParams";
import { Nonce } from "../nonce";
import { Signature } from "../signature";
import { TransactionHash, TransactionStatus } from "../transaction";
import { TransactionPayload } from "../transactionPayload";

 export class TransactionOnNetwork implements ITransactionOnNetwork {
    hash: TransactionHash = new TransactionHash("");
    nonce: Nonce = new Nonce(0);
    round: number = 0;
    epoch: number = 0;
    value: Balance = Balance.Zero();
    receiver: Address = new Address();
    sender: Address = new Address();
    gasPrice: GasPrice = new GasPrice(0);
    gasLimit: GasLimit = new GasLimit(0);
    data: TransactionPayload = new TransactionPayload();
    signature: Signature = Signature.empty();
    status: TransactionStatus = TransactionStatus.createUnknown();
    timestamp: number = 0;

    blockNonce: Nonce = new Nonce(0);
    hyperblockNonce: Nonce = new Nonce(0);
    hyperblockHash: Hash = Hash.empty();

    static fromProxyHttpResponse(txHash: TransactionHash, response: any): TransactionOnNetwork {
        let transactionOnNetwork = new TransactionOnNetwork();

        transactionOnNetwork.hash = txHash;
        transactionOnNetwork.nonce = new Nonce(response.nonce || 0);
        transactionOnNetwork.round = response.round;
        transactionOnNetwork.epoch = response.epoch || 0;
        transactionOnNetwork.value = Balance.fromString(response.value);
        transactionOnNetwork.sender = Address.fromBech32(response.sender);
        transactionOnNetwork.receiver = Address.fromBech32(response.receiver);
        transactionOnNetwork.gasPrice = new GasPrice(response.gasPrice);
        transactionOnNetwork.gasLimit = new GasLimit(response.gasLimit);
        transactionOnNetwork.data = TransactionPayload.fromEncoded(response.data);
        transactionOnNetwork.status = new TransactionStatus(response.status);
        transactionOnNetwork.timestamp = response.timestamp || 0;

        transactionOnNetwork.blockNonce = new Nonce(response.blockNonce || 0);
        transactionOnNetwork.hyperblockNonce = new Nonce(response.hyperblockNonce || 0);
        transactionOnNetwork.hyperblockHash = new Hash(response.hyperblockHash);

        return transactionOnNetwork;
    }

    static fromApiHttpResponse(txHash: TransactionHash, response: any): TransactionOnNetwork {
        let transactionOnNetwork = new TransactionOnNetwork();

        transactionOnNetwork.hash = txHash;
        transactionOnNetwork.nonce = new Nonce(response.nonce || 0);
        transactionOnNetwork.round = response.round;
        transactionOnNetwork.epoch = response.epoch || 0;
        transactionOnNetwork.value = Balance.fromString(response.value);
        transactionOnNetwork.sender = Address.fromBech32(response.sender);
        transactionOnNetwork.receiver = Address.fromBech32(response.receiver);
        transactionOnNetwork.gasPrice = new GasPrice(response.gasPrice);
        transactionOnNetwork.gasLimit = new GasLimit(response.gasLimit);
        transactionOnNetwork.data = TransactionPayload.fromEncoded(response.data);
        transactionOnNetwork.status = new TransactionStatus(response.status);
        transactionOnNetwork.timestamp = response.timestamp || 0;

        transactionOnNetwork.blockNonce = new Nonce(response.blockNonce || 0);
        transactionOnNetwork.hyperblockNonce = new Nonce(response.hyperblockNonce || 0);
        transactionOnNetwork.hyperblockHash = new Hash(response.hyperblockHash);

        return transactionOnNetwork;
    }

    getDateTime(): Date {
        return new Date(this.timestamp * 1000);
    }
}

