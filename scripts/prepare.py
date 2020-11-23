import nltk
import pandas
import requests
import shutil
import re

from chardet.universaldetector import UniversalDetector
from pathlib import Path
from zipfile import ZipFile


def download_all(urls: [str], target_directory: Path):
    """Download the online resources and store them in the target directory."""
    for url in urls:
        file_path = target_directory / url.split("/")[-1]
        if not file_path.exists():
            print(f"Downloading {url} to {file_path}.")
            with requests.get(url, stream=True, allow_redirects=True) as response:
                response.raise_for_status()
                with file_path.open("wb") as file:
                    for chunk in response.iter_content(chunk_size=2 ** 16):
                        file.write(chunk)


def unpack_all(source_directory: Path, target_directory: Path):
    """Unpack all zip files in the source directory and store their contents in the target directory."""
    for zip_path in source_directory.iterdir():
        if zip_path.suffix == ".zip":
            with ZipFile(zip_path) as zip_file:
                for compressed_file in zip_file.filelist:
                    name = compressed_file.filename
                    target_path = target_directory / name
                    if not target_path.exists():
                        print(f"Unpacking {name} from {zip_path} to {target_path}")
                        zip_file.extract(compressed_file, str(target_directory))


def get_encoding(file_path: Path):
    """Determine the encoding of the file at the given path."""
    with file_path.open("rb") as txt_file:
        detector = UniversalDetector()
        for line in txt_file.readlines():
            detector.feed(line)
            if detector.done:
                break
        result = detector.close()
        return result["encoding"]


def convert_all(source_directory: Path, target_directory: Path):
    """Convert all text files in the source directory to UTF-8 encoded CSV files."""
    for txt_path in source_directory.iterdir():
        target_path = (target_directory / txt_path.name).with_suffix(".csv")
        if not target_path.exists():
            print(f"Converting {txt_path} to {target_path}")
            encoding = get_encoding(txt_path)
            data_frame = pandas.read_table(str(txt_path), encoding=encoding)
            data_frame.to_csv(target_path, encoding="utf-8", index=False)


def clean_database(data_frame: pandas.DataFrame):
    """Clean a database data frame by naming and re-ordering the columns."""
    data_frame.columns = ["text_id", "id", "word_id"]
    return data_frame[["text_id", "word_id"]]


def clean_lexicon(data_frame: pandas.DataFrame):
    """Clean a lexicon data frame by dropping unnecessary rows and columns, and renaming those that remain."""
    data_frame.drop(index=0, inplace=True)
    data_frame.drop(columns=["wordCS"], inplace=True)
    data_frame.rename(columns={"wordID": "word_id", "date": "year", "Pos": "pos"}, inplace=True)
    return data_frame


def clean_sources(data_frame: pandas.DataFrame):
    """Clean a sources data frame by dropping unnecessary rows and columns, and renaming those that remain."""
    data_frame.drop(index=0, inplace=True)
    data_frame.drop(columns=["fileID", "language(s)", "IMDB"], inplace=True)
    if "seriesID" in data_frame.columns:
        data_frame.drop(columns=["seriesID"], inplace=True)
    data_frame.rename(columns={"textID": "text_id", "#words": "word_count", "date": "year"}, inplace=True)
    return data_frame


def clean_all(source_directory: Path, target_directory: Path, clean_functions: dict):
    """Clean the files in the source directory and store their cleaned versions in the target directory. Simply copies
    the file when no associated cleaning function is available."""
    for source_path in source_directory.iterdir():
        name = source_path.name
        target_path = target_directory / name
        if not target_path.exists():
            if name in clean_functions:
                print(f"Cleaning {source_path} and storing it at {target_path}.")
                data_frame = pandas.read_csv(source_path)
                data_frame = clean_functions[name](data_frame)
                data_frame.to_csv(target_path, index=False)
            else:
                print(f"Copying {source_path} to {target_path}.")
                shutil.copy(source_path, target_path)


def to_occurrences(database: pandas.DataFrame, lexicon: pandas.DataFrame, sources: pandas.DataFrame, name: str):
    """Collect year-word pairs from the combination of data frames"""

    # Remove words other than adjectives (r), adverbs (j), nouns (n), and verbs (v).
    # pos_pattern = re.compile("^[rjnv].*$")
    # lexicon = lexicon[lexicon["pos"].str.match(pos_pattern) == True]

    # Remove words other than nouns (n) and verbs (v).
    pos_pattern = re.compile("^[nv].*$")
    lexicon = lexicon[lexicon["pos"].str.match(pos_pattern) == True]

    # Select required columns
    lexicon = lexicon[["word_id", "lemma"]]
    sources = sources[["text_id", "year"]]

    # Rename "lemma" column to "word"
    lexicon = lexicon.rename(columns={"lemma": "word"})

    # Download word corpora
    nltk.download("stopwords", quiet=True)
    nltk.download("words", quiet=True)

    # Remove stopwords and unusual words
    stopwords = set(word.lower() for word in nltk.corpus.stopwords.words())
    vocabulary = set(word.lower() for word in nltk.corpus.words.words() if word not in stopwords)
    lexicon = lexicon[lexicon["word"].str.lower().isin(vocabulary)]

    # Merge data frames
    occurrences = database\
        .merge(lexicon, on="word_id")\
        .merge(sources, on="text_id")\
        .drop(columns=["word_id", "text_id"])
    occurrences["source"] = name

    return occurrences


