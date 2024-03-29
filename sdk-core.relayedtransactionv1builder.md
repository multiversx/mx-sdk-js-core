<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@multiversx/sdk-core](./sdk-core.md) &gt; [RelayedTransactionV1Builder](./sdk-core.relayedtransactionv1builder.md)

## RelayedTransactionV1Builder class

> Warning: This API is now obsolete.
> 
> Use [RelayedTransactionsFactory](./sdk-core.relayedtransactionsfactory.md) instead.
> 

**Signature:**

```typescript
export declare class RelayedTransactionV1Builder 
```

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

[innerTransaction](./sdk-core.relayedtransactionv1builder.innertransaction.md)


</td><td>


</td><td>

[Transaction](./sdk-core.transaction.md) \| undefined


</td><td>


</td></tr>
<tr><td>

[netConfig](./sdk-core.relayedtransactionv1builder.netconfig.md)


</td><td>


</td><td>

[INetworkConfig](./sdk-core.inetworkconfig.md) \| undefined


</td><td>


</td></tr>
<tr><td>

[relayedTransactionGuardian](./sdk-core.relayedtransactionv1builder.relayedtransactionguardian.md)


</td><td>


</td><td>

[IAddress](./sdk-core.iaddress.md) \| undefined


</td><td>


</td></tr>
<tr><td>

[relayedTransactionOptions](./sdk-core.relayedtransactionv1builder.relayedtransactionoptions.md)


</td><td>


</td><td>

[TransactionOptions](./sdk-core.transactionoptions.md) \| undefined


</td><td>


</td></tr>
<tr><td>

[relayedTransactionVersion](./sdk-core.relayedtransactionv1builder.relayedtransactionversion.md)


</td><td>


</td><td>

[TransactionVersion](./sdk-core.transactionversion.md) \| undefined


</td><td>


</td></tr>
<tr><td>

[relayerAddress](./sdk-core.relayedtransactionv1builder.relayeraddress.md)


</td><td>


</td><td>

[IAddress](./sdk-core.iaddress.md) \| undefined


</td><td>


</td></tr>
<tr><td>

[relayerNonce](./sdk-core.relayedtransactionv1builder.relayernonce.md)


</td><td>


</td><td>

[INonce](./sdk-core.inonce.md) \| undefined


</td><td>


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

[build()](./sdk-core.relayedtransactionv1builder.build.md)


</td><td>


</td><td>

Tries to build the relayed v1 transaction based on the previously set fields


</td></tr>
<tr><td>

[setInnerTransaction(transaction)](./sdk-core.relayedtransactionv1builder.setinnertransaction.md)


</td><td>


</td><td>

Sets the inner transaction to be used. It has to be already signed.


</td></tr>
<tr><td>

[setNetworkConfig(netConfig)](./sdk-core.relayedtransactionv1builder.setnetworkconfig.md)


</td><td>


</td><td>

Sets the network config to be used for building the relayed v1 transaction


</td></tr>
<tr><td>

[setRelayedTransactionGuardian(relayedTxGuardian)](./sdk-core.relayedtransactionv1builder.setrelayedtransactionguardian.md)


</td><td>


</td><td>

(optional) Sets the guardian of the relayed transaction


</td></tr>
<tr><td>

[setRelayedTransactionOptions(relayedTxOptions)](./sdk-core.relayedtransactionv1builder.setrelayedtransactionoptions.md)


</td><td>


</td><td>

(optional) Sets the options of the relayed transaction


</td></tr>
<tr><td>

[setRelayedTransactionVersion(relayedTxVersion)](./sdk-core.relayedtransactionv1builder.setrelayedtransactionversion.md)


</td><td>


</td><td>

(optional) Sets the version of the relayed transaction


</td></tr>
<tr><td>

[setRelayerAddress(relayerAddress)](./sdk-core.relayedtransactionv1builder.setrelayeraddress.md)


</td><td>


</td><td>

Sets the address of the relayer (the one that will actually pay the fee)


</td></tr>
<tr><td>

[setRelayerNonce(relayerNonce)](./sdk-core.relayedtransactionv1builder.setrelayernonce.md)


</td><td>


</td><td>

(optional) Sets the nonce of the relayer


</td></tr>
</tbody></table>