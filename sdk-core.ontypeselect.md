<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@multiversx/sdk-core](./sdk-core.md) &gt; [onTypeSelect](./sdk-core.ontypeselect.md)

## onTypeSelect() function

**Signature:**

```typescript
export declare function onTypeSelect<TResult>(type: Type, selectors: {
    onOption: () => TResult;
    onList: () => TResult;
    onArray: () => TResult;
    onPrimitive: () => TResult;
    onStruct: () => TResult;
    onTuple: () => TResult;
    onEnum: () => TResult;
    onOther?: () => TResult;
}): TResult;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

type


</td><td>

[Type](./sdk-core.type.md)


</td><td>


</td></tr>
<tr><td>

selectors


</td><td>

{ onOption: () =&gt; TResult; onList: () =&gt; TResult; onArray: () =&gt; TResult; onPrimitive: () =&gt; TResult; onStruct: () =&gt; TResult; onTuple: () =&gt; TResult; onEnum: () =&gt; TResult; onOther?: () =&gt; TResult; }


</td><td>


</td></tr>
</tbody></table>
**Returns:**

TResult
