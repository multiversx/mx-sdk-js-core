import re
from pathlib import Path
from typing import Dict, List

current_dir = Path(__file__).parent.absolute()

input_files = [
    current_dir / "entrypoints.ts",
    current_dir / "account.ts",
    current_dir / "networkProviders.ts",
    current_dir / "transactions.ts",
    current_dir / "smartContracts.ts",
    current_dir / "tokens.ts",
    current_dir / "accountManagement.ts",
    current_dir / "delegation.ts",
    current_dir / "relayed.ts",
    current_dir / "guarded.ts",
    current_dir / "addresses.ts",
    current_dir / "wallets.ts",
    current_dir / "signingObjects.ts",
    current_dir / "verifySignatures.ts"
]

MARKER_INSERT = "md-insert:"
DIRECTIVE_PREFIX = "// md-"
DIRECTIVE_IGNORE = "// md-ignore"
DIRECTIVE_UNINDENT = "// md-unindent"
DIRECTIVE_AS_COMMENT = "// md-as-comment"
DIRECTIVE_INSERT = f"// {MARKER_INSERT}"

API_URL = "https://multiversx.github.io/mx-sdk-js-core"
API_DEFAIULT_VERSION = "v13"
DOCS_URL = "https://docs.multiversx.com"

notes: Dict[str, str] = {
    "mixedTypedValuesAndNativeValues": """:::tip
When creating transactions using `class:SmartContractController` or `class:SmartContractTransactionsFactory`, even if the ABI is available and provided,
you can still use `class:TypedValue` objects as arguments for deployments and interactions.

Even further, you can use a mix of `class:TypedValue` objects and plain JavaScript values and objects. For example:

```js
let args = [new U32Value(42), "hello", { foo: "bar" }, new TokenIdentifierValue("TEST-abcdef")];
```

:::""",
}


def main():
    output_file = current_dir / "cookbook.md"
    output_sections: List[str] = []

    for input_file in input_files:
        lines = render_file(input_file)
        section = "\n".join(lines).strip()
        output_sections.append(section)

    output_text = "\n\n".join(output_sections) + "\n"
    output_text = render_api_links(output_text)
    output_text = remove_docs_root_url(output_text)
    output_file.write_text(output_text)


def render_file(input_file: Path) -> List[str]:
    input_text = input_file.read_text()
    input_lines = input_text.splitlines()
    output_lines: List[str] = []

    for line in input_lines:
        should_ignore = DIRECTIVE_IGNORE in line
        should_unindent = DIRECTIVE_UNINDENT in line
        is_comment = line.startswith("//")
        should_keep_as_comment = DIRECTIVE_AS_COMMENT in line
        should_insert = DIRECTIVE_INSERT in line

        if should_ignore:
            continue

        if should_unindent:
            line = line.lstrip()

        if is_comment and not should_keep_as_comment:
            line = line[2:].strip()

        line = line.replace(DIRECTIVE_UNINDENT, "")
        line = line.replace(DIRECTIVE_AS_COMMENT, "")

        if should_insert:
            box_name = line.replace(MARKER_INSERT, "").strip()
            box_content = notes[box_name]
            line = box_content

        line = line.rstrip()
        output_lines.append(line)

    return output_lines


def render_api_links(input: str) -> str:
    matches_func = re.findall(r"`func:(\w+\.\w+)\(\)`", input)
    matches_class = re.findall(r"`class:(\w+)`", input)

    for match in matches_func:
        [class_name, method] = match.split(".")
        input = input.replace(f"`func:{match}()`", f"[`{match}()`]({API_URL}/{API_DEFAIULT_VERSION}/classes/{class_name}.html#{method})")

    for match in matches_class:
        input = input.replace(f"`class:{match}`", f"[`{match}`]({API_URL}/{API_DEFAIULT_VERSION}/classes/{match}.html)")

    return input


def remove_docs_root_url(input: str) -> str:
    return input.replace(DOCS_URL, "")


if __name__ == "__main__":
    main()
