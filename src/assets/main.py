from scrape import scrape
import pandas as pd


alphabet = 'abcčćdđefghijklmnoprstštuvzž'
dfs = []

for char in alphabet:
    url = f'https://forum.lokalpatrioti-rijeka.com/cakavski-rjecnik.php?first_char={char}'
    df = scrape(url)
    dfs.append(df)

df_final = pd.concat(dfs, ignore_index=True)

df_final.to_csv('cakavski-rjecnik.csv', index=False)

print(df_final)
