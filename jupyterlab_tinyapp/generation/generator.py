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
import time
from typing import Generator
from openai import OpenAI

class StreamingGenerator:
    def __init__(self, logger: logging.Logger):
        self.logger = logger

    def create_stream(self, prompt, image) -> Generator[str, None, None]:
        # Abstract method to be implemented by subclasses
        raise NotImplementedError("Subclasses should implement this method.")

    def get_sys_prompt(self, include_image):
        sys_prompt = """
            You will respond in the following format: 
            - a one-liner about the app you've created in-between the tags <<desc>> <</desc>>,
            - the streamlit code itself in-between <<code>> <</code>>,
            - any necessary dependencies (without specific versions pinned) formatted for a requirements.txt in-between <<deps>> <</deps>>,
            - any notes NECESSARY for the user prior to their running the app (for example: since we are using X api, you need to provide your api key before running). They already know to use streamlit run app.py so don't include that. Notes go in-between <<notes>> <</notes>>.
            - If the user should be able to run without modifications then don't generate the notes nor the <<notes>> <</notes>> tags.
            - If the user is not describing an app that can be generated with Streamlit please output or if their image doesn't align with an app they're describing, then in one or two sentence(s) tell them that they can request apps not whatever they requested in-between <<retry>> <</retry>>
            - In your output DO NOT INCLUDE MARKDOWN FORMATTING like ```python ... ```
            - IMPORTANT: EVERY TAG SHOULD HAVE A CORRESPONDING CLOSING TAG with a backslash \ like <<code>> import numpy <</code>>
            - ALSO: there should be no trailing or leading whitespace/newlines between tags and the content they encapsulate
            
            Take a deep breath, think step by step, you got this!
        """
        if include_image:
            return "You are an expert programmer. Given an app description and an image depicting the required layout, you'll write clear and well-documented Streamlit app code. You MUST try to adhere to BOTH the layout in the image as well as the description itself.\n" + sys_prompt

        return "You are an expert programmer. Given an app description, you'll write clear and well-documented Streamlit app code.\n" + sys_prompt

class OpenAIStreamingGenerator(StreamingGenerator):
    def __init__(self, logger):
        super().__init__(logger)
        self.client = OpenAI()
        self.messages=[]

    def create_stream(self, prompt, image):
        model_id = "gpt-4-turbo-2024-04-09"

        if len(self.messages) == 0:
            sys_prompt = self.get_sys_prompt(image!=None)
            self.messages.append(
                {
                    "role": "system",
                    "content": sys_prompt
                }
            )
            self.logger.info(f'The system prompt: {sys_prompt}')

        user_query_content = []

        if image: 
            model_id = "gpt-4-vision-preview"
            user_query_content.append({
                "type": "image_url",
                "image_url": {
                    "url": image
                }
            })

        user_query_content.append({
            "type": "text",
            "text": prompt,
        })

        self.messages.append(
            {
                "role": "user",
                "content": user_query_content
            }
        )

        self.logger.info(f'messages: {self.messages}')

        stream = self.client.chat.completions.create(
            # TODO: pull out into env vars
            model=model_id, 
            #  TODO: if the user is vauge the model should just output in the text why they need to rephrase? or put this in the chat box on the side.
            messages=self.messages,
            temperature=0,
            max_tokens=2000,
            top_p=0,
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

    def create_stream(self, prompt, image):
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
