#!/usr/bin/env bash

cd src/www/

minify index.html > setup.min.html

gzip -c9 setup.min.html > setup_html && xxd -i setup_html > setup_html.h && rm setup_html && sed -i -e 's/unsigned char setup_html\[]/const uint8_t setup_html[] PROGMEM/' setup_html.h && sed -i -e 's/unsigned int setup_html_len/const unsigned int setup_html_len/' setup_html.h
rm setup_html.h-e
rm setup.min.html

echo "setup_html.h GENERATED";
