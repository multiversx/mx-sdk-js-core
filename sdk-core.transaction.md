<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@multiversx/sdk-core](./sdk-core.md) &gt; [Transaction](./sdk-core.transaction.md)

## Transaction class

An abstraction for creating, signing and broadcasting transactions.

**Signature:**

```typescript
export declare class Transaction 
```

## Constructors

<table><thead><tr><th>

Constructor


</th><th>

Modifiers


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[(constructor)(options)](./sdk-core.transaction._constructor_.md)


</td><td>


</td><td>

Creates a new Transaction object.


</td></tr>
</tbody></table>

## Properties

<table><thead><tr><th>

Property


</th><th>

Modifiers


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[chainID](./sdk-core.transaction.chainid.md)


</td><td>


</td><td>

string


</td><td>

The chain ID of the Network (e.g. "1" for Mainnet).


</td></tr>
<tr><td>

[data](./sdk-core.transaction.data.md)


</td><td>


</td><td>

Uint8Array


</td><td>

The payload of the transaction.


</td></tr>
<tr><td>

[gasLimit](./sdk-core.transaction.gaslimit.md)


</td><td>


</td><td>

bigint


</td><td>

The maximum amount of gas to be consumed when processing the transaction.


</td></tr>
<tr><td>

[gasPrice](./sdk-core.transaction.gasprice.md)


</td><td>


</td><td>

bigint


</td><td>

The gas price to be used.


</td></tr>
<tr><td>

[guardian](./sdk-core.transaction.guardian.md)


</td><td>


</td><td>

string


</td><td>

The address of the guardian, in bech32 format.


</td></tr>
<tr><td>

[guardianSignature](./sdk-core.transaction.guardiansignature.md)


</td><td>


</td><td>

Uint8Array


</td><td>

The signature of the guardian.


</td></tr>
<tr><td>

[nonce](./sdk-core.transaction.nonce.md)


</td><td>


</td><td>

bigint


</td><td>

The nonce of the transaction (the account sequence number of the sender).


</td></tr>
<tr><td>

[options](./sdk-core.transaction.options.md)


</td><td>


</td><td>

number


</td><td>

The options field, useful for describing different settings available for transactions.


</td></tr>
<tr><td>

[receiver](./sdk-core.transaction.receiver.md)


</td><td>


</td><td>

string


</td><td>

The address of the receiver, in bech32 format.


</td></tr>
<tr><td>

[receiverUsername](./sdk-core.transaction.receiverusername.md)


</td><td>


</td><td>

string


</td><td>

The username of the receiver.


</td></tr>
<tr><td>

[sender](./sdk-core.transaction.sender.md)


</td><td>


</td><td>

string


</td><td>

The address of the sender, in bech32 format.


</td></tr>
<tr><td>

[senderUsername](./sdk-core.transaction.senderusername.md)


</td><td>


</td><td>

string


</td><td>

The username of the sender.


</td></tr>
<tr><td>

[signature](./sdk-core.transaction.signature.md)


</td><td>


</td><td>

Uint8Array


</td><td>

The signature.


</td></tr>
<tr><td>

[value](./sdk-core.transaction.value.md)


</td><td>


</td><td>

bigint


</td><td>

The value to transfer.


</td></tr>
<tr><td>

[version](./sdk-core.transaction.version.md)


</td><td>


</td><td>

number


</td><td>

The version, required by the Network in order to correctly interpret the contents of the transaction.


</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method


</th><th>

Modifiers


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[applyGuardianSignature(guardianSignature)](./sdk-core.transaction.applyguardiansignature.md)


</td><td>


</td><td>

Legacy method, use the "guardianSignature" property instead. Applies the guardian signature on the transaction.


</td></tr>
<tr><td>

[applySignature(signature)](./sdk-core.transaction.applysignature.md)


</td><td>


</td><td>

Legacy method, use the "signature" property instead. Applies the signature on the transaction.


</td></tr>
<tr><td>

[computeFee(networkConfig)](./sdk-core.transaction.computefee.md)


</td><td>


</td><td>

Legacy method, use "TransactionComputer.computeTransactionFee()" instead.

Computes the current transaction fee based on the  and transaction properties


</td></tr>
<tr><td>

[fromPlainObject(plainObjectTransaction)](./sdk-core.transaction.fromplainobject.md)


</td><td>

`static`


</td><td>

Legacy method, use "TransactionsConverter.plainObjectToTransaction()" instead. Converts a plain object transaction into a Transaction Object.


</td></tr>
<tr><td>

[getChainID()](./sdk-core.transaction.getchainid.md)


</td><td>


</td><td>

Legacy method, use the "chainID" property instead.


</td></tr>
<tr><td>

[getData()](./sdk-core.transaction.getdata.md)


</td><td>


</td><td>

Legacy method, use the "data" property instead.


</td></tr>
<tr><td>

[getGasLimit()](./sdk-core.transaction.getgaslimit.md)


</td><td>


</td><td>

Legacy method, use the "gasLimit" property instead.


</td></tr>
<tr><td>

[getGasPrice()](./sdk-core.transaction.getgasprice.md)


</td><td>


</td><td>

Legacy method, use the "gasPrice" property instead.


</td></tr>
<tr><td>

[getGuardian()](./sdk-core.transaction.getguardian.md)


</td><td>


</td><td>

