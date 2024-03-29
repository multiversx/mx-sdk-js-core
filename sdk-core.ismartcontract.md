<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@multiversx/sdk-core](./sdk-core.md) &gt; [ISmartContract](./sdk-core.ismartcontract.md)

## ISmartContract interface

ISmartContract defines a general interface for operating with [SmartContract](./sdk-core.smartcontract.md) objects.

**Signature:**

```typescript
export interface ISmartContract 
```

## Methods

<table><thead><tr><th>

Method


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[call({ caller, func, args, value, gasLimit })](./sdk-core.ismartcontract.call.md)


</td><td>

Creates a [Transaction](./sdk-core.transaction.md) for calling (a function of) the Smart Contract.


</td></tr>
<tr><td>

[deploy({ deployer, code, codeMetadata, initArguments, value, gasLimit })](./sdk-core.ismartcontract.deploy.md)


</td><td>

Creates a [Transaction](./sdk-core.transaction.md) for deploying the Smart Contract to the Network.


</td></tr>
<tr><td>

[getAddress()](./sdk-core.ismartcontract.getaddress.md)


</td><td>

Gets the address of the Smart Contract.


</td></tr>
<tr><td>

[upgrade({ caller, code, codeMetadata, initArguments, value, gasLimit })](./sdk-core.ismartcontract.upgrade.md)


</td><td>

Creates a [Transaction](./sdk-core.transaction.md) for upgrading the Smart Contract on the Network.


</td></tr>
</tbody></table>