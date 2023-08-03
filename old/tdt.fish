#!/usr/bin/env fish

# Usage: `source ./tdt.fish` then `tdt <command>`
# <commands> are: `start`, `stop`,
# or a request type followed by any number of paths, each followed by request body (if method != `GET`)
# (eg.: `GET doc tag`, `POST tag '{"label": "Inbox"}'`)

function tdt
    if test (count $argv) -lt 1
        echo -e "\e[31mNo command specified\e[0m"
    else
        if test $argv[1] = 'start'
            set -lx TRIDOC_PWD "pw123"
            docker-compose down
            docker-compose build
            docker-compose up -d
        else if test $argv[1] = 'stop'
            docker-compose down
        else if test $argv[1] = 'GET'
            for path in $argv[2..-1]
                echo -e "\e[36mGET /"$path":\e[0m"
                curl -s "http://localhost:8000/$path" -H 'Connection: keep-alive' -H 'Authorization: Basic dHJpZG9jOnB3MTIz' \
                | node -e "s=process.openStdin();d=[];s.on('data',c=>d.push(c));s.on('end',()=>{console.log(require('util').inspect((JSON.parse(d.join(''))),{colors:true,depth:4,sorted:true}), '\n')})"
            end
        else
            set -l args $argv[2..-1]
            set -l i 1
            while test "$i" -lt (count $args)
                set p $args[$i]
                set load $args[(math "$i+1")]
                echo -e "\e[36m$argv[1] /$p: $load\e[0m"
                curl -s "http://localhost:8000/$p" -X $argv[1] -d "$load" -H "Content-Type: application/json" -H 'Connection: keep-alive' -H 'Authorization: Basic dHJpZG9jOnB3MTIz' \
                | node -e "s=process.openStdin();d=[];s.on('data',c=>d.push(c));s.on('end',()=>{console.log(require('util').inspect((JSON.parse(d.join(''))),{colors:true,depth:4,sorted:true}), '\n')})"
                set i (math "$i+2")
            end
        end
    end
end