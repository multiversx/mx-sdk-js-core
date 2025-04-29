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

DIRECTIVE_PREFIX = "// md-"
DIRECTIVE_START = "// md-start"
DIRECTIVE_IGNORE = "// md-ignore"
DIRECTIVE_UNINDENT = "// md-unindent"
DIRECTIVE_AS_COMMENT = "// md-as-comment"
TO_UNINDENT_SPACE = "    "

# we don't want this ceremonial piece of code to show up in the rendered cookbook
TO_REMOVE = [
    """(async () => {""", 
    """})().catch((e) => {
    console.log({ e });
});"""]

API_URL = "https://multiversx.github.io/mx-sdk-js-core"
API_DEFAULT_VERSION = "v14"
DOCS_URL = "https://docs.multiversx.com"

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

    for item in TO_REMOVE: 
        input_text = input_text.replace(item, "")

    input_lines = input_text.splitlines()
    start = input_lines.index(DIRECTIVE_START)
    
    input_lines = input_lines[start:]
    output_lines: List[str] = []

    for line in input_lines:
        should_ignore = DIRECTIVE_IGNORE in line
        should_unindent = DIRECTIVE_UNINDENT in line
        is_comment = line.startswith("//") or line.startswith("    //")
        should_keep_as_comment = DIRECTIVE_AS_COMMENT in line

        if should_ignore:
            continue

        if should_unindent:
            line = line.lstrip()

        line = line.replace(DIRECTIVE_UNINDENT, "")
        line = line.replace(DIRECTIVE_START, "")
        line = line.replace(DIRECTIVE_AS_COMMENT, "")

        if is_comment and not should_keep_as_comment:
            line = line.strip().strip("/").strip()
        else: 
            if line.startswith(TO_UNINDENT_SPACE):
                line = line[len(TO_UNINDENT_SPACE):] 



        line = line.rstrip()
        output_lines.append(line)

    return output_lines


def render_api_links(input: str) -> str:
    matches_func = re.findall(r"`func:(\w+\.\w+)\(\)`", input)
    matches_class = re.findall(r"`class:(\w+)`", input)

    for match in matches_func:
        [class_name, method] = match.split(".")
        input = input.replace(f"`func:{match}()`", f"[`{match}()`]({API_URL}/{API_DEFAULT_VERSION}/classes/{class_name}.html#{method})")

    for match in matches_class:
        input = input.replace(f"`class:{match}`", f"[`{match}`]({API_URL}/{API_DEFAULT_VERSION}/classes/{match}.html)")

    return input


def remove_docs_root_url(input: str) -> str:
    return input.replace(DOCS_URL, "")


if __name__ == "__main__":
    main()
