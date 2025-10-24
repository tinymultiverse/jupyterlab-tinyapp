#!/usr/bin/env python

import os

os.execvp("/usr/local/bin/start-tinyapp.sh", ["anything"]) # Empty arg is not allowed
