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

from enum import Enum, auto
import logging
from typing import Generator

#  TODO: Clean up with classes and improve the algorithm to avoid waiting
def extract_parts_from_string(input_string, keyword):
    """
    This function takes a string and a keyword, and returns three parts:
    1. The part of the string before the keyword
    2. The keyword itself
    3. The part of the string after the keyword
    """
    keyword_index = input_string.find(keyword)
    
    # If the keyword is not found, return the original string and empty strings for other parts
    if keyword_index == -1:
        return input_string, "", ""
    
    before_keyword = input_string[:keyword_index]
    after_keyword = input_string[keyword_index + len(keyword):]
    
    return before_keyword, keyword, after_keyword

def find_start_of_key(buffer, key):
    for i in range(len(key), 0, -1):
        start_index = buffer.find(key[:i])
        if start_index != -1:
            end_index = start_index + i
            return (start_index, end_index)
    return None, None


class RunMode(Enum):
    WAIT_FOR_START_TAG = auto()
    WAIT_FOR_END_TAG = auto()

class StreamParser:
    def __init__(self, logger: logging.Logger, stream: Generator[str, None, None]):
        self.logger = logger
        self.stream = stream
        self.buffer = ""
        self.run_mode = RunMode.WAIT_FOR_START_TAG

        # TODO: Update these to be regular expressions to match on surrounding whitespace
        self.tags = ["<<desc>>", "<</desc>>", "<<code>>", "<</code>>", "<<deps>>", "<</deps>>"]
        self.looking_for_tag_index = 0

    def __iter__(self):

        for chunk in self.stream:
            
            if chunk is None:
                self.logger.debug("chunk is None, skipping...")
                continue

            self.logger.debug(f'chunk: {chunk}')
            self.logger.debug(f'self.buffer: {self.buffer}')

            self.buffer += chunk

            if self.run_mode == RunMode.WAIT_FOR_START_TAG:
                # open_tag = "<<code>>"
                open_tag = self.tags[self.looking_for_tag_index]
                if open_tag in self.buffer:

                    start_tag_index = self.buffer.find(open_tag)
                    before_start_tag = self.buffer[:start_tag_index]
                    after_start_tag = self.buffer[start_tag_index + len(open_tag):]

                    if len(before_start_tag) > 0:
                        yield before_start_tag
                    
                    yield open_tag

                    # Update the buffer (only leaving data after the start_tag)
                    self.buffer = after_start_tag

                    self.run_mode = RunMode.WAIT_FOR_END_TAG
                    self.looking_for_tag_index += 1

            elif self.run_mode == RunMode.WAIT_FOR_END_TAG:
                # closing_tag = "<</code>>"
                closing_tag = self.tags[self.looking_for_tag_index]

                if closing_tag in self.buffer:
                    closing_tag_index = self.buffer.find(closing_tag)
                    before_closing_tag = self.buffer[:closing_tag_index] # pop this
                    after_closing_tag = self.buffer[closing_tag_index + len(closing_tag):]

                    if len(before_closing_tag) > 0:
                        yield before_closing_tag
                    yield closing_tag
                    self.buffer = after_closing_tag

                    self.looking_for_tag_index += 1
                    self.run_mode = RunMode.WAIT_FOR_START_TAG

                else:
                    # We didn't find the full closing tag, let's look for a partial tag
                    start_index, end_index = find_start_of_key(self.buffer, closing_tag)
                    found = start_index != None

                    if not found:
                        # Didn't find a partial closing tag, let's continue adding to the buffer - ACTUALLY, let's flush the buffer
                        if len(self.buffer) > 0:
                            yield self.buffer
                            self.buffer = ""
                        continue
                    else:
                        # If the partial closing tag has non-tag data after we need to flush
                        if end_index != len(self.buffer):
                            # We can't flush whole buffer bc it may have the start of the true end tag
                            yield self.buffer[:end_index]

                            # Remaining data.
                            # NOTE: if we don't do another find start of key here we will end up with
                            # scenarios where you may have some text in buffer before the true tag.
                            self.buffer = self.buffer[end_index:]

                        # We did find a partial tag (not a full tag or we wouldn't be here).
                        # The partial tag is at the end of the buffer so let's keep building on the buffer without flushing
