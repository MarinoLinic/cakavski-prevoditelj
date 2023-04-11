import requests
from bs4 import BeautifulSoup
import pandas as pd
import time

def scrape(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
    
    try:
        # Send a request to the site to establish a connection
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Use Beautiful Soup to extract the table content
        soup = BeautifulSoup(response.content, 'html.parser')
        table = soup.find('table', class_="table1")
        rows = table.find_all('tr')

        # Convert the table content into a Pandas dataframe
        data = []
        for row in rows:
            cols = row.find_all('td')
            if len(cols) == 2:  # check if the row is a data row
                cols = [col.text.strip() for col in cols]
                data.append(cols)
        df = pd.DataFrame(data, columns=['cakavski', 'stokavski'])

        return df
    
    
    except requests.exceptions.RequestException as e:
        # Print the error messages
        print(f"Error: {e}")
        print("Retrying in 5 seconds...")

        time.sleep(5)

        return scrape(url) # Retry after waiting 5 seconds