Legacy method, use the "guardian" property instead.


</td></tr>
<tr><td>

[getGuardianSignature()](./sdk-core.transaction.getguardiansignature.md)


</td><td>


</td><td>

Legacy method, use the "guardianSignature" property instead.


</td></tr>
<tr><td>

[getHash()](./sdk-core.transaction.gethash.md)


</td><td>


</td><td>

Legacy method, use "TransactionComputer.computeTransactionHash()" instead.


</td></tr>
<tr><td>

[getNonce()](./sdk-core.transaction.getnonce.md)


</td><td>


</td><td>

Legacy method, use the "nonce" property instead.


</td></tr>
<tr><td>

[getOptions()](./sdk-core.transaction.getoptions.md)


</td><td>


</td><td>

Legacy method, use the "options" property instead.


</td></tr>
<tr><td>

[getReceiver()](./sdk-core.transaction.getreceiver.md)


</td><td>


</td><td>

Legacy method, use the "receiver" property instead.


</td></tr>
<tr><td>

[getReceiverUsername()](./sdk-core.transaction.getreceiverusername.md)


</td><td>


</td><td>

Legacy method, use the "receiverUsername" property instead.


</td></tr>
<tr><td>

[getSender()](./sdk-core.transaction.getsender.md)


</td><td>


</td><td>

Legacy method, use the "sender" property instead.


</td></tr>
<tr><td>

[getSenderUsername()](./sdk-core.transaction.getsenderusername.md)


</td><td>


</td><td>

Legacy method, use the "senderUsername" property instead.


</td></tr>
<tr><td>

[getSignature()](./sdk-core.transaction.getsignature.md)


</td><td>


</td><td>

Legacy method, use the "signature" property instead.


</td></tr>
<tr><td>

[getValue()](./sdk-core.transaction.getvalue.md)


</td><td>


</td><td>

Legacy method, use the "value" property instead.


</td></tr>
<tr><td>

[getVersion()](./sdk-core.transaction.getversion.md)


</td><td>


</td><td>

Legacy method, use the "version" property instead.


</td></tr>
<tr><td>

[isGuardedTransaction()](./sdk-core.transaction.isguardedtransaction.md)


</td><td>


</td><td>

Checks the integrity of the guarded transaction


</td></tr>
<tr><td>

[serializeForSigning()](./sdk-core.transaction.serializeforsigning.md)


</td><td>


</td><td>

Legacy method, use "TransactionComputer.computeBytesForSigning()" instead. Serializes a transaction to a sequence of bytes, ready to be signed. This function is called internally by signers.


</td></tr>
<tr><td>

[setChainID(chainID)](./sdk-core.transaction.setchainid.md)


</td><td>


</td><td>

Legacy method, use the "chainID" property instead.


</td></tr>
<tr><td>

[setGasLimit(gasLimit)](./sdk-core.transaction.setgaslimit.md)


</td><td>


</td><td>

Legacy method, use the "gasLimit" property instead.


</td></tr>
<tr><td>

[setGasPrice(gasPrice)](./sdk-core.transaction.setgasprice.md)


</td><td>


</td><td>

Legacy method, use the "gasPrice" property instead.


</td></tr>
<tr><td>

[setGuardian(guardian)](./sdk-core.transaction.setguardian.md)


</td><td>


</td><td>

Legacy method, use the "guardian" property instead.


</td></tr>
<tr><td>

[setNonce(nonce)](./sdk-core.transaction.setnonce.md)


</td><td>


</td><td>

Legacy method, use the "nonce" property instead. Sets the account sequence number of the sender. Must be done prior signing.


</td></tr>
<tr><td>

[setOptions(options)](./sdk-core.transaction.setoptions.md)


</td><td>


</td><td>

Legacy method, use the "options" property instead.

Question for review: check how the options are set by sdk-dapp, wallet, ledger, extension.


</td></tr>
<tr><td>

[setReceiverUsername(receiverUsername)](./sdk-core.transaction.setreceiverusername.md)


</td><td>


</td><td>

Legacy method, use the "receiverUsername" property instead.


</td></tr>
<tr><td>

[setSender(sender)](./sdk-core.transaction.setsender.md)


</td><td>


</td><td>

Legacy method, use the "sender" property instead.


</td></tr>
<tr><td>

[setSenderUsername(senderUsername)](./sdk-core.transaction.setsenderusername.md)


</td><td>


</td><td>

Legacy method, use the "senderUsername" property instead.


</td></tr>
<tr><td>

[setValue(value)](./sdk-core.transaction.setvalue.md)


</td><td>


</td><td>

Legacy method, use the "value" property instead.


</td></tr>
<tr><td>

[setVersion(version)](./sdk-core.transaction.setversion.md)


</td><td>


</td><td>

Legacy method, use the "version" property instead.


</td></tr>
<tr><td>

[toPlainObject()](./sdk-core.transaction.toplainobject.md)


</td><td>


</td><td>

Legacy method, use "TransactionsConverter.transactionToPlainObject()" instead.

Converts the transaction object into a ready-to-serialize, plain JavaScript object. This function is called internally within the signing procedure.


</td></tr>
<tr><td>

[toSendable()](./sdk-core.transaction.tosendable.md)


</td><td>


</td><td>

Converts a transaction to a ready-to-broadcast object. Called internally by the network provider.


</td></tr>
</tbody></table>