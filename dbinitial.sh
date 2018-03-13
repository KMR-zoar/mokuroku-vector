#!/bin/bash

dbname="mokuroku.sqlite"
dbexist=`ls $dbname 2> /dev/null | wc -l`

createtable="CREATE TABLE 'mokuroku' ( 'path' TEXT, 'unixtime' INTEGER, 'size' INTEGER, 'md5sum' TEXT );"
createindex="CREATE UNIQUE INDEX mokurokuindex ON mokuroku(path);"

mokuroku="http://cyberjapandata.gsi.go.jp/xyz/std/mokuroku.csv.gz"
csvname="mokuroku.csv"


if [ $dbexist = "0" ]
then
   wget $mokuroku
   gunzip $csvname.gz
   touch $dbname
   sqlite3 $dbname "$createtable"
   sqlite3 $dbname ".separator ," ".import $csvname mokuroku"
   sqlite3 $dbname "$createindex"
   rm $csvname
fi

