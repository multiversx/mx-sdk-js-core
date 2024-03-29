<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@multiversx/sdk-core](./sdk-core.md) &gt; [ResultsParser](./sdk-core.resultsparser.md)

## ResultsParser class

Legacy component. For parsing contract query responses, use the "SmartContractQueriesController" instead. For parsing smart contract outcome (return data), use the "SmartContractTransactionsOutcomeParser" instead. For parding smart contract events, use the "TransactionEventsParser" instead.

Parses contract query responses and smart contract results. The parsing involves some heuristics, in order to handle slight inconsistencies (e.g. some SCRs are present on API, but missing on Gateway).

**Signature:**

```typescript
export declare class ResultsParser 
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

[(constructor)(options)](./sdk-core.resultsparser._constructor_.md)


</td><td>


</td><td>

Constructs a new instance of the `ResultsParser` class


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

[createBundleWithCustomHeuristics(\_transaction, \_transactionMetadata)](./sdk-core.resultsparser.createbundlewithcustomheuristics.md)


</td><td>

`protected`


</td><td>

Override this method (in a subclass of [ResultsParser](./sdk-core.resultsparser.md)<!-- -->) if the basic heuristics of the parser are not sufficient.


</td></tr>
<tr><td>

[parseEvent(transactionEvent, eventDefinition)](./sdk-core.resultsparser.parseevent.md)


</td><td>


</td><td>

Legacy method, use "TransactionEventsParser.parseEvent()" instead.


</td></tr>
<tr><td>

[parseOutcome(transaction, endpoint)](./sdk-core.resultsparser.parseoutcome.md)


</td><td>


</td><td>

Legacy method, use "SmartContractTransactionsOutcomeParser.parseExecute()" instead.


</td></tr>
<tr><td>

[parseQueryResponse(queryResponse, endpoint)](./sdk-core.resultsparser.parsequeryresponse.md)


</td><td>


</td><td>

Legacy method, use "SmartContractQueriesController.parseQueryResponse()" instead.


</td></tr>
<tr><td>

[parseUntypedOutcome(transaction)](./sdk-core.resultsparser.parseuntypedoutcome.md)


</td><td>


</td><td>

Legacy method, use "SmartContractTransactionsOutcomeParser.parseExecute()" instead.


</td></tr>
<tr><td>

[parseUntypedQueryResponse(queryResponse)](./sdk-core.resultsparser.parseuntypedqueryresponse.md)


</td><td>


</td><td>

Legacy method, use "SmartContractQueriesController.parseQueryResponse()" instead.


</td></tr>
<tr><td>

[sliceDataFieldInParts(data)](./sdk-core.resultsparser.slicedatafieldinparts.md)


</td><td>

`protected`


</td><td>


</td></tr>
</tbody></table>