PREFIX ?= /usr/local
DESTDIR ?=
VERSION ?= 0.0.0-dev
ARCH ?= unknown
CC ?= gcc
CFLAGS ?= -Wall -Wextra -Wpedantic -O2
LDFLAGS ?=

.PHONY: all install clean

all: bin/onekvm-plugin-marketplace

bin/onekvm-plugin-marketplace: src/cli.c
	mkdir -p bin
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $<

clean:
	rm -f bin/onekvm-plugin-marketplace

install: all
	install -Dm0755 bin/onekvm-plugin-marketplace $(DESTDIR)$(PREFIX)/bin/onekvm-plugin-marketplace
	install -Dm0644 web/page.js $(DESTDIR)$(PREFIX)/web/page.js
	install -Dm0644 web/shell.js $(DESTDIR)$(PREFIX)/web/shell.js
	install -d $(DESTDIR)$(PREFIX)
	sed -e 's/@ARCH@/$(ARCH)/g' -e 's/@VERSION@/$(VERSION)/g' \
		manifest.json.in >$(DESTDIR)$(PREFIX)/manifest.json
	chmod 0644 $(DESTDIR)$(PREFIX)/manifest.json
