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

import logging
import os
import time
from typing import Generator, Optional
from openai import OpenAI
import nbformat

def extract_code_from_notebook(notebook_path: str) -> Optional[str]:
    """
    Extract code cells from a notebook file.
    
    Args:
        notebook_path: Path to the .ipynb file
        
    Returns:
        String containing all code from code cells, or None if notebook is empty/invalid
    """
    try:
        if not os.path.exists(notebook_path):
            return None
            
        with open(notebook_path, 'r', encoding='utf-8') as f:
            notebook = nbformat.read(f, as_version=4)
        
        code_cells = []
        for cell in notebook.cells:
            if cell.cell_type == 'code':
                code_cells.append(cell.source)
        
        if not code_cells:
            return None
            
        return '\n\n'.join(code_cells)
    except Exception as e:
        # Log error but don't fail - just return None
        return None

class StreamingGenerator:
    def __init__(self, logger: logging.Logger):
        self.logger = logger

    def create_stream(self, prompt, image, existing_code=None) -> Generator[str, None, None]:
        # Abstract method to be implemented by subclasses
        raise NotImplementedError("Subclasses should implement this method.")

    def get_sys_prompt(self, include_image, is_iteration=False):
        base_instructions = """
            You will respond in the following format: 
            - a one-liner about the app you've created in-between the tags <<desc>> <</desc>>,
            - the streamlit code itself in-between <<code>> <</code>>,
            - any necessary dependencies (without specific versions pinned) formatted for a requirements.txt in-between <<deps>> <</deps>>,
            - any notes NECESSARY for the user prior to their running the app (for example: since we are using X api, you need to provide your api key before running). They already know to use streamlit run app.py so don't include that. Notes go in-between <<notes>> <</notes>>.
            - If the user should be able to run without modifications then don't generate the notes nor the <<notes>> <</notes>> tags.
            - If the user is not describing an app that can be generated with Streamlit please output or if their image doesn't align with an app they're describing, then in one or two sentence(s) tell them that they can request apps not whatever they requested in-between <<retry>> <</retry>>
            - In your output DO NOT INCLUDE MARKDOWN FORMATTING like ```python ... ```
            - IMPORTANT: EVERY TAG SHOULD HAVE A CORRESPONDING CLOSING TAG with a backslash like <<code>> import numpy <</code>>
            - ALSO: there should be no trailing or leading whitespace/newlines between tags and the content they encapsulate
            
            Take a deep breath, think step by step, you got this!
        """
        
        if is_iteration:
            role_description = "You are an expert programmer. The user has existing Streamlit app code and wants to make modifications to it. You'll update the code based on their request while preserving functionality they don't want to change."
        elif include_image:
            role_description = "You are an expert programmer. Given an app description and an image depicting the required layout, you'll write clear and well-documented Streamlit app code. You MUST try to adhere to BOTH the layout in the image as well as the description itself."
        else:
            role_description = "You are an expert programmer. Given an app description, you'll write clear and well-documented Streamlit app code."
        
        return role_description + "\n" + base_instructions

