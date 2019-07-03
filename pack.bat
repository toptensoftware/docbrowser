pushd .\docbrowser\
call uglifyjs db-script.js -o db-script.min.js -m --source-map "url='db-script.min.js.map'"
call cleancss -o db-combined.min.css db-layout.css db-appearance.css --source-map
popd