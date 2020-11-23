import csv
import json
import pandas as pd
df=pd.read_csv('data/yearly_word_count.csv')
word=df['word']
mylist = list(set(word))
results=[]
# results['results']=[]
#csvfile = open('data/yearly_word_count.csv', 'r')
jsonfile = open('file.json', 'w')
# fieldnames = ("word", "year", "count")
# reader = csv.DictReader(csvfile, fieldnames)
# i = 0
for x in mylist:
    a={}
    a["value"]=mylist.index(x)
    a["label"]=x
    results.append(a)
json.dump(results,jsonfile,indent=4)