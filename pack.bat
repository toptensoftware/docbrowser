pushd .\docbrowser\
call lessc --source-map db-layout.less db-layout.css
call lessc --source-map db-appearance.less db-appearance.css
call uglifyjs db-script.js -o db-script.min.js -m --source-map "url='db-script.min.js.map'"
call cleancss -o db-combined.min.css db-layout.css --input-source-map db-layout.css.map db-appearance.css --input-source-map db-appearance.css.map --source-map
popd