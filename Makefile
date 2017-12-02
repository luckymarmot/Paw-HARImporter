identifier=com.luckymarmot.PawExtensions.HARImporter
extensions_dir=$(HOME)/Library/Containers/com.luckymarmot.Paw/Data/Library/Application Support/com.luckymarmot.Paw/Extensions/

all: build

build:
	./node_modules/.bin/webpack --bail --display-error-details
	cp README.md LICENSE ./build/$(identifier)/

install: clean build
	mkdir -p "$(extensions_dir)$(identifier)/"
	cp -r ./build/$(identifier)/* "$(extensions_dir)$(identifier)/"

archive: clean build
	cd ./build/; zip -r HARImporter.zip "$(identifier)/"

clean:
	rm -Rf ./build
