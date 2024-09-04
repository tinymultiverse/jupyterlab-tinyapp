"""
Copyright 2024 BlackRock, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import re
import base64
from io import BytesIO
from PIL import Image
from jupyterlab_tinyapp.generation.types import ParsedContent

patterns = {
    "desc": r"<<desc>>(.*?)(<<desc>>|<</desc>>)",
    "code": r"<<code>>(.*?)(<<code>>|<</code>>)",
    "deps": r"<<deps>>(.*?)(<<deps>>|<</deps>>)",
    "notes": r"<<notes>>(.*?)(<<notes>>|<</notes>>)",
    "retry": r"<<retry>>(.*?)(<<retry>>|<</retry>>)"
}

def parse_tags(text: str) -> ParsedContent:
    # Initialize the parsed content with None for each field
    parsed_content: ParsedContent = {
        "desc": None,
        "code": None,
        "deps": None,
        "notes": None,
        "retry": None,
    }

    # Extract content for each tag
    for tag, pattern in patterns.items():
        match = re.search(pattern, text, re.DOTALL)
        if match:
            parsed_content[tag] = match.group(1).strip()

    return parsed_content

""" simple utility to convert a comma separated string to a newline separated string """
def commas_to_newlines(input_string: str) -> str:
    items = input_string.split(',')
    stripped_items = [item.strip() for item in items]
    return '\n'.join(stripped_items)

# TODO: Revisit this function
def save_image_from_base64(image_string, file_path):
    image_data = base64.b64decode(image_string)
    image = Image.open(BytesIO(image_data))
    image.save(file_path)

# TODO: Revisit this function
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')