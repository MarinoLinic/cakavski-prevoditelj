from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import pandas as pd
import chromedriver_autoinstaller


def scrape(url):
    options = Options()
    # options.add_argument('--headless')  # Run Chrome in headless mode
    chromedriver_autoinstaller.install()
    
    driver = webdriver.Chrome(options=options)
    driver.get(url)

    table = driver.find_element(By.CSS_SELECTOR,'table#forum_table')
    rows = table.find_element(By.CSS_SELECTOR,'tbody tr')

    data = []

    for row in rows:
        word = row.find_element(By.CSS_SELECTOR,'td:nth-child(1)').text
        description = row.find_element(By.CSS_SELECTOR,'td:nth-child(2)').text
        data.append([word, description])

    df = pd.DataFrame(data, columns=['Riječ', 'Opis'])
    driver.quit()
    return df
