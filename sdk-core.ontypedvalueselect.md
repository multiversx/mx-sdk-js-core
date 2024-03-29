<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@multiversx/sdk-core](./sdk-core.md) &gt; [onTypedValueSelect](./sdk-core.ontypedvalueselect.md)

## onTypedValueSelect() function

**Signature:**

```typescript
export declare function onTypedValueSelect<TResult>(value: TypedValue, selectors: {
    onPrimitive: () => TResult;
    onOption: () => TResult;
    onList: () => TResult;
    onArray: () => TResult;
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

value


</td><td>

[TypedValue](./sdk-core.typedvalue.md)


</td><td>


</td></tr>
<tr><td>

selectors


</td><td>

{ onPrimitive: () =&gt; TResult; onOption: () =&gt; TResult; onList: () =&gt; TResult; onArray: () =&gt; TResult; onStruct: () =&gt; TResult; onTuple: () =&gt; TResult; onEnum: () =&gt; TResult; onOther?: () =&gt; TResult; }


</td><td>


</td></tr>
</tbody></table>
**Returns:**

TResult