def generate_yearly_word_counts(source_directory: Path, target_directory: Path):
    """Generate a yearly-word-count dataset based on the movies and television datasets."""

    print(f"Generating yearly-word-count datasets at {target_directory}.")

    # Find occurrences in movies
    movies_db = pandas.read_csv(source_directory / "movies_db.csv")
    movies_lexicon = pandas.read_csv(source_directory / "movies_lexicon.csv")
    movies_sources = pandas.read_csv(source_directory / "movies_sources.csv")
    movies_occurrences = to_occurrences(movies_db, movies_lexicon, movies_sources, "movie")

    # Find occurrences in television series
    tv_db = pandas.read_csv(source_directory / "tv_db.csv")
    tv_lexicon = pandas.read_csv(source_directory / "tv_lexicon.csv")
    tv_sources = pandas.read_csv(source_directory / "tv_sources.csv")
    tv_occurrences = to_occurrences(tv_db, tv_lexicon, tv_sources, "tv")

    # Merge occurrences
    occurrences = pandas.concat([movies_occurrences, tv_occurrences])

    # Count yearly occurrences
    yearly_word_count = occurrences.groupby(occurrences.columns.tolist(), as_index=False).size()
    yearly_word_count.rename(columns={"size": "count"}, inplace=True)

    # Remove words with less than 10 total occurrences
    words = yearly_word_count["word"]
    counts = yearly_word_count["count"]
    yearly_word_count = yearly_word_count[counts.groupby(words).transform("sum") >= 10]

    # Remove words spread over less than 5 years
    words = yearly_word_count["word"]
    years = yearly_word_count["year"]
    yearly_word_count = yearly_word_count[years.groupby(words).transform("count") >= 5]

    # Store word list
    word_list = pandas.DataFrame(yearly_word_count["word"].unique(), columns=["word"])
    word_list.to_csv(target_directory.parent / "words.csv", index=False)

    # Store yearly counts per word
    target_directory.mkdir(parents=True, exist_ok=True)
    for (name, data_frame) in yearly_word_count.groupby("word"):
        target_path = target_directory / (name + ".csv")
        data_frame.to_csv(target_path, index=False)


def preprocess_all(source_directory: Path, target_directory: Path, preprocessing_tasks: dict):
    """Preprocess data files by generating proper datasets from them."""
    for (name, function) in preprocessing_tasks.items():
        target_path = target_directory / name
        if not target_path.exists():
            function(source_directory, target_path)


def main():
    """Download, unpack, convert, clean, and pre-process online resources for future visualisation."""

    # TODO: Add music lyrics (http://www.thegrammarlab.com/?nor-portfolio=song-lyrics-data-tables)

    data_dir = Path("data")
    data_dir.mkdir(parents=True, exist_ok=True)

    urls = [
        "https://corpus.byu.edu/moviestext/samples/movies-lexicon.zip",
        "https://corpus.byu.edu/moviestext/samples/movies-sources.zip",
        "https://corpus.byu.edu/moviestext/samples/movies-db.zip",
        "https://corpus.byu.edu/tvtext/samples/tv-lexicon.zip",
        "https://corpus.byu.edu/tvtext/samples/tv-sources.zip",
        "https://corpus.byu.edu/tvtext/samples/tv-db.zip",
    ]

    download_dir = data_dir / "downloaded"
    download_dir.mkdir(parents=True, exist_ok=True)
    download_all(urls, download_dir)

    unpack_dir = data_dir / "unpacked"
    unpack_dir.mkdir(parents=True, exist_ok=True)
    unpack_all(download_dir, unpack_dir)

    convert_dir = data_dir / "converted"
    convert_dir.mkdir(parents=True, exist_ok=True)
    convert_all(unpack_dir, convert_dir)

    clean_functions = {
        "movies_db.csv": clean_database,
        "movies_lexicon.csv": clean_lexicon,
        "movies_sources.csv": clean_sources,
        "tv_db.csv": clean_database,
        "tv_lexicon.csv": clean_lexicon,
        "tv_sources.csv": clean_sources,
    }

    clean_dir = data_dir / "cleaned"
    clean_dir.mkdir(parents=True, exist_ok=True)
    clean_all(convert_dir, clean_dir, clean_functions)

    preprocessing_tasks = {
        "yearly_word_count": generate_yearly_word_counts
    }

    preprocess_dir = data_dir / "preprocessed"
    preprocess_dir.mkdir(parents=True, exist_ok=True)
    preprocess_all(clean_dir, preprocess_dir, preprocessing_tasks)


if __name__ == '__main__':
    main()
