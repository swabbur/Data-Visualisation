import nltk
import pandas as pd
import re
import requests

from pathlib import Path
from zipfile import ZipFile

# Create working directory
data = Path("data")
data.mkdir(parents=True, exist_ok=True)

# Define zip file URLs
urls = [
    "https://corpus.byu.edu/tvtext/samples/tv-sources.zip",
    "https://corpus.byu.edu/tvtext/samples/tv-text.zip"
]

# Download zip files
downloads = data / "downloads"
if not downloads.exists():
    downloads.mkdir()

    for url in urls:
        print(f"Downloading {url} to {downloads}.")
        name = url.split("/")[-1]
        with open(downloads / name, "wb") as file:
            with requests.get(url, stream=True, allow_redirects=True) as response:
                response.raise_for_status()
                for chunk in response.iter_content(chunk_size=2**16):
                    file.write(chunk)

# Unpack zip files
unpacked = data / "unpacked"
if not unpacked.exists():
    unpacked.mkdir()

    for path in downloads.iterdir():
        print(f"Unpacking {path} to {unpacked}.")
        with ZipFile(path, "r") as file:
            file.extractall(unpacked)

# Parse text files
parsed = data / "parsed"
if not parsed.exists():
    parsed.mkdir()

    with open(unpacked / "tv_sources.txt", "r") as file:
        print("Parsing sources.")

        # Skip header/empty lines
        file.readline()
        file.readline()
        file.readline()

        # Parse data
        rows = []
        for line in file.readlines():

            values = line.split('\t')

            text_id = int(values[1])
            genres = ' '.join(map(str.lower, values[3].split(", ")))
            year = int(values[4])
            country = values[5]
            series = values[9]
            title = values[10].strip()

            rows.append([text_id, genres, year, country, series, title])

        columns = ["text_id", "genres", "year", "country", "series", "title"]
        data_frame = pd.DataFrame(rows, columns=columns)
        data_frame.to_csv(parsed / "sources.csv", index=False)

    with open(unpacked / "tv_text.txt", "r") as file:
        print("Parsing texts.")

        # Skip empty line
        file.readline()

        # Prepare regular expressions
        line_pattern = re.compile("@@(\\d+)\\s+(.*)", re.DOTALL)
        token_pattern = re.compile("\\w+")

        # Parse data
        rows = []
        for line in file.readlines():
            match = re.match(line_pattern, line)
            if match:
                text_id = int(match.group(1))
                tokens = match.group(2).split()
                words = []
                for token in tokens:
                    if re.match(token_pattern, token):
                        words.append(token.lower())
                text = ' '.join(words)
                rows.append([text_id, text])

        # Store data
        columns = ["text_id", "text"]
        data_frame = pd.DataFrame(rows, columns=columns)
        data_frame.to_csv(parsed / "texts.csv", index=False)

# Merge CSV files
dataset = data / "dataset.csv"
if not dataset.exists():
    sources = pd.read_csv(parsed / "sources.csv")
    texts = pd.read_csv(parsed / "texts.csv")
    merged = sources.merge(texts)
    merged = merged.drop("text_id", axis=1)
    merged.to_csv(dataset, index=False)
