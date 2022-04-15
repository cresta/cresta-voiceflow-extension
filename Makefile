# info: https://opensource.com/article/18/8/what-how-makefile

# RUN DEFINE
MAKE = make --no-print-directory

# PHONY defines that target are not files
.PHONY: build

build:
	@echo [INFO] start build external-extension
	zip -r -FS ../external-extension.zip * --exclude .git/
	@echo [INFO] archive is available here:
	readlink -f ../external-extension.zip
	@echo [DONE] end build