class OpenAIStreamingGenerator(StreamingGenerator):
    def __init__(self, logger):
        super().__init__(logger)
        self.client = OpenAI()
        self.messages=[]
        # Read model IDs from environment variables
        self.text_model = os.getenv('OPENAI_TEXT_MODEL')
        self.image_model = os.getenv('OPENAI_IMAGE_MODEL')
        
        if not self.text_model:
            raise ValueError("OPENAI_TEXT_MODEL environment variable must be set")
        if not self.image_model:
            raise ValueError("OPENAI_IMAGE_MODEL environment variable must be set")
        
        self.logger.info(f'OpenAI text model: {self.text_model}')
        self.logger.info(f'OpenAI image model: {self.image_model}')


    def create_stream(self, prompt, image, existing_code=None):
        model_id = self.text_model
        is_iteration = existing_code is not None

        if len(self.messages) == 0:
            sys_prompt = self.get_sys_prompt(image!=None, is_iteration=is_iteration)
            self.messages.append(
                {
                    "role": "system",
                    "content": sys_prompt
                }
            )
            self.logger.info(f'The system prompt: {sys_prompt}')

        user_query_content = []

        if image: 
            model_id = self.image_model
            user_query_content.append({
                "type": "image_url",
                "image_url": {
                    "url": image
                }
            })

        # Construct the user prompt
        user_text = prompt
        if is_iteration and existing_code:
            user_text = f"""Here is the existing Streamlit app code:

```python
{existing_code}
```

User request: {prompt}

Please update the code based on the user's request."""

        user_query_content.append({
            "type": "text",
            "text": user_text,
        })

        self.messages.append(
            {
                "role": "user",
                "content": user_query_content
            }
        )

        self.logger.info(f'messages: {self.messages}')

        stream = self.client.chat.completions.create(
            model=model_id, 
            #  TODO: if the user is vauge the model should just output in the text why they need to rephrase? or put this in the chat box on the side.
            messages=self.messages,
            max_completion_tokens=2000,
            frequency_penalty=0,
            presence_penalty=0,
            stream=True,
        )

        response = ""
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content != None:
                response = response + content
            yield content
        
        self.messages.append({
            "role": "assistant",
            "content": response
        })


class MockStreamingGenerator(StreamingGenerator):
    def __init__(self, logger):
        super().__init__(logger)

    def create_stream(self, prompt, image, existing_code=None):
        # Mock implementation of generate method
        mock_stream = ['', '<<', 'desc', '>>\n', 'The', ' app', ' displays', ' the', ' last', ' week', ' of', ' Google', "'s", ' stock', ' price', ' using', ' Yahoo', ' Finance', ' data', '.\n', '<', '</', 'desc', '>>\n\n',
        '<<', 'code', '>>\n', 'import', ' stream', 'lit', ' as', ' st', '\n', 'import', ' y', 'finance', ' as', ' y', 'f', '\n', 'from', ' datetime', ' import', ' datetime', ',', ' timedelta', '\n\n', 
        '#', ' Define', ' the', ' ticker', ' symbol', ' for', ' Google', '\n', 'ticker', '_symbol', ' =', " '", 'GO', 'O', 'GL', "'\n\n", 
        '#', ' Get', ' data', ' on', ' this', ' ticker', '\n', 'ticker', '_data', ' =', ' y', 'f', '.T', 'icker', '(t', 'icker', '_symbol', ')\n\n', 
        '#', ' Set', ' the', ' end', ' date', ' to', ' today', ' and', ' start', ' date', ' to', ' one', ' week', ' ago', '\n',
        'end', '_date', ' =', ' datetime', '.today', '().', 'date', '()\n', 'start', '_date', ' =', ' end', '_date', ' -', ' timedelta', '(days', '=', '7', ')\n\n', 
        '#', ' Get', ' the', ' historical', ' prices', ' for', ' this', ' ticker', '\n', 'ticker', '_df', ' =', ' ticker', '_data', '.history', '(period', "='", '1', 'd', "',", ' start', '=start', '_date', ',', ' end', '=end', '_date', ')\n\n',
        '#', ' Title', ' of', ' the', ' app', '\n', 'st', '.write', '(f', '"', '##', ' Last', ' Week', "'s", ' Stock', ' Price', ' for', ' {', 'ticker', '_symbol', '}")\n\n', 
        '#', ' Display', ' the', ' data', '\n', 'st', '.line', '_chart', '(t', 'icker', '_df', '.Close', ')\n', 
        '<', '</', 'code', '>>\n\n',
            '<<', 'deps', '>>\n', 'stream', 'lit', '\n', 'y', 'finance', '\n', '<', '</', 'deps', '>>', None]
        
        # uh let's always treat this generate method as a python generator
        for item in mock_stream:
            time.sleep(0.01)
            yield item
